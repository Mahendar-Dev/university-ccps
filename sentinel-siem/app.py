import os
import io
import csv
from collections import defaultdict
from datetime import datetime, timedelta
from functools import wraps

import bcrypt
from flask import (Flask, render_template, request, redirect, url_for,
                    session, jsonify, flash, send_file, Response)
from flask_sqlalchemy import SQLAlchemy

import detector
import generator
import ml_detector
import geoip
import notifier

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SIEM_SECRET_KEY", os.urandom(24).hex())
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'siem.db')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.permanent_session_lifetime = timedelta(hours=8)

db = SQLAlchemy(app)

# ---------------------------------------------------------------- models --

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="Analyst")

    def check_password(self, pw):
        return bcrypt.checkpw(pw.encode(), self.password_hash.encode())


class Threat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    threat_type = db.Column(db.String(80), nullable=False)
    severity = db.Column(db.String(20), nullable=False)
    source_ip = db.Column(db.String(45))
    raw_log = db.Column(db.Text)
    matched_text = db.Column(db.String(255))
    mitre_id = db.Column(db.String(20))
    mitre_name = db.Column(db.String(120))
    detected_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default="Open")  # Open / Acknowledged / Resolved


class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80))
    action = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class Anomaly(db.Model):
    """Behavioral anomalies flagged by the ML layer (ml_detector.py), kept
    separate from signature-based Threat rows since they represent a
    different kind of evidence — a statistical outlier, not a rule match."""
    id = db.Column(db.Integer, primary_key=True)
    source_ip = db.Column(db.String(45))
    anomaly_score = db.Column(db.Float)
    event_count = db.Column(db.Integer)
    failed_login_count = db.Column(db.Integer)
    distinct_users = db.Column(db.Integer)
    signature_hits = db.Column(db.Integer)
    detected_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default="Open")


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    threat_type = db.Column(db.String(80))
    severity = db.Column(db.String(20))
    channel = db.Column(db.String(20))
    ok = db.Column(db.Boolean, default=False)
    detail = db.Column(db.String(255))
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)


# ------------------------------------------------------------- utilities --

def log_action(action):
    entry = AuditLog(username=session.get("username", "system"), action=action)
    db.session.add(entry)
    db.session.commit()


def login_required(f):
    @wraps(f)
    def wrapper(*a, **kw):
        if "username" not in session:
            return redirect(url_for("login"))
        return f(*a, **kw)
    return wrapper


def admin_required(f):
    @wraps(f)
    def wrapper(*a, **kw):
        if session.get("role") != "Admin":
            flash("Admin access required.", "error")
            return redirect(url_for("dashboard"))
        return f(*a, **kw)
    return wrapper


LOG_OFFSET_KEY = "_log_read_offset"


def ingest_new_lines():
    """Read any new lines appended to auth.log since last read.

    Two detection layers run over the same batch:
      1. Signature matching (detector.py) -> Threat rows, deduplicated.
      2. Behavioral anomaly detection (ml_detector.py) -> Anomaly rows,
         based on per-IP features aggregated across the whole batch (an
         Isolation Forest needs several points to judge what's "normal",
         so it runs once over the batch rather than line-by-line).

    Any newly-created Critical threat is also dispatched through
    notifier.py (webhook/email — both no-ops unless configured).
    """
    path = generator.LOG_PATH
    if not os.path.exists(path):
        return 0
    offset = app.config.get(LOG_OFFSET_KEY, 0)
    new_count = 0
    batch_lines = []
    sig_hits_by_ip = defaultdict(int)

    with open(path, "r") as f:
        f.seek(offset)
        for line in f:
            batch_lines.append(line)
            for match in detector.analyze_line(line):
                sig_hits_by_ip[match["source_ip"]] += 1
                dup = Threat.query.filter_by(
                    threat_type=match["threat_type"],
                    source_ip=match["source_ip"],
                    raw_log=match["raw_log"],
                ).first()
                if dup:
                    continue
                t = Threat(**match)
                db.session.add(t)
                new_count += 1

                if match["severity"] == "Critical" and app.config.get("ENABLE_NOTIFICATIONS", True):
                    for channel, ok, detail in notifier.dispatch(match):
                        db.session.add(Notification(threat_type=match["threat_type"],
                                                      severity=match["severity"],
                                                      channel=channel, ok=ok, detail=detail))
        app.config[LOG_OFFSET_KEY] = f.tell()

    if new_count:
        db.session.commit()

    if batch_lines and app.config.get("ENABLE_ML_DETECTION", True):
        anomalies = ml_detector.detect_anomalies(batch_lines, sig_hits_by_ip)
        for a in anomalies:
            dup = Anomaly.query.filter_by(source_ip=a["ip"],
                                           event_count=a["event_count"],
                                           failed_login_count=a["failed_login_count"]).first()
            if dup:
                continue
            db.session.add(Anomaly(source_ip=a["ip"], anomaly_score=a["anomaly_score"],
                                     event_count=a["event_count"],
                                     failed_login_count=a["failed_login_count"],
                                     distinct_users=a["distinct_users"],
                                     signature_hits=a["signature_hits"]))
        if anomalies:
            db.session.commit()

    return new_count


# ---------------------------------------------------------------- routes --

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            session.permanent = True
            session["username"] = user.username
            session["role"] = user.role
            log_action(f"Login success ({user.role})")
            return redirect(url_for("dashboard"))
        log_action(f"Failed login attempt for username '{username}'")
        flash("Invalid credentials.", "error")
    return render_template("login.html")


@app.route("/logout")
def logout():
    if "username" in session:
        log_action("Logout")
    session.clear()
    return redirect(url_for("login"))


@app.route("/")
@login_required
def dashboard():
    ingest_new_lines()
    total = Threat.query.count()
    critical = Threat.query.filter_by(severity="Critical").count()
    high = Threat.query.filter_by(severity="High").count()
    open_alerts = Threat.query.filter(Threat.status == "Open",
                                       Threat.severity.in_(["Critical", "High"])).count()
    open_anomalies = Anomaly.query.filter_by(status="Open").count()
    recent = Threat.query.order_by(Threat.detected_at.desc()).limit(10).all()
    return render_template("index.html", total=total, critical=critical,
                            high=high, open_alerts=open_alerts,
                            open_anomalies=open_anomalies, recent=recent)


@app.route("/logs")
@login_required
def logs():
    ingest_new_lines()
    page = request.args.get("page", 1, type=int)
    q = request.args.get("q", "", type=str).strip()
    sev = request.args.get("severity", "", type=str)

    query = Threat.query
    if q:
        like = f"%{q}%"
        query = query.filter(db.or_(Threat.threat_type.ilike(like),
                                     Threat.source_ip.ilike(like)))
    if sev:
        query = query.filter_by(severity=sev)

    pagination = query.order_by(Threat.detected_at.desc()).paginate(
        page=page, per_page=20, error_out=False)
    return render_template("logs.html", pagination=pagination, q=q, sev=sev)


@app.route("/threats/delete/<int:tid>", methods=["POST"])
@login_required
def delete_threat(tid):
    t = Threat.query.get_or_404(tid)
    db.session.delete(t)
    db.session.commit()
    log_action(f"Deleted threat #{tid} ({t.threat_type})")
    return jsonify({"ok": True})


@app.route("/threats/clear_all", methods=["POST"])
@admin_required
def clear_all():
    n = Threat.query.delete()
    db.session.commit()
    log_action(f"Cleared entire threat database ({n} records)")
    return jsonify({"ok": True, "cleared": n})


@app.route("/threats/export_csv")
@login_required
def export_csv():
    rows = Threat.query.order_by(Threat.detected_at.desc()).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["ID", "Detected At", "Threat Type", "Severity", "Source IP",
                      "MITRE ID", "MITRE Technique", "Status", "Matched Text"])
    for t in rows:
        writer.writerow([t.id, t.detected_at, t.threat_type, t.severity, t.source_ip,
                          t.mitre_id, t.mitre_name, t.status, t.matched_text])
    log_action("Exported threat log to CSV")
    return Response(buf.getvalue(), mimetype="text/csv",
                     headers={"Content-Disposition": "attachment; filename=threats.csv"})


@app.route("/alerts")
@login_required
def alerts():
    ingest_new_lines()
    active = Threat.query.filter(Threat.status.in_(["Open", "Acknowledged"]),
                                  Threat.severity.in_(["Critical", "High"])
                                  ).order_by(Threat.detected_at.desc()).all()
    return render_template("alerts.html", alerts=active)


@app.route("/alerts/acknowledge/<int:tid>", methods=["POST"])
@login_required
def acknowledge(tid):
    t = Threat.query.get_or_404(tid)
    t.status = "Acknowledged"
    db.session.commit()
    log_action(f"Acknowledged alert #{tid} ({t.threat_type})")
    return jsonify({"ok": True})


@app.route("/alerts/resolve/<int:tid>", methods=["POST"])
@login_required
def resolve(tid):
    t = Threat.query.get_or_404(tid)
    t.status = "Resolved"
    db.session.commit()
    log_action(f"Resolved alert #{tid} ({t.threat_type})")
    return jsonify({"ok": True})


@app.route("/anomalies")
@login_required
def anomalies():
    ingest_new_lines()
    rows = Anomaly.query.filter_by(status="Open").order_by(Anomaly.anomaly_score.desc()).limit(50).all()
    return render_template("anomalies.html", anomalies=rows)


@app.route("/anomalies/dismiss/<int:aid>", methods=["POST"])
@login_required
def dismiss_anomaly(aid):
    a = Anomaly.query.get_or_404(aid)
    a.status = "Dismissed"
    db.session.commit()
    log_action(f"Dismissed anomaly on {a.source_ip}")
    return jsonify({"ok": True})


@app.route("/threat_map")
@login_required
def threat_map():
    ingest_new_lines()
    ips = [row[0] for row in db.session.query(Threat.source_ip).distinct().all() if row[0] and row[0] != "unknown"]
    geo = geoip.lookup_many(ips)
    points = []
    for ip, g in geo.items():
        if not g or (g["lat"] == 0 and g["lon"] == 0):
            continue
        count = Threat.query.filter_by(source_ip=ip).count()
        max_sev = (db.session.query(Threat.severity)
                   .filter_by(source_ip=ip)
                   .all())
        sevs = [s[0] for s in max_sev]
        top_sev = "Critical" if "Critical" in sevs else ("High" if "High" in sevs else
                   ("Medium" if "Medium" in sevs else "Low"))
        points.append({"ip": ip, "lat": g["lat"], "lon": g["lon"],
                        "city": g["city"], "country": g["country"],
                        "count": count, "severity": top_sev})
    return render_template("threat_map.html", points=points, live=geoip.LIVE_LOOKUP)


@app.route("/reports")
@login_required
def reports():
    ingest_new_lines()
    by_status = {
        "Open": Threat.query.filter_by(status="Open").count(),
        "Acknowledged": Threat.query.filter_by(status="Acknowledged").count(),
        "Resolved": Threat.query.filter_by(status="Resolved").count(),
    }
    by_severity = {
        sev: Threat.query.filter_by(severity=sev).count()
        for sev in ["Critical", "High", "Medium", "Low"]
    }
    top_ips = (db.session.query(Threat.source_ip, db.func.count(Threat.id).label("c"))
               .group_by(Threat.source_ip).order_by(db.text("c DESC")).limit(5).all())
    return render_template("reports.html", by_status=by_status,
                            by_severity=by_severity, top_ips=top_ips)


@app.route("/download_report")
@login_required
def download_report():
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = [Paragraph("Mini SIEM Pro — Threat Report", styles["Title"]),
                Paragraph(f"Generated {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} "
                          f"by {session.get('username')}", styles["Normal"]),
                Spacer(1, 16)]

    rows = Threat.query.order_by(Threat.detected_at.desc()).limit(200).all()
    data = [["ID", "Type", "Severity", "Source IP", "MITRE", "Status", "Detected At"]]
    for t in rows:
        data.append([t.id, t.threat_type, t.severity, t.source_ip,
                      t.mitre_id or "-", t.status, t.detected_at.strftime("%Y-%m-%d %H:%M")])

    table = Table(data, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e2327")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f2f2")]),
    ]))
    elements.append(table)
    doc.build(elements)
    buf.seek(0)
    log_action("Downloaded PDF threat report")
    fname = f"siem_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    return send_file(buf, as_attachment=True, download_name=fname, mimetype="application/pdf")


@app.route("/settings")
@login_required
def settings():
    audit = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(30).all()
    notifications = Notification.query.order_by(Notification.sent_at.desc()).limit(10).all()
    return render_template(
        "settings.html",
        signatures=detector.all_signatures(),
        audit=audit,
        notifications=notifications,
        ml_enabled=app.config.get("ENABLE_ML_DETECTION", True),
        notif_enabled=app.config.get("ENABLE_NOTIFICATIONS", True),
        webhook_configured=bool(notifier.WEBHOOK_URL),
        smtp_configured=bool(notifier.SMTP_HOST and notifier.SMTP_USER),
    )


@app.route("/settings/toggle_ml", methods=["POST"])
@login_required
def toggle_ml():
    app.config["ENABLE_ML_DETECTION"] = not app.config.get("ENABLE_ML_DETECTION", True)
    log_action(f"ML anomaly detection {'enabled' if app.config['ENABLE_ML_DETECTION'] else 'disabled'}")
    return jsonify({"ok": True, "enabled": app.config["ENABLE_ML_DETECTION"]})


@app.route("/settings/toggle_notifications", methods=["POST"])
@login_required
def toggle_notifications():
    app.config["ENABLE_NOTIFICATIONS"] = not app.config.get("ENABLE_NOTIFICATIONS", True)
    log_action(f"Alert notifications {'enabled' if app.config['ENABLE_NOTIFICATIONS'] else 'disabled'}")
    return jsonify({"ok": True, "enabled": app.config["ENABLE_NOTIFICATIONS"]})


@app.route("/settings/generate_samples", methods=["POST"])
@login_required
def generate_samples():
    lines = generator.generate_batch(20)
    ingest_new_lines()
    log_action("Generated 20 sample log lines")
    return jsonify({"ok": True, "count": len(lines)})


@app.route("/settings/clear_db", methods=["POST"])
@admin_required
def clear_db():
    Threat.query.delete()
    db.session.commit()
    log_action("DANGER ZONE: cleared entire threat database from Settings")
    return jsonify({"ok": True})


# --------------------------------------------------------------- JSON API --

@app.route("/api/stats")
@login_required
def api_stats():
    ingest_new_lines()
    return jsonify({
        "total": Threat.query.count(),
        "critical": Threat.query.filter_by(severity="Critical").count(),
        "high": Threat.query.filter_by(severity="High").count(),
        "medium": Threat.query.filter_by(severity="Medium").count(),
        "low": Threat.query.filter_by(severity="Low").count(),
        "open_alerts": Threat.query.filter(Threat.status == "Open",
                                            Threat.severity.in_(["Critical", "High"])).count(),
        "open_anomalies": Anomaly.query.filter_by(status="Open").count(),
    })


@app.route("/api/recent_threats")
@login_required
def api_recent_threats():
    rows = Threat.query.order_by(Threat.detected_at.desc()).limit(10).all()
    return jsonify([{
        "id": t.id, "type": t.threat_type, "severity": t.severity,
        "ip": t.source_ip, "status": t.status,
        "time": t.detected_at.strftime("%Y-%m-%d %H:%M:%S"),
        "mitre": t.mitre_id,
    } for t in rows])


@app.route("/api/threat_distribution")
@login_required
def api_threat_distribution():
    results = (db.session.query(Threat.threat_type, db.func.count(Threat.id))
               .group_by(Threat.threat_type).all())
    return jsonify({t: c for t, c in results})


@app.route("/api/severity_breakdown")
@login_required
def api_severity_breakdown():
    results = (db.session.query(Threat.severity, db.func.count(Threat.id))
               .group_by(Threat.severity).all())
    return jsonify({s: c for s, c in results})


# ------------------------------------------------------------------ setup --

def seed_users():
    if User.query.count() == 0:
        admin_pw = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode()
        analyst_pw = bcrypt.hashpw(b"analyst456", bcrypt.gensalt()).decode()
        db.session.add(User(username="admin", password_hash=admin_pw, role="Admin"))
        db.session.add(User(username="analyst", password_hash=analyst_pw, role="Analyst"))
        db.session.commit()


with app.app_context():
    os.makedirs(os.path.join(BASE_DIR, "instance"), exist_ok=True)
    os.makedirs(os.path.join(BASE_DIR, "logs"), exist_ok=True)
    db.create_all()
    seed_users()


if __name__ == "__main__":
    app.run(debug=True, port=5000)

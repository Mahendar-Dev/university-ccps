"""
ml_detector.py — Unsupervised anomaly detection layer for Mini SIEM Pro.

Signature-based detection (detector.py) only catches KNOWN attack patterns.
Real SOC platforms pair that with a behavioral/statistical layer that can
flag activity nobody wrote a rule for — e.g. an IP suddenly making far more
requests than everyone else, or a user account failing logins at an unusual
rate. This module implements that second layer with an Isolation Forest,
an algorithm well suited to this because it doesn't need labeled attack
data: it isolates points that are "few and different" in feature space,
which is exactly what a bursty/abnormal source looks like.

Features per source IP, computed over a sliding window of recent raw log
lines:
  1. event_count        — how many log lines from this IP in the window
  2. failed_login_count — how many "failed login" / "authentication failure"
                            lines from this IP
  3. distinct_users     — how many distinct usernames this IP touched
  4. signature_hits     — how many detector.py signatures this IP triggered

This is intentionally simple and explainable (important for a SOC — you
must be able to justify why something was flagged), which is also easier
to defend in an FYP viva than a black-box deep model.
"""
import re
from collections import defaultdict
from datetime import datetime

import numpy as np
from sklearn.ensemble import IsolationForest

_USER_RE = re.compile(r"user[:\s]+([a-zA-Z0-9_\-.]+)", re.IGNORECASE)
_FAILED_RE = re.compile(r"(failed login|authentication failure)", re.IGNORECASE)


def _extract_features(raw_lines, sig_hits_by_ip, ip_re=re.compile(r"(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})")):
    """Aggregate raw log lines into a per-IP feature matrix."""
    stats = defaultdict(lambda: {"event_count": 0, "failed_login_count": 0, "users": set()})

    for line in raw_lines:
        m = ip_re.search(line)
        if not m:
            continue
        ip = m.group(1)
        stats[ip]["event_count"] += 1
        if _FAILED_RE.search(line):
            stats[ip]["failed_login_count"] += 1
        um = _USER_RE.search(line)
        if um:
            stats[ip]["users"].add(um.group(1))

    ips = list(stats.keys())
    rows = []
    for ip in ips:
        s = stats[ip]
        rows.append([
            s["event_count"],
            s["failed_login_count"],
            len(s["users"]),
            sig_hits_by_ip.get(ip, 0),
        ])
    return ips, np.array(rows, dtype=float)


def detect_anomalies(raw_lines, sig_hits_by_ip, contamination=0.15, min_samples=6):
    """
    Run Isolation Forest over the given batch of raw log lines.

    Returns a list of dicts: {ip, anomaly_score, event_count, failed_login_count,
    distinct_users, signature_hits} for every IP flagged as anomalous.
    Requires at least `min_samples` distinct source IPs to fit a meaningful
    model — with too few points every point looks "anomalous" by definition,
    which would just be noise.
    """
    ips, X = _extract_features(raw_lines, sig_hits_by_ip)
    if len(ips) < min_samples:
        return []

    model = IsolationForest(contamination=contamination, random_state=42, n_estimators=150)
    preds = model.fit_predict(X)          # -1 = anomaly, 1 = normal
    scores = model.decision_function(X)    # lower = more anomalous

    results = []
    for i, ip in enumerate(ips):
        if preds[i] == -1:
            results.append({
                "ip": ip,
                "anomaly_score": round(float(-scores[i]), 4),  # flip sign: higher = more anomalous
                "event_count": int(X[i][0]),
                "failed_login_count": int(X[i][1]),
                "distinct_users": int(X[i][2]),
                "signature_hits": int(X[i][3]),
                "detected_at": datetime.utcnow(),
            })
    results.sort(key=lambda r: r["anomaly_score"], reverse=True)
    return results

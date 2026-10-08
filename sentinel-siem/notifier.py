"""
notifier.py — Outbound alerting for Mini SIEM Pro.

When a Critical-severity threat is detected, a real SOC tool pages someone
instead of waiting for an analyst to notice it on a dashboard. This module
supports two channels, both optional and off by default so the app runs
with zero configuration out of the box:

  - WEBHOOK_URL   : POSTs a JSON payload (works with Slack/Discord/Teams
                     incoming webhooks, or any custom endpoint).
  - SMTP settings  : sends a real email via smtplib if configured.

If neither is configured, notifications are still recorded (via the
caller, in the Notification table) so the audit trail and UI stay
consistent — only the outbound delivery is skipped.
"""
import os
import smtplib
import json
from email.mime.text import MIMEText

import requests

WEBHOOK_URL = os.environ.get("SIEM_WEBHOOK_URL", "")

SMTP_HOST = os.environ.get("SIEM_SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SIEM_SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SIEM_SMTP_USER", "")
SMTP_PASS = os.environ.get("SIEM_SMTP_PASS", "")
ALERT_EMAIL_TO = os.environ.get("SIEM_ALERT_EMAIL_TO", "")


def notify_webhook(threat):
    if not WEBHOOK_URL:
        return False, "No webhook configured"
    payload = {
        "text": f"🚨 *{threat['severity']} threat detected*: {threat['threat_type']} "
                f"from {threat['source_ip']} (MITRE {threat.get('mitre_id', '-')})"
    }
    try:
        r = requests.post(WEBHOOK_URL, data=json.dumps(payload),
                           headers={"Content-Type": "application/json"}, timeout=5)
        return r.ok, f"HTTP {r.status_code}"
    except Exception as e:
        return False, str(e)


def notify_email(threat):
    if not (SMTP_HOST and SMTP_USER and SMTP_PASS and ALERT_EMAIL_TO):
        return False, "SMTP not configured"
    body = (f"Threat Type: {threat['threat_type']}\n"
            f"Severity: {threat['severity']}\n"
            f"Source IP: {threat['source_ip']}\n"
            f"MITRE ATT&CK: {threat.get('mitre_id', '-')} ({threat.get('mitre_name', '-')})\n"
            f"Detected At: {threat.get('detected_at', '-')}\n")
    msg = MIMEText(body)
    msg["Subject"] = f"[Mini SIEM Pro] {threat['severity']} alert: {threat['threat_type']}"
    msg["From"] = SMTP_USER
    msg["To"] = ALERT_EMAIL_TO
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=8) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, [ALERT_EMAIL_TO], msg.as_string())
        return True, "Sent"
    except Exception as e:
        return False, str(e)


def dispatch(threat):
    """Try both channels; return a list of (channel, ok, detail) results."""
    results = []
    ok, detail = notify_webhook(threat)
    results.append(("webhook", ok, detail))
    ok, detail = notify_email(threat)
    results.append(("email", ok, detail))
    return results

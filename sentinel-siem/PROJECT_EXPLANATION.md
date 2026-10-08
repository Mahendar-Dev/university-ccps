# 📖 Mini SIEM Pro — Project Explanation

*A plain-English guide to what this project is, why it exists, and how it works — useful for reports, presentations, or explaining the project to someone unfamiliar with it.*

---

## What is it?

**Mini SIEM Pro** is a web-based Security Operations Center (SOC) monitoring tool. It simulates what companies like banks, tech firms, or hospitals use to detect cyberattacks on their systems in real time — but built at a small, understandable scale for learning and demonstration purposes.

In simple terms: it reads security log data (like login attempts, error messages, network activity), automatically detects suspicious/malicious patterns in that data, and shows the results on a dashboard so a security analyst can investigate and respond.

---

## The Problem It Solves

Real SIEM tools (Splunk, Microsoft Sentinel, Elastic Security) are:

- **Expensive** — licensing costs thousands of dollars
- **Complex to deploy** — need servers, multiple services, cloud infrastructure
- **Hard to learn from** — the actual detection logic is hidden behind a huge enterprise product

This makes it very hard for a student to actually understand *how* threat detection works under the hood. Mini SIEM Pro solves this by implementing the same core ideas — log analysis, pattern matching, anomaly detection, alerting — in a small Python codebase that runs on a single laptop with no paid services.

---

## How It Works (Step by Step)

1. **Log Generation** — Since we don't have a real live network to attack, `generator.py` creates realistic fake security logs — a mix of normal activity (successful logins, backups) and attack activity (SQL injection attempts, brute force, malware signatures, etc.), written to a text file just like a real server's `auth.log` would look.

2. **Detection — Layer 1 (Signature Matching)** — `detector.py` scans every new log line against 16 predefined attack patterns (regular expressions). For example, if a line contains `"failed login"` repeated in a certain way, it's flagged as a **Brute Force Attempt**. Each detected threat is tagged with a **MITRE ATT&CK ID** — a globally recognized naming standard used by real cybersecurity teams (e.g., SQL Injection = T1190).

3. **Detection — Layer 2 (Machine Learning)** — `ml_detector.py` uses a machine learning algorithm called **Isolation Forest**. Instead of looking for known patterns, it looks at *behavior*: how many requests came from an IP, how many failed logins, how many different usernames it tried. If an IP's behavior looks statistically unusual compared to everyone else — even if it didn't match any known signature — it gets flagged as an **anomaly**. This catches new/unknown attack styles that regex rules would miss.

4. **Storage** — Every detected threat and anomaly is saved into a SQLite database (via SQLAlchemy), along with severity level, source IP, timestamp, and status (Open/Acknowledged/Resolved).

5. **Alerting** — If a **Critical** severity threat is detected, the system can automatically send a notification through a Slack/Teams webhook or email (optional, off by default).

6. **Dashboard & Analyst Actions** — A Flask web app displays everything: live stats, charts, a searchable threat log, an alert triage queue (Acknowledge/Resolve), a geographic map of attacker IPs, and downloadable PDF/CSV reports. Two user roles exist — **Admin** (full control) and **Analyst** (can investigate but can't wipe data) — this is called **Role-Based Access Control**.

7. **Audit Trail** — Every action (login, delete, export, resolve) is logged, so there's full accountability — just like in a real SOC.

---

## Why Two Detection Layers?

This is the key technical idea of the project, and worth explaining clearly:

| Layer | Catches | Limitation |
|---|---|---|
| **Signature matching** (regex) | Known attack patterns — precise, explainable, fast | Can only catch what someone already wrote a rule for |
| **ML anomaly detection** (Isolation Forest) | Unusual *behavior* even with no matching rule | Needs enough data points to judge what's "normal" |

Real SOC tools use exactly this hybrid approach, so implementing both — and letting you turn each on/off independently in Settings — demonstrates an understanding of *why* modern security tools don't rely on just one detection method.

---

## Tech Stack Summary

| Purpose | Technology |
|---|---|
| Backend / Web framework | Python, Flask |
| Database | SQLite (via SQLAlchemy) |
| Password security | bcrypt hashing |
| Machine Learning | scikit-learn (Isolation Forest) |
| Charts | Chart.js |
| Map | Leaflet.js |
| PDF Reports | ReportLab |

---

## In One Sentence (for a viva / interview)

> Mini SIEM Pro is a lightweight security monitoring platform that combines rule-based signature detection with unsupervised machine learning to identify both known and unknown attack patterns in log data, and presents the results through a role-based web dashboard with alerting, reporting, and full audit logging — replicating the core architecture of enterprise SIEM tools like Splunk or Sentinel at a scale a single student can build, test, and fully explain.

---

## Related Documents

- **`README.md`** — technical setup, features, architecture diagram, and API reference
- **`MiniSIEM_Pro_FYP_Report.docx`** — full academic report (literature review, system design, testing/evaluation, results)

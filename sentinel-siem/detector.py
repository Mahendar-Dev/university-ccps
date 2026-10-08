"""
detector.py — Signature-based threat detection engine for Mini SIEM Pro.

Each rule is a regex signature mapped to a threat type, severity, and a
MITRE ATT&CK technique ID, which is what most real SIEM/EDR products
(Splunk, Sentinel, Elastic Security) use to give analysts a standard
vocabulary for what was detected.
"""
import re
from datetime import datetime

# (threat_type, severity, regex pattern, MITRE ATT&CK ID, technique name)
SIGNATURES = [
    ("Brute Force Attempt", "High",
     r"(failed login|authentication failure|invalid password|too many login attempts)",
     "T1110", "Brute Force"),

    ("SQL Injection", "Critical",
     r"(union\s+select|drop\s+table|or\s+1\s*=\s*1|--\s*$|xp_cmdshell|information_schema)",
     "T1190", "Exploit Public-Facing Application"),

    ("Port Scan", "Medium",
     r"(nmap|masscan|syn flood|port scan detected|zmap)",
     "T1046", "Network Service Discovery"),

    ("Malware Detection", "Critical",
     r"(ransomware|rootkit|trojan|worm\.exe|payload executed|\.exe\.tmp)",
     "T1204", "User Execution"),

    ("Unauthorized Access", "High",
     r"(privilege escalation|sudo su|permission denied.*root|unauthorized admin access)",
     "T1068", "Exploitation for Privilege Escalation"),

    ("XSS Attack", "Medium",
     r"(<script>|onerror=|javascript:|document\.cookie|<img\s+src=x)",
     "T1059.007", "JavaScript Injection"),

    ("DDoS Attack", "Critical",
     r"(traffic spike detected|ddos|syn flood attack|udp flood|abnormal request rate)",
     "T1498", "Network Denial of Service"),

    ("C2 Communication", "Critical",
     r"(beacon detected|c2 checkin|exfiltration|data staged|suspicious outbound connection)",
     "T1071", "Application Layer Protocol (C2)"),

    ("Phishing Attempt", "High",
     r"(credential harvest|phishing link clicked|fake login page|spoofed sender)",
     "T1566", "Phishing"),

    ("Lateral Movement", "Critical",
     r"(pass-the-hash|mimikatz|psexec|wmic\s+process\s+call\s+create|lateral movement)",
     "T1021", "Remote Services"),

    ("Directory Traversal", "High",
     r"(\.\./\.\./|%2e%2e%2f|etc/passwd|boot\.ini)",
     "T1083", "File and Directory Discovery"),

    ("Command Injection", "Critical",
     r"(;.*(rm -rf|wget|curl)|`.*`|\$\(.*\)|&&\s*nc\s)",
     "T1059", "Command and Scripting Interpreter"),

    ("Suspicious PowerShell", "High",
     r"(powershell.*-enc|invoke-expression|iex\s*\(|-noprofile\s+-w\s+hidden)",
     "T1059.001", "PowerShell"),

    ("Account Lockout Anomaly", "Medium",
     r"(account locked out|excessive lockout events|impossible travel login)",
     "T1078", "Valid Accounts"),

    ("Firewall Policy Violation", "Low",
     r"(firewall rule violation|blocked outbound connection|policy deny)",
     "T1562", "Impair Defenses"),

    ("Malicious File Upload", "High",
     r"(\.php\.jpg|webshell|eval\(base64_decode|upload.*\.php)",
     "T1505.003", "Web Shell"),
]

_COMPILED = [(t, sev, re.compile(pat, re.IGNORECASE), mid, mname)
             for t, sev, pat, mid, mname in SIGNATURES]

_SEVERITY_RANK = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}


def analyze_line(line: str):
    """Return a list of matches (there can be more than one signature hit
    per line) — each match is a dict ready to persist as a Threat row."""
    matches = []
    for threat_type, severity, pattern, mitre_id, mitre_name in _COMPILED:
        m = pattern.search(line)
        if m:
            ip_match = re.search(r"(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})", line)
            matches.append({
                "threat_type": threat_type,
                "severity": severity,
                "source_ip": ip_match.group(1) if ip_match else "unknown",
                "raw_log": line.strip(),
                "matched_text": m.group(0),
                "mitre_id": mitre_id,
                "mitre_name": mitre_name,
                "detected_at": datetime.utcnow(),
            })
    return matches


def severity_rank(sev: str) -> int:
    return _SEVERITY_RANK.get(sev, 0)


def all_signatures():
    return SIGNATURES

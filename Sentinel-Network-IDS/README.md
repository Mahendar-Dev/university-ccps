# 🛡️ SENTINEL: Intelligent Network Intrusion Detection System

### Snort • Kali Linux • Ubuntu Server • VMware • Network Security

![Snort](https://img.shields.io/badge/Snort-2.9.15.1-red?style=for-the-badge)
![Ubuntu](https://img.shields.io/badge/Ubuntu-Server-E95420?style=for-the-badge)
![Kali](https://img.shields.io/badge/Kali-Linux-557C94?style=for-the-badge)
![VMware](https://img.shields.io/badge/VMware-Workstation-607078?style=for-the-badge)
![Course](https://img.shields.io/badge/Course-Network_Security_Lab-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge)

🔴 **PROJECT DEMONSTRATION:** Real-Time Threat Detection & Alert Generation

SENTINEL is a Network Intrusion Detection System (NIDS) built using Snort to monitor, inspect, and detect malicious activities within a virtualized network environment.

# 🏗️ System Architecture

![System Archietecture](https://github.com/Mahendar-Dev/Sentinel-Network-IDS/blob/ded7416502c76afdc782bcab0d282e49a578ae3b/screenshots/system-architecture.png)

## 🌍 The Real-World Problem

Organizations face continuous cyber threats such as network scanning, unauthorized access attempts, and web application attacks. Without proper monitoring, these activities often go unnoticed until significant damage has already occurred.

### The Challenge

Traditional networks lack visibility into suspicious traffic and attack behavior. Security teams require a solution capable of continuously monitoring network packets and generating alerts whenever malicious activity is detected.

### The Solution

SENTINEL leverages Snort IDS to inspect network traffic in real time, apply custom detection rules, and generate security alerts for suspicious activities including:

* Nmap Port Scanning
* ICMP Reconnaissance
* SQL Injection Attempts
* SSH Brute Force Attacks

# 🚀 Architecture Overview

The solution is built around a dedicated monitoring architecture designed for network visibility and threat detection.

### 🐉 Attack Layer

* Kali Linux
* Nmap Scanning
* ICMP Traffic Generation
* SQL Injection Testing
* SSH Brute Force Simulation

### 🌐 Network Layer

* VMware Host-Only Network
* Subnet: 192.168.75.0/24

### 🖥️ Target Layer

* Ubuntu Server
* Apache2 Web Services

### 🛡️ Detection Layer

* Snort IDS
* Signature-Based Detection
* Custom Security Rules
* Packet Inspection Engine

### 📊 Monitoring Layer

* Alert Logs
* Event Analysis
* Threat Detection Reports

# 📁 Repository Structure

- 📄 README.md
- 📜 LICENSE

### 📚 docs
- IDS_Project_Report.pdf
- Deployment_Guide.md
- Network_Architecture.md

### 🖼️ screenshots
- system-architecture.png
- nmap-detection.png
- icmp-alert.png
- sql-injection-alert.png

### 🛡️ rules
- local.rules
- nmap.rules
- ssh.rules
- sql.rules

# 🛡️ Security Capabilities

✅ Nmap Port Scan Detection

✅ ICMP Reconnaissance Detection

✅ SQL Injection Detection

✅ SSH Brute Force Detection

✅ Real-Time Packet Inspection

✅ Signature-Based Threat Analysis

✅ Alert Logging & Monitoring

# 📊 Detection Results

| Threat Type | Detection Status |
| --- | --- |
| Nmap Scan | ✅ Detected |
| ICMP Traffic | ✅ Detected |
| SQL Injection | ✅ Detected |
| SSH Brute Force | ✅ Detected |

# 🎓 Academic Project

**Course:** Network Security Lab

**Instructor:** Sir Muhammad Jawad Khan

**Developed By:**

* Mahender Dev

## ⭐ Project Goal

To demonstrate the deployment of a practical Intrusion Detection System capable of monitoring network traffic, identifying malicious activities, and improving overall network security visibility using Snort IDS.

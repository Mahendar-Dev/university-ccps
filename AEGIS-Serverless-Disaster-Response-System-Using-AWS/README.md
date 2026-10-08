# 🛡️ AEGIS: Serverless Disaster Response & Crisis Grid

![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Terraform](https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)

🔴 **LIVE PREVIEW:** [AEGIS Command Center (Deployed on AWS S3)](http://ccp-cloud-native-frontend-ui-849320.s3-website-us-east-1.amazonaws.com)

**AEGIS** is a God-Level Cloud-Native Web Application built entirely on Serverless AWS infrastructure. It solves a **Real-World Problem**: Providing an instantly scalable, highly available, and secure platform for emergency response teams to log crisis incidents and upload damage assessment photos during natural disasters.

This repository contains the complete source code, infrastructure definitions, and documentation for the Complex Computing Problem (CCP) assignment for the Cloud Computing & Virtualization course.

---

## 🌍 The Real-World Problem Solved
During natural disasters (earthquakes, floods), NGOs and emergency teams need a centralized platform to log incidents and coordinate resources. 
- **The Challenge:** Traffic is usually zero, but during a disaster, it spikes unpredictably by 10,000%. Traditional servers would either crash or cost thousands of dollars to keep running idle.
- **The Serverless Solution:** Aegis uses AWS Lambda and DynamoDB. It scales automatically to handle infinite crisis traffic and costs **$0** during peaceful times. Heavy damage assessment photos are uploaded directly to S3 via **Pre-Signed URLs**, completely offloading the backend.

---

## 🚀 Architecture Overview
The system is designed with a **Serverless-First** architecture, ensuring high availability and cost optimization.

1. **Frontend (UI):** A breathtaking Cyberpunk/Glassmorphism tactical dashboard built with **React.js**. Hosted on **Amazon S3** Static Website Hosting.
2. **API Gateway:** Acts as the front door, proxying HTTP requests securely to the backend logic.
3. **Compute / Backend:** **AWS Lambda** runs a Python **FastAPI** application via Mangum adapters, providing stateless compute.
4. **Database:** **Amazon DynamoDB** serves as the fully managed NoSQL database for ultra-fast data storage (Incidents CRUD).
5. **Storage (Pre-Signed URLs):** An **Amazon S3 Bucket** allows the React frontend to securely upload tactical imagery *directly* to AWS, bypassing Lambda to reduce latency and cost.
6. **Infrastructure as Code:** **Terraform** is utilized to declaratively provision, manage, and tear down the entire AWS ecosystem.
7. **Authentication:** A secure simulated or AWS Cognito-backed login screen restricts access to authorized personnel only.

---

## 📁 Repository Structure
```text
📦 Aegis-Disaster-Response
 ┣ 📂 backend                 # AWS Lambda Python Logic (FastAPI)
 ┃ ┣ 📜 app.py                # Core API, Pre-Signed URL Generator, Mangum Handler
 ┃ ┗ 📜 requirements.txt      # Python Dependencies (boto3, fastapi, mangum)
 ┣ 📂 frontend                # React.js Tactical UI
 ┃ ┣ 📂 public                # Static HTML
 ┃ ┣ 📂 src                   # React Components & God-Level CSS
 ┃ ┗ 📜 package.json          # Node Dependencies
 ┣ 📂 infra                   # Terraform IaC Definitions
 ┃ ┣ 📜 main.tf               # VPC, API GW, Lambda, S3 CORS, DynamoDB, IAM
 ┃ ┣ 📜 variables.tf          # Configurable Input Variables
 ┃ ┗ 📜 outputs.tf            # Generated URLs and IDs
 ┗ 📜 README.md               # Documentation
```

---

## 🛡️ CCP Assignment Rubric Checklist
- [x] **Cloud Architecture:** Deployed on AWS using Terraform.
- [x] **Backend & Compute:** AWS Lambda + API Gateway (FastAPI).
- [x] **Database & Storage:** DynamoDB for text data, S3 for heavy image uploads.
- [x] **Frontend:** React application with God-Level UI, Framer Motion animations, and Recharts Analytics.
- [x] **Authentication (RBAC):** Secure login gateway with `admin123` and `responder123` keys.
- [x] **Event-Driven Architecture:** AWS SNS integrated for Critical Alert Email Notifications.
- [x] **Cost / Scaling:** $0 idle cost, infinitely scalable. Least privilege IAM roles applied.

---

## 🛠️ Deployment Instructions (For a Fresh Clone)

If you are downloading this repository to run on your own AWS Account, follow these foolproof steps:

### Prerequisites
1. **AWS CLI:** Installed and configured (`aws configure`) with Admin credentials.
2. **Terraform:** v1.5.0+ installed.
3. **Node.js & npm:** Installed for the frontend.
4. **Python 3.10+:** Installed.

### Step 1: Provision Infrastructure (Terraform)
Navigate to the `infra` directory and apply the Terraform configuration. This creates the Database, S3 buckets, SNS Topics, API Gateway, and Lambda.
```bash
cd infra
terraform init
terraform apply -auto-approve
```
*Wait for it to complete. Note down the generated `api_url` from the Terraform outputs.*

### Step 2: Deploy Backend & SNS (AWS Lambda)
We have a built-in Python script (`deploy_lambda.py`) to automatically resolve Linux binaries, package the backend, upload to S3, and update Lambda.
```bash
# Simply run the deployment script
python deploy_lambda.py
```

### Step 3: Verify SNS Email Subscriptions
If you added your emails in `infra/main.tf` for alerts:
1. Open your Email Inbox and Spam Folder.
2. Look for an email from **AWS Notifications**.
3. Click **"Confirm subscription"**. (AWS will NOT send alerts until you do this!).

### Step 4: Run Frontend Locally
Inject the API URL from Step 1 into the frontend and start the app:
```bash
cd ../frontend

# Set the environment variable for your API
export REACT_APP_API_URL="<your_api_url_from_step_1>"

# Windows PowerShell equivalent:
# $env:REACT_APP_API_URL="<your_api_url_from_step_1>"

npm install
npm start
```

### System Access
When the website opens, use one of the following Security Clearance Keys:
- **Admin Access:** `admin123` (Can resolve/delete incidents)
- **Responder Access:** `responder123` (Can log incidents)

---
*Developed for the Cloud Computing & Virtualization Course (CCP) as an Extreme God-Level Solution.*

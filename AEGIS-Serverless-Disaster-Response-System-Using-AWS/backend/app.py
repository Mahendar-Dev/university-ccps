from fastapi import FastAPI, HTTPException, Header, Depends
from mangum import Mangum
from pydantic import BaseModel
import boto3
import os
import uuid
import datetime
import hashlib
import google.generativeai as genai

import os
api_key = os.environ.get("GEMINI_API_KEY", "dummy_key")
genai.configure(api_key=api_key)
ai_model = genai.GenerativeModel('gemini-2.5-flash')

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
table_name = os.environ.get('DYNAMODB_TABLE_NAME', 'ccp-cloud-native-db')
table = dynamodb.Table(table_name)

s3_client = boto3.client('s3', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
sns_client = boto3.client('sns', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'ccp-cloud-native-storage')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')

class IncidentModel(BaseModel):
    title: str
    severity: str
    description: str
    location: str
    image_url: str = ""

class SignupModel(BaseModel):
    email: str
    password: str
    role: str

class LoginModel(BaseModel):
    email: str
    password: str

class SubscriberModel(BaseModel):
    email: str

class StrategyRequestModel(BaseModel):
    title: str
    description: str
    severity: str
    location: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_current_role(x_auth_key: str = Header(None)):
    if not x_auth_key:
        raise HTTPException(status_code=403, detail="Missing authentication key")
    if x_auth_key == "admin123":
        return "Admin"
    elif x_auth_key == "responder123":
        return "Responder"
    
    if x_auth_key.startswith("TOKEN#"):
        parts = x_auth_key.split("#")
        if len(parts) == 3:
            return parts[2]
            
    raise HTTPException(status_code=403, detail="Invalid authentication key")

@app.get("/")
def read_root():
    return {"message": "Aegis Disaster Response API is running"}

@app.post("/signup")
def signup(data: SignupModel):
    user_id = f"USER#{data.email}"
    response = table.get_item(Key={'id': user_id})
    if 'Item' in response:
        raise HTTPException(status_code=400, detail="User already exists")
    
    table.put_item(
        Item={
            'id': user_id,
            'email': data.email,
            'password': hash_password(data.password),
            'role': data.role,
            'type': 'User'
        }
    )
    return {"message": "User created successfully", "role": data.role}

@app.post("/login")
def login(data: LoginModel):
    user_id = f"USER#{data.email}"
    response = table.get_item(Key={'id': user_id})
    if 'Item' not in response:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    user = response['Item']
    if user['password'] != hash_password(data.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    token = f"TOKEN#{data.email}#{user['role']}"
    return {"token": token, "role": user['role'], "email": data.email}

@app.post("/subscribers")
def add_subscriber(data: SubscriberModel, role: str = Depends(get_current_role)):
    if role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can add subscribers")
    
    try:
        sns_client.subscribe(
            TopicArn=SNS_TOPIC_ARN,
            Protocol='email',
            Endpoint=data.email,
            ReturnSubscriptionArn=True
        )
        return {"message": f"Successfully sent subscription invitation to {data.email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/generate-upload-url")
def generate_upload_url(filename: str, filetype: str, role: str = Depends(get_current_role)):
    try:
        unique_filename = f"{uuid.uuid4()}-{filename}"
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': S3_BUCKET_NAME,
                'Key': unique_filename,
                'ContentType': filetype
            },
            ExpiresIn=3600
        )
        return {"upload_url": presigned_url, "file_key": unique_filename, "url": f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{unique_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/incidents")
def create_incident(incident: IncidentModel, role: str = Depends(get_current_role)):
    incident_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().isoformat()
    reporter_id = role # Dynamically set reporter ID based on Auth role
    
    table.put_item(
        Item={
            'id': incident_id,
            'title': incident.title,
            'severity': incident.severity,
            'description': incident.description,
            'location': incident.location,
            'image_url': incident.image_url,
            'timestamp': timestamp,
            'reporter_id': reporter_id
        }
    )
    
    # Send SNS Alert for Critical Incidents
    if incident.severity.lower() == 'critical' and SNS_TOPIC_ARN:
        message = f"🚨 CRITICAL INCIDENT REPORTED: {incident.title}\nLocation: {incident.location}\nDetails: {incident.description}"
        try:
            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Message=message,
                Subject=f"AEGIS ALERT: {incident.title}"
            )
        except Exception as e:
            print(f"Failed to publish to SNS: {e}")

    return {"id": incident_id, "timestamp": timestamp, "reporter_id": reporter_id, **incident.dict()}

@app.get("/incidents/{incident_id}")
def get_incident(incident_id: str, role: str = Depends(get_current_role)):
    response = table.get_item(Key={'id': incident_id})
    if 'Item' not in response:
        raise HTTPException(status_code=404, detail="Incident not found")
    return response['Item']

@app.get("/incidents")
def list_incidents(role: str = Depends(get_current_role)):
    response = table.scan()
    return response.get('Items', [])

@app.delete("/incidents/{incident_id}")
def delete_incident(incident_id: str, role: str = Depends(get_current_role)):
    if role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can resolve incidents")
        
    # Fetch incident to get S3 image_url
    response = table.get_item(Key={'id': incident_id})
    if 'Item' not in response:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    item = response['Item']
    image_url = item.get('image_url', '')
    
    # Delete from S3 if an image exists
    if image_url:
        try:
            key = image_url.split('/')[-1]
            s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=key)
        except Exception as e:
            print(f"Failed to delete S3 image: {e}")

    table.delete_item(Key={'id': incident_id})
    return {"message": "Incident deleted and assets cleaned up"}

@app.post("/ai/strategy")
def generate_strategy(data: StrategyRequestModel, role: str = Depends(get_current_role)):
    prompt = f"""
    You are an expert disaster response AI for AEGIS. 
    Analyze the following incident and provide a fast, actionable, step-by-step mitigation strategy and evacuation plan.
    Keep the response concise (max 2-3 paragraphs), authoritative, and formatted in clear bullet points.
    
    Incident: {data.title}
    Severity: {data.severity}
    Location: {data.location}
    Details: {data.description}
    """
    try:
        response = ai_model.generate_content(prompt)
        return {"strategy": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

handler = Mangum(app)

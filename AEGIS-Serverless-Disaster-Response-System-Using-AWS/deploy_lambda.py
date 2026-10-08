import os
import subprocess
import shutil
import zipfile

def deploy():
    os.chdir(r"d:\IQRA UNI\Elective\Cloud\backend")
    
    if os.path.exists("package"):
        shutil.rmtree("package")
    os.makedirs("package")
    
    print("Installing requirements for AWS Lambda (Linux x86_64)...")
    subprocess.check_call([
        "pip", "install", "-r", "requirements.txt", "-t", "package", 
        "--platform", "manylinux2014_x86_64", "--implementation", "cp", 
        "--python-version", "3.10", "--only-binary=:all:", "--upgrade"
    ])
    
    print("Zipping package...")
    shutil.make_archive("backend_lambda", "zip", "package")
    
    print("Adding app.py to zip...")
    with zipfile.ZipFile("backend_lambda.zip", "a") as z:
        z.write("app.py", arcname="app.py")
        
    print("Uploading to S3...")
    subprocess.check_call([
        "aws", "s3", "cp", "backend_lambda.zip", "s3://ccp-cloud-native-storage-files-849320/backend_lambda.zip"
    ])
    
    print("Updating AWS Lambda from S3...")
    subprocess.check_call([
        "aws", "lambda", "update-function-code", 
        "--function-name", "ccp-backend-function", 
        "--s3-bucket", "ccp-cloud-native-storage-files-849320",
        "--s3-key", "backend_lambda.zip"
    ])
    print("Deployment Complete")

if __name__ == "__main__":
    deploy()

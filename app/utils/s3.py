import boto3
import os

from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client("s3", region_name=os.getenv("AWS_REGION"))
BUCKET = os.getenv("S3_BUCKET")

def download_file(s3_key, local_path):
    s3.download_file(BUCKET, s3_key, local_path)

def upload_file(local_path, s3_key):
    s3.upload_file(local_path, BUCKET, s3_key)

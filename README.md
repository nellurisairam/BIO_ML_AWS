# BioNexus Backend API

This is a FastAPI-based backend for the BioNexus Bioreactor ML platform, ported from the original Streamlit dashboard. It features advanced preprocessing, threshold-based alerting, and robust user management.

## Prerequisites

- Python 3.10+
- PostgreSQL (or Neon/PlanetScale)
- AWS S3 Bucket (for model artifacts and file uploads)
- SMTP Server (for email alerts)

## Installation

1. Clone the repository and navigate to the project directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the root directory (see Environment Variables).

## Running the Application

You can run the application in two ways:

### Option 1: From the project root (Recommended)
```bash
uvicorn app.main:app --reload
```

### Option 2: From within the 'app' directory
```bash
cd app
uvicorn main:app --reload
```
The API will be available at `http://127.0.0.1:8000`. You can browse the interactive documentation at `http://127.0.0.1:8000/docs`. To test predictions, use the sample data provided in `app/sample_data/new_samples.csv`.

## Environment Variables

| Variable | Description |
| --- | --- |
| `NEON_DATABASE_URL` | PostgreSQL connection string. |
| `AWS_ACCESS_KEY_ID` | AWS credentials. |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials. |
| `AWS_REGION` | AWS region (e.g., `us-east-1`). |
| `S3_BUCKET` | S3 bucket name for uploads and models. |
| `MODEL_KEY` | Path to the `.joblib` model file in S3. |
| `SCHEMA_KEY` | Path to the `.json` schema file in S3. |

## Verification

Run the integrated verification script to ensure everything is set up correctly:
```bash
cd app
python verify_integrated.py
```

## AWS Deployment

- **Database**: Use Amazon RDS (PostgreSQL).
- **Hosting**: Deploy using AWS Lambda (with Mangum), AWS ECS (Fargate), or AWS App Runner.
- **Secrets**: Use AWS Secrets Manager for environment variables.

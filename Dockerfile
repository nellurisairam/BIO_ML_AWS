# Use a multi-stage build to keep the image size small
# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/react-frontend
COPY app/react-frontend/package*.json ./
RUN npm install
COPY app/react-frontend/ ./
RUN npm run build

# Stage 2: Build the FastAPI backend and serve the frontend
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies for psycopg2 and other packages
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Copy the built React frontend to the backend's static directory
# We'll point main.py to serve from /app/app/react-frontend/dist
COPY --from=frontend-build /app/react-frontend/dist /app/app/react-frontend/dist

# Expose the API port
EXPOSE 8000

# Set environment variables for production
ENV DATABASE_URL=""
ENV PORT=8000
ENV PYTHONPATH="/app/app"

# Command to run the application
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT

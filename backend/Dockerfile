FROM python:3.12-slim

# Install system dependencies
# curl/tar/unzip/git: for downloading binaries
# postgresql-client: for pg_isready and other checks and pg_dump
# gnupg: for mongo repo signing
# libpq-dev: for psycopg2
# build-essential: for compiling psycopg2 (if binary not used)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    tar \
    unzip \
    git \
    postgresql-client \
    gnupg \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install MongoDB Tools (mongodump)
RUN apt-get update && apt-get install -y --no-install-recommends \
    mongo-tools \
    || echo "mongo-tools not found in default repo"

# Install Restic (v0.16.4)
RUN curl -L https://github.com/restic/restic/releases/download/v0.16.4/restic_0.16.4_linux_amd64.bz2 | \
    bzcat > /usr/local/bin/restic && \
    chmod +x /usr/local/bin/restic

# Install Rclone
RUN curl https://rclone.org/install.sh | bash

WORKDIR /app

# Copy python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Ensure psycopg2 is installed for db_export.py
RUN pip install psycopg2-binary

# Copy application code
COPY app ./app

# Copy worker scripts
COPY worker/ /app/worker/
RUN chmod +x /app/worker/entrypoint.sh

# Set Python path
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Default command: Run the API server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

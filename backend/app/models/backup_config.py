from sqlalchemy import Boolean, Column, String, Integer, DateTime, JSON, ForeignKey, BigInteger
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class BackupConfig(Base):
    __tablename__ = "backup_configs"

    tenant_id = Column(String, primary_key=True, index=True)
    enabled = Column(Boolean, default=False)
    
    # Schedule (Cron expression)
    schedule_cron = Column(String, default="0 3 * * *") # Daily at 3 AM
    
    # Retention Policy (GFS)
    retention_daily = Column(Integer, default=7)
    retention_weekly = Column(Integer, default=4)
    retention_monthly = Column(Integer, default=12)
    
    # Source Configuration
    # List of sources: ["postgresql", "mongodb", "minio"]
    sources = Column(JSON, default=list)
    
    # Destination Configuration
    destination_type = Column(String, nullable=False) # s3, sftp, gdrive, etc.
    # Encrypted Rclone config parameters
    destination_config = Column(JSON, nullable=False)
    
    # Security
    # Name of the K8s Secret containing the Restic repository password
    encryption_key_ref = Column(String, nullable=False)
    
    # Status
    last_backup_at = Column(DateTime(timezone=True), nullable=True)
    last_backup_status = Column(String, nullable=True) # success, failed
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class BackupJob(Base):
    __tablename__ = "backup_jobs"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("backup_configs.tenant_id"), index=True)
    
    job_type = Column(String, nullable=False) # backup, restore
    status = Column(String, nullable=False)   # pending, running, success, failed
    
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metrics
    total_bytes = Column(BigInteger, default=0)
    new_bytes = Column(BigInteger, default=0) # Deduplicated delta
    duration_seconds = Column(Integer, default=0)
    processed_files = Column(Integer, default=0)
    
    # Restic Context
    snapshot_id = Column(String, nullable=True) # Short ID from Restic
    
    error_message = Column(String, nullable=True)

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from ..models.backup_config import BackupConfig, BackupJob
from ..services.scheduler_service import SchedulerService
from ..services.rclone_service import RcloneService
# from ..db.session import get_db # Mocking for now as db setup isn't fully shown in prev steps
from ..middleware.auth import get_current_user, require_role

# Mock DB session for compilation check - typically in db/session.py
def get_db():
    yield None

router = APIRouter()
scheduler = SchedulerService()
rclone = RcloneService()

# Pydantic Schemas
class BackupSource(BaseModel):
    type: str # postgresql, minio, odoo, external-postgres
    connection_string: Optional[str] = None

class BackupConfigBase(BaseModel):
    enabled: bool
    schedule_cron: str
    retention_daily: int
    retention_weekly: int
    retention_monthly: int
    sources: List[BackupSource]
    destination_type: str
    destination_config: dict
    encryption_key: str 

class BackupConfigOut(BackupConfigBase):
    tenant_id: str
    last_backup_at: Optional[str]
    last_backup_status: Optional[str]
    destination_config: dict = {}
    encryption_key: str = "***" 

@router.get("/config", response_model=BackupConfigOut)
def get_config(
    user: dict = Depends(require_role("TenantAdmin")),
    db: Session = Depends(get_db)
):
    # Logic to fetch from DB...
    pass

@router.put("/config")
async def update_config(
    config_in: BackupConfigBase,
    user: dict = Depends(require_role("TenantAdmin")),
    db: Session = Depends(get_db)
):
    """
    Updates configuration with RBAC for sources.
    """
    tenant_id = user["tenant_id"]
    roles = user.get("realm_access", {}).get("roles", [])
    is_platform_admin = "PlatformAdmin" in roles
    
    # RBAC: Validate Source Security
    for source in config_in.sources:
        if source.type in ["odoo", "external-postgres"] and source.connection_string:
            if not is_platform_admin:
                 raise HTTPException(
                     status_code=403, 
                     detail="Only Platform Admins can configure external database connections."
                 )
    
    # ... update logic ...
    return {"status": "updated"}

@router.post("/test-connection")
async def test_connection(
    config_in: dict, # partial config
    user: dict = Depends(require_role("TenantAdmin"))
):
    """
    Validates that Rclone can connect to the destination.
    """
    success = await rclone.test_connection(config_in)
    if not success:
        raise HTTPException(status_code=400, detail="Connection failed")
    return {"status": "ok"}

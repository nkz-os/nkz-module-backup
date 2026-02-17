from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from ..models.backup_config import BackupConfig, BackupJob
# from ..services.restore_service import RestoreService # TODO
from ..middleware.auth import require_role

router = APIRouter()

@router.post("/restore")
async def trigger_restore(
    restore_request: dict, # { "snapshot_id": "...", "type": "full", "confirmation_token": "..." }
    user: dict = Depends(require_role("TenantAdmin"))
):
    """
    Triggers a restore job.
    1. Validates confirmation token (2FA) if type is 'full'
    2. Creates a K8s Job (not CronJob) to run the restore
    """
    snapshot_id = restore_request.get("snapshot_id")
    restore_type = restore_request.get("type", "download")
    
    if restore_type == "full":
        token = restore_request.get("confirmation_token")
        # Validate token logic here (e.g. TOTP or email code)
        if token != "RESTORE": # Simple confirmation for MVP
             raise HTTPException(status_code=400, detail="Invalid confirmation")
    
    # Launch K8s Job via Scheduler/RestoreService
    # job_id = restore_service.launch_restore_job(...)
    
    return {"status": "started", "job_id": "mock-job-id"}

@router.get("/restore/status/{job_id}")
async def get_restore_status(job_id: str, user: dict = Depends(require_role("TenantAdmin"))):
    return {"job_id": job_id, "status": "running", "progress": "50%"}

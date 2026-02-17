import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App
    APP_NAME: str = "nkz-module-backup"
    API_V1_STR: str = "/api/backup"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str
    
    # Auth (Keycloak)
    KEYCLOAK_URL: str
    KEYCLOAK_REALM: str = "nekazari"
    JWT_ISSUER: str
    JWKS_URL: str
    JWT_ALGORITHM: str = "RS256"
    JWT_AUDIENCE: str = "account"
    
    # Kubernetes
    K8S_NAMESPACE: str = "nekazari"
    BACKUP_WORKER_IMAGE: str = "ghcr.io/k8-benetis/nkz/backup-worker:latest"
    
    # Notifications
    NOTIFICATION_WEBHOOK_URL: str | None = None
    
    class Config:
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()

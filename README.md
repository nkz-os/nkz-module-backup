# Nekazari Backup Module (`nkz-module-backup`)

Enterprise-grade backup and disaster recovery module for the Nekazari platform.

![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)
![Status](https://img.shields.io/badge/status-stable-green)

## Features

-   **Multi-Tenant, Hermetic Backups**: Strict data sovereignty. Shared-schema databases are filtered by `tenant_id` during export.
-   **Extensible Sources**: Supports internal Postgres/MinIO, plus external sources like Odoo ERP or standalone databases.
-   **Encryption**: Client-side AES-256 encryption via Restic. Keys are managed by the tenant (no platform escrow).
-   **Deduplication**: Efficient snapshot storage using Restic's content-addressable storage.
-   **Multi-Cloud Support**: Leverages Rclone to support S3 (AWS, MinIO, Wasabi), SFTP, WebDAV, Google Drive, OneDrive, etc.
-   **Granular Restore**: "Time Machine" UI for full point-in-time recovery.

## Architecture

This module follows the Nekazari Modular Monolith pattern:

-   **Backend**: Python/FastAPI service managing K8s CronJobs.
-   **Worker**: Ephemeral containers running `restic`, `rclone`, and smart export scripts (`db_export.py`).
-   **Frontend**: React/TypeScript IIFE bundle injected into the host application.

## Installation

### Prerequisites

-   Nekazari Platform v2.0+
-   Kubernetes Cluster (K3s/K8s)
-   PostgreSQL 14+

### Deployment

1.  **Apply Kubernetes Manifests**:
    ```bash
    kubectl apply -f k8s/backup-rbac.yaml
    kubectl apply -f k8s/backup-api-deployment.yaml
    ```

2.  **Register Module**:
    Run the `k8s/registration.sql` script against your Nekazari PostgreSQL database to register the module in the marketplace.

3.  **Deploy Worker Image**:
    Build and push the backend image to your registry:
    ```bash
    docker build -t ghcr.io/nkz-os/nkz-module-backup/backup-backend:latest -f backend/Dockerfile backend/
    docker push ghcr.io/nkz-os/nkz-module-backup/backup-backend:latest
    ```

## Security

-   **RBAC**: Only `PlatformAdmin` users can configure external database connections. `TenantAdmin` users are restricted to managed, isolated sources.
-   **Secrets**: All sensitive credentials (Restic password, Cloud keys) are stored in Kubernetes Secrets, never in plain text.
-   **Isolation**: Worker pods run with restricted privileges and network policies.

## License

AGPL-3.0

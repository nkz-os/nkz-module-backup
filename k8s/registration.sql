-- 1. Register Module in Marketplace
INSERT INTO marketplace_modules (
    id, 
    name, 
    display_name, 
    description,
    is_local, 
    remote_entry_url, 
    scope, 
    exposed_module,
    route_path, 
    label, 
    module_type, 
    author,
    is_active, 
    required_roles,
    metadata
) VALUES (
    'backup',
    'nkz-module-backup',
    'Backup & Disaster Recovery',
    'Enterprise-grade backup solution using Restic and Rclone.',
    false, -- Remote module (deployed via MinIO)
    '/modules/backup/nkz-module.js',
    'backup_module',
    './moduleEntry',
    '/backup',
    'Backups',
    'ADDON_FREE',
    '{"name": "Nekazari Team", "email": "support@robotika.cloud"}'::jsonb,
    true,
    ARRAY['TenantAdmin', 'PlatformAdmin'],
    '{"icon": "🛡️", "color": "#10B981"}'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
    remote_entry_url = EXCLUDED.remote_entry_url,
    display_name = EXCLUDED.display_name;

-- 2. Create Module Tables
CREATE TABLE IF NOT EXISTS backup_configs (
    tenant_id VARCHAR(255) PRIMARY KEY,
    enabled BOOLEAN DEFAULT FALSE,
    schedule_cron VARCHAR(50) DEFAULT '0 3 * * *',
    retention_daily INTEGER DEFAULT 7,
    retention_weekly INTEGER DEFAULT 4,
    retention_monthly INTEGER DEFAULT 12,
    sources JSONB DEFAULT '[]'::jsonb,
    destination_type VARCHAR(50) NOT NULL,
    destination_config JSONB NOT NULL,
    encryption_key_ref VARCHAR(255) NOT NULL,
    last_backup_at TIMESTAMP WITH TIME ZONE,
    last_backup_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS backup_jobs (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(255) REFERENCES backup_configs(tenant_id),
    job_type VARCHAR(20) NOT NULL, -- backup, restore
    status VARCHAR(20) NOT NULL, -- pending, running, success, failed
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_bytes BIGINT DEFAULT 0,
    new_bytes BIGINT DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    processed_files INTEGER DEFAULT 0,
    snapshot_id VARCHAR(100),
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_backup_jobs_tenant ON backup_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_status ON backup_jobs(status);

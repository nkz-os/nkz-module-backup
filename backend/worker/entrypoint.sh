#!/bin/bash
set -e

# Expected Env Vars:
# TENANT_ID
# BACKUP_SOURCES (json list or object) - e.g. [{"type": "postgresql"}, {"type": "minio"}, {"type": "mysql", "host": "odoo-db"}]
# DATABASE_URL (for primary postgres)
# RESTIC_PASSWORD
# RCLONE_CONFIG_JSON
# RETENTION_...

# 1. Setup Rclone Config
echo "Setting up Rclone config..."
python3 -c "
import os, json
config = json.loads(os.environ['RCLONE_CONFIG_JSON'])
print(f'[target]')
print(f'type = {config.get(\"type\")}')
for k,v in config.items():
    if k != 'type':
        print(f'{k} = {v}')
" > /tmp/rclone.conf

export RCLONE_CONFIG=/tmp/rclone.conf
REPO="rclone:target:${TENANT_ID}"

# 2. Init Repo if needed
echo "Checking repo..."
if ! restic -r "$REPO" snapshots > /dev/null 2>&1; then
    echo "Initializing repo at $REPO..."
    restic -r "$REPO" init
fi

# 3. Parse Sources
# We can't use complex python one-liners easily for objects, so let's iterate.
# We'll save sources to a temporary python script to iterate
cat <<EOF > /tmp/process_sources.py
import os, json, subprocess

sources_raw = os.environ.get('BACKUP_SOURCES', '[]')
try:
    sources = json.loads(sources_raw)
except:
    # Fallback for old list format ["postgresql"]
    sources = [{"type": s} for s in json.loads(sources_raw)]

tenant_id = os.environ.get('TENANT_ID')
repo = os.environ.get('REPO')

for source in sources:
    sType = source.get('type')
    print(f"Processing source: {sType}")
    
    if sType == 'postgresql':
        # Internal Encrypted/Hermetic Dump
        print("Starting Hermetic Postgres Dump...")
        # Pipe python script output to restic
        # We assume db_export.py is in /app/worker or /app
        cmd = f"python3 /app/worker/db_export.py | restic -r {repo} backup --stdin --stdin-filename postgres_dump.sql --tag postgresql"
        subprocess.check_call(cmd, shell=True)

    elif sType == 'minio':
        # Backup tenant specific bucket or path
        # Assuming we have access to the MinIO backend via Rclone locally or volume
        # For MVP, we need an rclone remote for the SOURCE MinIO as well.
        # But wait, the Worker Pod doesn't have Rclone config for the SOURCE MinIO by default unless we inject it.
        # OR we mount the PVC.
        # Assuming we can connect to internal MinIO service.
        # We need to add source minio config to rclone.conf
        
        # NOTE: For this step to work, we need credentials for internal MinIO.
        # Let's assume they are passed env vars or mounted secrets.
        # For now, we will assume a generic 'source-minio' remote is configured OR we use S3 protocol via env vars.
        
        # MVP Strategy: Use 'rclone sync' from Generic S3 Source
        # We construct a remote on the fly?
        pass # TODO: Requires internal minio creds injection.
        
        print("MinIO backup placeholder - requires internal credentials update")
        
    elif sType == 'external-postgres' or sType == 'odoo':
        # Generic External DB
        conn_str = source.get('connection_string')
        if conn_str:
            print(f"Backing up External DB ({sType})...")
            # For Odoo/External, we dump the WHOLE DB usually, or filtered?
            # Assuming full dump for external dedicated DBs
            cmd = f"pg_dump '{conn_str}' --format=custom | restic -r {repo} backup --stdin --stdin-filename {sType}_dump.sql --tag {sType}"
            subprocess.check_call(cmd, shell=True)

EOF

# Execute the python processor
export REPO
python3 /tmp/process_sources.py

# 4. Retention Policy
echo "Applying retention policy..."
restic -r "$REPO" forget \
    --keep-daily "${RETENTION_DAILY:-7}" \
    --keep-weekly "${RETENTION_WEEKLY:-4}" \
    --keep-monthly "${RETENTION_MONTHLY:-12}" \
    --prune

echo "Backup complete!"

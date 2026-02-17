#!/bin/bash
set -e

# Expected Env Vars:
# SNAPSHOT_ID
# RESTORE_TYPE (full, download)
# RESTIC_PASSWORD
# RCLONE_CONFIG_JSON
# DATABASE_URL

# 1. Setup Rclone (Same as backup)
echo "Setting up Rclone..."
python3 -c "import os, json; ..." > /tmp/rclone.conf
export RCLONE_CONFIG=/tmp/rclone.conf
REPO="rclone:target:${TENANT_ID}"

# 2. Restore
echo "Restoring snapshot $SNAPSHOT_ID..."

if [ "$RESTORE_TYPE" == "full" ]; then
    # Create temp dir
    mkdir -p /tmp/restore
    
    # Restore to temp
    restic -r "$REPO" restore "$SNAPSHOT_ID" --target /tmp/restore
    
    # Locate SQL dump
    DUMP_FILE=$(find /tmp/restore -name "*.sql" | head -n 1) # Assumes structure
    
    if [ -f "$DUMP_FILE" ]; then
        echo "Restoring database from $DUMP_FILE..."
        pg_restore --clean --if-exists --no-owner --no-privileges -d "$DATABASE_URL" "$DUMP_FILE"
    fi
    
elif [ "$RESTORE_TYPE" == "download" ]; then
    # Generate download link (presigned URL or upload to temporary bucket)
    echo "Download link generation..."
fi

echo "Restore complete!"

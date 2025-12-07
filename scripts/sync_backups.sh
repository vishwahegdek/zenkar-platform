#!/bin/bash

# Configuration
REMOTE_USER="vishwa"
REMOTE_HOST="160.250.204.219"
REMOTE_DIR="/home/vishwa/projects/zenkar/Order Book/zenkar-platform/backups/"
LOCAL_DIR="./local_backups"

# Ensure local directory exists
mkdir -p "$LOCAL_DIR"

echo "🔄 Syncing backups from $REMOTE_HOST..."

# Use rsync to pull files (avoids duplicates)
# -a: archive mode (preserves permissions/times)
# -v: verbose
# -z: compress during transfer
# --progress: show progress bar
rsync -avz --progress "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR" "$LOCAL_DIR"

if [ $? -eq 0 ]; then
    echo "✅ Backup Sync Complete! Files saved to $LOCAL_DIR"
    ls -lh "$LOCAL_DIR"
else
    echo "❌ Backup Sync Failed."
    exit 1
fi

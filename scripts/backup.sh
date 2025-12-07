#!/bin/bash

# Zenkar Platform Backup Script
# Creates a compressed SQL dump of the running database container.

# 1. Configuration
BACKUP_DIR="../backups"
CONTAINER_NAME="zenkar-db"
DB_USER="postgres"
DB_NAME="order_book"
DATE=$(date +"%Y-%m-%d_%H%M%S")
FILENAME="backup_${DATE}.sql.gz"

# 2. Ensure Backup Directory Exists
mkdir -p "$BACKUP_DIR"

# 3. Create Backup
echo "📦 Starting backup: $FILENAME"
echo "Target: $CONTAINER_NAME ($DB_NAME)"

if sudo docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/$FILENAME"; then
    echo "✅ Backup successful: $BACKUP_DIR/$FILENAME"
    
    # 4. Cleanup (Keep last 7 days)
    # find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete
    exit 0
else
    echo "❌ Backup failed!"
    # Ensure partial file is removed to avoid confusion
    rm -f "$BACKUP_DIR/$FILENAME"
    exit 1
fi

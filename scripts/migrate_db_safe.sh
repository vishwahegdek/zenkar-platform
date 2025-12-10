#!/bin/bash
set -e

# Configuration
# Adjust these variables if running in a different environment
DB_CONTAINER="zenkar-db-demo"
DB_USER="postgres"
DB_NAME="zenkar_db_demo"
BACKUP_DIR="./backups/schema_migration"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/pre_migration_backup_$TIMESTAMP.sql"

# Ensure we are in the project root or adjust paths accordingly
# This script assumes it's run from the project root or scripts folder
mkdir -p $BACKUP_DIR

echo "🛡️  Starting Safe Database Migration..."
echo "-------------------------------------"

# 1. Verify Database Container is Running
if ! docker ps | grep -q $DB_CONTAINER; then
    echo "❌ Error: Database container '$DB_CONTAINER' is not running."
    exit 1
fi

# 2. Backup Existing Database
echo "📦 Backing up current database ($DB_NAME)..."
docker exec $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup computed successfully!"
    echo "   📍 Location: $BACKUP_FILE"
else
    echo "❌ Backup failed. Aborting migration to protect data."
    exit 1
fi

# 3. Apply Schema Changes (Migrations)
echo "🔄 Converting schema to new version (Prisma Migrate)..."
echo "   Running: npx prisma migrate deploy"

# We use the backend container or a temporary one to run the migration
# Using 'docker-compose' from the deploy/staging folder if possible, 
# or directly executing in running backend container if available.

# Check if we can find a running backend container to exec into, 
# otherwise try docker-compose from standard paths.
BACKEND_CONTAINER="zenkar-backend-demo"

if docker ps | grep -q $BACKEND_CONTAINER; then
    docker exec $BACKEND_CONTAINER npx prisma migrate deploy
    EXIT_CODE=$?
else
    # Fallback: Try to find docker-compose file
    if [ -f "deploy/staging/docker-compose.yml" ]; then
        docker-compose -f deploy/staging/docker-compose.yml run --rm backend npx prisma migrate deploy
        EXIT_CODE=$?
    elif [ -f "docker-compose.yml" ]; then
        docker-compose run --rm backend npx prisma migrate deploy
        EXIT_CODE=$?
    else
        echo "⚠️  Could not find running backend container or docker-compose.yml to run migrations."
        echo "   Please run 'npx prisma migrate deploy' manually."
        exit 1
    fi
fi

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Schema migration completed successfully."
else
    echo "❌ Schema migration failed."
    echo "   💡 You can restore the backup using:"
    echo "   cat $BACKUP_FILE | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME"
    exit 1
fi

echo "-------------------------------------"
echo "🎉 Safe Migration Complete!"

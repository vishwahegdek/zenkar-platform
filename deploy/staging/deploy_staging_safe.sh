#!/bin/bash
set -e

# Configuration
BACKUP_DIR="../../pgdata_demo/backups"
DB_CONTAINER="zenkar-db-demo"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/zenkar_db_demo_$TIMESTAMP.sql"

echo "🚀 Starting Safe Deployment for Staging (v1.2.1)..."

# 1. Verification
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running."
  exit 1
fi

# 2. Backup Database
echo "📦 Backing up database..."
mkdir -p $BACKUP_DIR

if [ "$(docker ps -q -f name=$DB_CONTAINER)" ]; then
    docker exec $DB_CONTAINER pg_dump -U postgres -d zenkar_db_demo > $BACKUP_FILE
    if [ $? -eq 0 ]; then
        echo "✅ Backup successful: $BACKUP_FILE"
    else
        echo "❌ Backup failed! Aborting deployment."
        exit 1
    fi
else
    echo "⚠️  Database container '$DB_CONTAINER' not found. Skipping backup (Assuming fresh install or stop)."
fi

# Get absolute path for user convenience
ABS_BACKUP_PATH=$(readlink -f "$BACKUP_FILE")
echo "💾 Backup stored at: $ABS_BACKUP_PATH"
echo "⬇️  To download to your LOCAL machine, run this on your computer:"
echo "    scp $USER@160.250.204.219:$ABS_BACKUP_PATH ./local_backup.sql"


# 3. Pull/Build Updates
echo "🔨 Building new images..."
docker-compose build

# 4. Safe Migration
echo "🔄 Running migrations..."
# Run a temporary backend container to execute migrations against the running DB
if ! docker-compose run --rm backend npx prisma migrate deploy; then
    echo "❌ Migration failed! Aborting deployment. Database might be in inconsistent state, but we have a backup."
    echo "💡 To restore: docker exec -i $DB_CONTAINER psql -U postgres -d zenkar_db_demo < $BACKUP_FILE"
    exit 1
fi
echo "✅ Migrations applied successfully."

# 5. Restart Services
echo "🚀 Restarting services..."
docker-compose up -d

# 6. Verify
echo "✅ Deployment Complete!"
echo "📡 Checking Health..."
sleep 5
if curl -s http://localhost:3000/api/health > /dev/null; then
   echo "🟢 Backend is healthy."
else 
   echo "⚠️  Backend might be starting up or unhealthy. Check logs: docker compose logs -f backend"
fi

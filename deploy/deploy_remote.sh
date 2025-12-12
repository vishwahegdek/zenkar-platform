#!/bin/bash

# Usage: ./deploy_remote.sh <environment>
# environment: staging | production

set -e

if [ -z "$1" ]; then
  echo "Usage: ./deploy_remote.sh <staging|production>"
  exit 1
fi

ENV=$1
DATE_TAG=$(date +%Y%m%d-%H%M%S)

# Configuration Variables
if [ "$ENV" == "production" ]; then
    PROJECT_DIR="$HOME/zenkar-platform-production"
    COMPOSE_FILE="deploy/production/docker-compose.yml"
    DB_CONTAINER="zenkar-db-prod"
    BACKEND_CONTAINER="zenkar-backend-prod"
    DB_NAME="order_book"
    DB_USER="postgres"
else
    PROJECT_DIR="$HOME/zenkar-staging"
    COMPOSE_FILE="deploy/staging/docker-compose.yml"
    DB_CONTAINER="zenkar-db-demo"
    BACKEND_CONTAINER="zenkar-backend-demo"
    DB_NAME="zenkar_db_demo"
    DB_USER="postgres"
fi

BACKUP_DIR="$HOME/zenkar-backups/$ENV"

echo "🚀 Starting Deployment to $ENV"
echo "📂 Project Dir: $PROJECT_DIR"

# 1. Update Code (to get new compose files)
echo "📥 Pulling latest code..."
cd $PROJECT_DIR
git fetch --all
git reset --hard origin/master # Updated to use master

# 2. Database Backup
echo "💾 Creating Database Backup..."
mkdir -p $BACKUP_DIR
docker exec -t $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > "$BACKUP_DIR/backup_${ENV}_${DATE_TAG}.sql"

if [ $? -eq 0 ]; then
  echo "✅ Backup Successful: $BACKUP_DIR/backup_${ENV}_${DATE_TAG}.sql"
else
  echo "❌ Backup Failed! Aborting deployment."
  exit 1
fi

# 3. Pull New Images
echo "🐳 Pulling latest images from Docker Hub..."
docker-compose -f $COMPOSE_FILE pull

# 4. Restart Services
echo "🔄 Restarting Services..."
docker-compose -f $COMPOSE_FILE up -d

# 5. Run Migrations
echo "📦 Running Prisma Migrations..."
# We run this inside the backend container to ensure it's using the correct schema/client
docker exec $BACKEND_CONTAINER npx prisma migrate deploy

echo "✅ Deployment Complete!"

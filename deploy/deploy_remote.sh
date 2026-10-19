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
    PROJECT_DIR="/home/vishwa/zenkar_platform_production"
    COMPOSE_FILE="deploy/production/docker-compose.yml"
    DB_CONTAINER="zenkar-db-prod"
    BACKEND_CONTAINER="zenkar-backend-prod"
    DB_NAME="order_book"
    DB_USER="postgres"
else
    PROJECT_DIR="/home/vishwa/zenkar_platform_staging"
    COMPOSE_FILE="deploy/staging/docker-compose.yml"
    DB_CONTAINER="zenkar-db-demo"
    BACKEND_CONTAINER="zenkar-backend-demo"
    DB_NAME="order_book"
    DB_USER="postgres"
fi

BACKUP_DIR="/home/vishwa/zenkar-backups/$ENV"

echo "🚀 Starting Deployment to $ENV"
echo "📂 Project Dir: $PROJECT_DIR"

# 1. Update Code (to get new compose files)
echo "📥 Pulling latest code..."
cd "$PROJECT_DIR"

# --- Deployment Verification: Log Current State ---
CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
# Extract version from package.json using grep/sed to avoid jq dependency if not present, or use node
CURRENT_VERSION=$(grep '"version":' package.json 2>/dev/null | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
if [ -z "$CURRENT_VERSION" ]; then
    CURRENT_VERSION="unknown"
fi

mkdir -p "$BACKUP_DIR"
LOG_FILE="$BACKUP_DIR/deployment_log.txt"
echo "$(date '+%Y-%m-%d %H:%M:%S') | Version: $CURRENT_VERSION | Commit: $CURRENT_COMMIT | Backup: backup_${ENV}_v${CURRENT_VERSION}_${DATE_TAG}.sql" >> "$LOG_FILE"
echo "📝 Logged previous state: $CURRENT_VERSION ($CURRENT_COMMIT)"
# --------------------------------------------------

# Determine docker compose command
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Neither 'docker compose' nor 'docker-compose' found!"
    exit 1
fi

# 2. Database Backup
echo "💾 Creating Database Backup..."
docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > "$BACKUP_DIR/backup_${ENV}_v${CURRENT_VERSION}_${DATE_TAG}.sql"

if [ $? -eq 0 ]; then
  echo "✅ Backup Successful: $BACKUP_DIR/backup_${ENV}_v${CURRENT_VERSION}_${DATE_TAG}.sql"
else
  echo "❌ Backup Failed! Aborting deployment."
  exit 1
fi

# 3. Pull New Images
echo "🐳 Pulling latest images from Docker Hub..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" pull

# 4. Restart Services
echo "🔄 Restarting Services..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d

# 5. Run Migrations
echo "📦 Running Prisma Migrations..."
# We run this inside the backend container to ensure it's using the correct schema/client
docker exec $BACKEND_CONTAINER npx prisma migrate deploy

echo "✅ Deployment Complete!"

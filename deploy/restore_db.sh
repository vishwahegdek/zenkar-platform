#!/bin/bash

# Usage: ./restore_db.sh <environment> <backup_file_path>
# environment: staging | production

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./restore_db.sh <staging|production> <backup_file_path>"
  exit 1
fi

ENV=$1
BACKUP_FILE=$2

# Configuration Variables
if [ "$ENV" == "production" ]; then
    DB_CONTAINER="zenkar-db-prod"
    DB_NAME="order_book"
    DB_USER="postgres"
else
    DB_CONTAINER="zenkar-db-demo"
    DB_NAME="order_book"
    DB_USER="postgres"
fi

echo "⚠️  WARNING: You are about to restore the database for $ENV"
echo "⚠️  This will overwrite the current database: $DB_NAME"
echo "📂 Backup File: $BACKUP_FILE"
echo "❓ Are you sure? (Type 'yes' to proceed)"
read confirmation

if [ "$confirmation" != "yes" ]; then
  echo "❌ Restore cancelled."
  exit 1
fi

echo "🔄 Restoring Database..."

# Drop and Recreate Schema (Clean Restore)
# Note: Using cat + docker exec -i is better for piping files into pg_restore or psql
cat "$BACKUP_FILE" | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME

if [ $? -eq 0 ]; then
  echo "✅ Restore Complete!"
else
  echo "❌ Restore Failed!"
  exit 1
fi

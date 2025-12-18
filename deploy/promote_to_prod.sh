#!/bin/bash

# Usage: ./promote_to_prod.sh [git_sha]
# description: Promotes an existing Staging image (identified by Git SHA) to Production by retagging.

set -e

GIT_SHA=$1

if [ -z "$GIT_SHA" ]; then
    GIT_SHA=$(git rev-parse --short HEAD)
    echo "ℹ️  No Git SHA provided, using current HEAD: $GIT_SHA"
fi

DATE_TAG=$(date +%Y%m%d-%H%M%S)

# Repo Names
BACKEND_REPO="vishwahegdek/zenkar-backend"
FRONTEND_REPO="vishwahegdek/zenkar-frontend"

echo "🚀 Starting Promotion to PRODUCTION"
echo "🔗 Promoting Git SHA: $GIT_SHA"
echo "📅 New Prod Tag:      prod-$DATE_TAG"

# --- Backend Promotion ---
echo "🔄 Processing Backend..."
echo "Download..."
sudo docker pull "$BACKEND_REPO:$GIT_SHA"
echo "Retag..."
sudo docker tag "$BACKEND_REPO:$GIT_SHA" "$BACKEND_REPO:production"
sudo docker tag "$BACKEND_REPO:$GIT_SHA" "$BACKEND_REPO:prod-$DATE_TAG"
echo "Push..."
sudo docker push "$BACKEND_REPO:production"
sudo docker push "$BACKEND_REPO:prod-$DATE_TAG"

# --- Frontend Promotion ---
echo "🔄 Processing Frontend..."
echo "Download..."
sudo docker pull "$FRONTEND_REPO:$GIT_SHA"
echo "Retag..."
sudo docker tag "$FRONTEND_REPO:$GIT_SHA" "$FRONTEND_REPO:production"
sudo docker tag "$FRONTEND_REPO:$GIT_SHA" "$FRONTEND_REPO:prod-$DATE_TAG"
echo "Push..."
sudo docker push "$FRONTEND_REPO:production"
sudo docker push "$FRONTEND_REPO:prod-$DATE_TAG"

echo "✅ Promotion Complete!"
echo "Production is now pointing to commit $GIT_SHA"

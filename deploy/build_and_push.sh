#!/bin/bash

# Usage: ./build_and_push.sh
# description: Builds the Docker images once, tags them with the Git Commit Hash and Staging tags, and pushes them.

set -e

DATE_TAG=$(date +%Y%m%d-%H%M%S)
GIT_SHA=$(git rev-parse --short HEAD)

# Repo Names
BACKEND_REPO="vishwahegdek/zenkar-backend"
FRONTEND_REPO="vishwahegdek/zenkar-frontend"

echo "🚀 Starting Single-Build Process"
echo "📅 Date Tag: $DATE_TAG"
echo "🔗 Git SHA:  $GIT_SHA"

# Tags for Backend (Staging + Immutable SHA)
BACKEND_TAGS="-t $BACKEND_REPO:staging -t $BACKEND_REPO:staging-$DATE_TAG -t $BACKEND_REPO:$GIT_SHA"
# Tags for Frontend (Staging + Immutable SHA)
FRONTEND_TAGS="-t $FRONTEND_REPO:staging -t $FRONTEND_REPO:staging-$DATE_TAG -t $FRONTEND_REPO:$GIT_SHA"

# Build Backend
echo "🔨 Building Backend..."
sudo docker build $BACKEND_TAGS -f backend/Dockerfile .

# Build Frontend
echo "🔨 Building Frontend..."
sudo docker build $FRONTEND_TAGS -f frontend/Dockerfile .

# Push Images
echo "📤 Pushing Backend Images..."
sudo docker push "$BACKEND_REPO:staging"
sudo docker push "$BACKEND_REPO:staging-$DATE_TAG"
sudo docker push "$BACKEND_REPO:$GIT_SHA"

echo "📤 Pushing Frontend Images..."
sudo docker push "$FRONTEND_REPO:staging"
sudo docker push "$FRONTEND_REPO:staging-$DATE_TAG"
sudo docker push "$FRONTEND_REPO:$GIT_SHA"

echo "✅ Build and Push Complete!"
echo "$GIT_SHA" > .latest_build_sha
echo "ℹ️  Saved SHA to .latest_build_sha"
echo "👉 To promote this build to PRODUCTION, run: ./deploy/promote_to_prod.sh (It will use $GIT_SHA by default)"


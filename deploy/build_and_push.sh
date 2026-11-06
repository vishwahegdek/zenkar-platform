#!/bin/bash

# Usage: ./build_and_push.sh
# description: Builds the Docker images once, tags them with the Git Commit Hash and Staging tags, and pushes them.

set -e

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo "❌ ERROR: You have uncommitted changes in your working directory."
  echo "Please commit or stash your changes before building."
  echo ""
  git status --short
  exit 1
fi

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

if sudo -n true 2>/dev/null; then
  DOCKER_CMD="sudo docker"
else
  DOCKER_CMD="docker"
fi

# Build Backend
echo "🔨 Building Backend..."
$DOCKER_CMD build $BACKEND_TAGS -f backend/Dockerfile .

# Build Frontend
echo "🔨 Building Frontend..."
$DOCKER_CMD build $FRONTEND_TAGS -f frontend/Dockerfile .

# Push Images
echo "📤 Pushing Backend Images..."
$DOCKER_CMD push "$BACKEND_REPO:staging"
$DOCKER_CMD push "$BACKEND_REPO:staging-$DATE_TAG"
$DOCKER_CMD push "$BACKEND_REPO:$GIT_SHA"

echo "📤 Pushing Frontend Images..."
$DOCKER_CMD push "$FRONTEND_REPO:staging"
$DOCKER_CMD push "$FRONTEND_REPO:staging-$DATE_TAG"
$DOCKER_CMD push "$FRONTEND_REPO:$GIT_SHA"

echo "✅ Build and Push Complete!"
# Try to write SHA, but don't fail the script if it fails (it's just a helper)
if rm -f .latest_build_sha && echo "$GIT_SHA" > .latest_build_sha; then
  echo "ℹ️  Saved SHA to .latest_build_sha"
else
  echo "⚠️  Could not save SHA to .latest_build_sha (Permission Denied?)"
fi

echo "👉 To promote this build to PRODUCTION, run: ./deploy/promote_to_prod.sh $GIT_SHA"


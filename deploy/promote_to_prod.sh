#!/bin/bash

# Usage: ./promote_to_prod.sh [git_sha]
# description: Promotes an existing Staging image (identified by Git SHA) to Production by retagging.

set -e

GIT_SHA=$1

if [ -z "$GIT_SHA" ]; then
    # Default to HEAD
    GIT_SHA=$(git rev-parse --short HEAD)
    echo "ℹ️  No SHA provided. Using current HEAD: $GIT_SHA"

    # Optional: Warn if it differs from latest build (if file exists/readable)
    if [ -f ".latest_build_sha" ] && [ -r ".latest_build_sha" ]; then
        LAST_BUILD=$(cat .latest_build_sha)
        if [ "$GIT_SHA" != "$LAST_BUILD" ]; then
            echo "⚠️  WARNING: Current HEAD ($GIT_SHA) differs from last recorded build ($LAST_BUILD)."
            echo "   Make sure you have built/pushed the current commit before promoting!"
            echo "   Proceeding with HEAD ($GIT_SHA) in 5 seconds... (Ctrl+C to abort)"
            sleep 5
        fi
    fi
fi

DATE_TAG=$(date +%Y%m%d-%H%M%S)

# Repo Names
BACKEND_REPO="vishwahegdek/zenkar-backend"
FRONTEND_REPO="vishwahegdek/zenkar-frontend"

echo "🚀 Starting Promotion to PRODUCTION"
echo "🔗 Promoting Git SHA: $GIT_SHA"
echo "📅 New Prod Tag:      prod-$DATE_TAG"

if sudo -n true 2>/dev/null; then
  DOCKER_CMD="sudo docker"
else
  DOCKER_CMD="docker"
fi

# --- Backend Promotion ---
echo "🔄 Processing Backend..."
echo "Download..."
$DOCKER_CMD pull "$BACKEND_REPO:$GIT_SHA"
echo "Retag..."
$DOCKER_CMD tag "$BACKEND_REPO:$GIT_SHA" "$BACKEND_REPO:production"
$DOCKER_CMD tag "$BACKEND_REPO:$GIT_SHA" "$BACKEND_REPO:prod-$DATE_TAG"
echo "Push..."
$DOCKER_CMD push "$BACKEND_REPO:production"
$DOCKER_CMD push "$BACKEND_REPO:prod-$DATE_TAG"

# --- Frontend Promotion ---
echo "🔄 Processing Frontend..."
echo "Download..."
$DOCKER_CMD pull "$FRONTEND_REPO:$GIT_SHA"
echo "Retag..."
$DOCKER_CMD tag "$FRONTEND_REPO:$GIT_SHA" "$FRONTEND_REPO:production"
$DOCKER_CMD tag "$FRONTEND_REPO:$GIT_SHA" "$FRONTEND_REPO:prod-$DATE_TAG"
echo "Push..."
$DOCKER_CMD push "$FRONTEND_REPO:production"
$DOCKER_CMD push "$FRONTEND_REPO:prod-$DATE_TAG"

echo "✅ Promotion Complete!"
echo "Production is now pointing to commit $GIT_SHA"

#!/bin/bash

# Usage: ./build_and_push.sh <environment>
# environment: staging | production

set -e

if [ -z "$1" ]; then
  echo "Usage: ./build_and_push.sh <staging|production>"
  exit 1
fi

ENV=$1
DATE_TAG=$(date +%Y%m%d-%H%M%S)

# Repo Names
BACKEND_REPO="vishwahegdek/zenkar-backend"
FRONTEND_REPO="vishwahegdek/zenkar-frontend"

echo "🚀 Starting build for environment: $ENV"
echo "📅 Tag: $DATE_TAG"

# Determine Tags
if [ "$ENV" == "production" ]; then
    BACKEND_TAGS="-t $BACKEND_REPO:production -t $BACKEND_REPO:prod-$DATE_TAG"
    FRONTEND_TAGS="-t $FRONTEND_REPO:production -t $FRONTEND_REPO:prod-$DATE_TAG"
else
    BACKEND_TAGS="-t $BACKEND_REPO:staging -t $BACKEND_REPO:staging-$DATE_TAG"
    FRONTEND_TAGS="-t $FRONTEND_REPO:staging -t $FRONTEND_REPO:staging-$DATE_TAG"
fi

# Build Backend
echo "🔨 Building Backend..."
docker build $BACKEND_TAGS -f backend/Dockerfile .

# Build Frontend
echo "🔨 Building Frontend..."
docker build $FRONTEND_TAGS -f frontend/Dockerfile .

# Push Images
echo "📤 Pushing Backend Images..."
docker push $BACKEND_REPO --all-tags

echo "📤 Pushing Frontend Images..."
docker push $FRONTEND_REPO --all-tags

echo "✅ Build and Push Complete!"

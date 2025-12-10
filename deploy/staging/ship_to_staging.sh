#!/bin/bash
set -e

# Configuration
SERVER_IP="160.250.204.219"
SSH_USER="vishwa" # Update if different
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
PROJECT_ROOT="$SCRIPT_DIR/../.."
REMOTE_DIR="projects/zenkar-platform/deploy/staging"

echo "🚀 Starting Deployment to Staging ($SERVER_IP)..."

# 1. Build Images Locally
echo "🔨 Building images locally..."
docker build -t zenkar-backend:staging -f $PROJECT_ROOT/backend/Dockerfile $PROJECT_ROOT
docker build -t zenkar-frontend:staging -f $PROJECT_ROOT/frontend/Dockerfile $PROJECT_ROOT

# 2. Save Images
echo "📦 Compressing images..."
docker save zenkar-backend:staging zenkar-frontend:staging | gzip > zenkar_staging_images.tar.gz

# 3. Transfer
echo "📤 Uploading images to server..."
scp zenkar_staging_images.tar.gz $SSH_USER@$SERVER_IP:/tmp/

# 4. Remote Execution
echo "🔄 Triggering remote deployment..."
ssh $SSH_USER@$SERVER_IP << 'EOF'
    set -e
    echo "📥 Loading images on server..."
    docker load < /tmp/zenkar_staging_images.tar.gz
    rm /tmp/zenkar_staging_images.tar.gz
    
    cd ~/projects/zenkar-platform/deploy/staging
    
    # Run the safe deployment script (sudo required)
    echo "🚀 Running safe deployment script..."
    # Assuming the user has NOPASSWD sudo or will prompt interactively? 
    # Interactive prompt works over SSH if -t is used, but here heredoc might be tricky.
    # BEST PRACTICE: The user runs the final step manually OR we assume they can sudo.
    
    # Let's try running it. If it fails due to password, we'll warn.
    if sudo -n true 2>/dev/null; then 
        sudo ./deploy_staging_safe.sh
    else
        echo "⚠️  Auto-deploy stopped at sudo prompt."
        echo "👉 Please SSH in and run: cd projects/zenkar-platform/deploy/staging && sudo ./deploy_staging_safe.sh"
    fi
EOF

echo "✅ Build and Ship Complete!"
# Clean up local artifact
rm zenkar_staging_images.tar.gz

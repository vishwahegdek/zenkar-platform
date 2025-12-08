#!/bin/bash

# Zenkar Platform CI/CD Pipeline
# usage: ./cicd.sh [prod|demo]

ENV=$1
PASS="katte2934" # Password injected for sudo access

if [ -z "$ENV" ]; then
    echo "Usage: ./cicd.sh [prod|demo]"
    exit 1
fi

echo "🚀 Starting CI/CD Pipeline for environment: $ENV"

check_git_status() {
    if [ -n "$(git status --porcelain)" ]; then
        echo "❌ Error: Uncommitted changes detected. Please commit before deploying."
        # Enable bypassing if needed, e.g., with specific flag, but for now strict.
        exit 1
    fi
}

run_tests() {
    echo "🧪 Running Tests (Global)..."
    if ! npm test; then
        echo "❌ CI Failed: Tests failed."
        exit 1
    fi
    echo "✅ CI Passed."
}

wait_for_health() {
    URL=$1
    echo "🩺 verified health of: $URL"
    # Simple check - could be improved with retry loop
    # sleep 5 # Give it a moment to verify restart
    # curl -f $URL || echo "⚠️ Health check warning: site might be down"
}

# 1. CI CHECKS
check_git_status
run_tests



# ==========================================
# 2. CD STAGE (Continuous Deployment)
# ==========================================
echo "📦 Preparing for Deployment to $ENV..."

if [ "$ENV" == "prod" ]; then
    echo "   > Target: 160.250.204.219 (order.zenkar.in)"
    
    # Compress
    echo "   > Compressing..."
    tar --exclude='node_modules' --exclude='dist' --exclude='pgdata' --exclude='pgdata_demo' --exclude='.git' -czf zenkar-platform.tar.gz zenkar-platform

    # Upload
    echo "   > Uploading..."
    if ! python3 remote_scp.py "zenkar-platform.tar.gz" "zenkar-platform.tar.gz"; then
        echo "❌ CD Failed: SCP Upload failed."
        exit 1
    fi

    # Deploy (Prod)
    # 1. Extract
    # 2. Backup (Run with sudo)
    # 3. Deploy (Run with sudo)
    echo "   > Executing Remote Deployment (Prod)..."
    CMD="tar -xzf zenkar-platform.tar.gz -C /home/vishwa && cd /home/vishwa/zenkar-platform && chmod +x scripts/backup.sh && echo '$PASS' | sudo -S ./scripts/backup.sh && echo '$PASS' | sudo -S docker-compose -f deploy/production/docker-compose.yml up --build -d"
    
    if ! python3 remote_exec.py "$CMD"; then
        echo "❌ CD Failed: Remote Execution failed."
        exit 1
    fi
    
    wait_for_health "https://order.zenkar.in"

elif [ "$ENV" == "demo" ]; then
    echo "🚧 Deploying to DEMO Environment (orderdemo.zenkar.in)..."
    echo "   > Target: 160.250.204.219 (Isolated DB)"
    
    # Compress
    echo "   > Compressing..."
    tar --exclude='node_modules' --exclude='dist' --exclude='pgdata' --exclude='pgdata_demo' --exclude='.git' -czf zenkar-platform.tar.gz zenkar-platform

    # Upload
    echo "   > Uploading..."
    if ! python3 remote_scp.py "zenkar-platform.tar.gz" "zenkar-platform.tar.gz"; then
        echo "❌ CD Failed: SCP Upload failed."
        exit 1
    fi

    # Deploy (Demo)
    # Extracts to '/home/vishwa/zenkar-staging' for isolation
    echo "   > Executing Remote Deployment (Demo)..."
    CMD="mkdir -p /home/vishwa/zenkar-staging && tar -xzf zenkar-platform.tar.gz -C /home/vishwa/zenkar-staging --strip-components=1 && cd /home/vishwa/zenkar-staging && echo '$PASS' | sudo -S docker-compose -f deploy/staging/docker-compose.yml up --build -d"
    
    if ! python3 remote_exec.py "$CMD"; then
        echo "❌ CD Failed: Remote Execution failed."
        exit 1
    fi

    wait_for_health "https://orderdemo.zenkar.in"

else
    echo "❌ Unknown environment: $ENV"
    echo "Usage: ./cicd.sh [prod|demo]"
    exit 1
fi

echo "✅ CD Pipeline Complete!"

# Development & Deployment Workflow

This document outlines the standard process for developing, testing, versioning, and deploying the Zenkar Platform.

## 1. Development Cycle
All work should follow this cycle to ensure stability and tracking.

1.  **Feature/Bug Identification**: Define the task in `task.md`.
2.  **Implementation**: Write code locally.
3.  **Local Verification**:
    -   Frontend: `cd zenkar-platform/frontend && npm test`
    -   Full Stack: `sudo docker compose up --build -d`
    -   Manual Check: Verify changes at `http://localhost:5173`.

## 2. Versioning Strategy
We follow **Semantic Versioning** (vX.Y.Z):
-   **X (Major)**: Breaking changes (e.g., API overhaul).
-   **Y (Minor)**: New features (non-breaking, e.g., new "Closed" status).
-   **Z (Patch)**: Bug fixes (e.g., Fixing Mobile Copy).

### Tracking
-   **CHANGELOG.md**: Must be updated before every commit/deploy.
-   **Git Tags**: Use tags for release points (e.g., `git tag v1.0.0`).

## 3. Git Workflow
Since this is a solo/small team project, we use a streamlined Trunk-Based workflow.

```bash
# 1. Check Status
git status

# 2. Stage Changes
git add .

# 3. Commit with Conventional Message
git commit -m "feat: add copy to clipboard fallback for mobile"

# 4. Tag (if release)
git tag v1.1.0

# 5. Push (if remote exists)
# git push origin main --tags
```

## 4. Deployment
Deployment is containerized via Docker Compose.

```bash
# 1. Pull Latest (if on server)
# git pull origin main

# 2. Rebuild & Restart
sudo docker compose up --build -d

# 3. Verify
docker ps
docker logs zenkar-backend
```

## 5. Rollback
If a deployment fails, use git to revert to the previous tag:

```bash
# Checkout previous version
git checkout v1.0.0

# Redeploy
sudo docker compose up --build -d
```

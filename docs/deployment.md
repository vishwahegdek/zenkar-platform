# Zenkar Platform: Deployment & Data Migration Guide

This guide details how to deploy the Zenkar Platform using the automated Push Pipeline.

## 1. Prerequisites
- [x] Local environment set up with `cicd.sh`, `remote_scp.py`, and `remote_exec.py`.
- [x] SSH access enabled to `server` (160.250.204.219).
- [x] Docker configured on the remote server.

## 2. Deployment Workflow (Push Pipeline)

We do **not** pull code directly on the server. Instead, we bundle the application locally and push it.

### Commands

**Deploy to Production** (order.zenkar.in):
```bash
./cicd.sh prod
```

**Deploy to Demo** (orderdemo.zenkar.in):
```bash
./cicd.sh demo
```

### What Happens Behind the Scenes
1.  **Test**: Runs local frontend tests (`npm test`).
2.  **Package**: Compresses the project into `zenkar-platform.tar.gz`.
3.  **Upload**: SCPs the tarball to the server.
4.  **Deploy**:
    -   Extracts the code.
    -   Triggers a pre-deployment database backup.
    -   Runs `docker-compose up --build -d` to restart services.

## 3. Data Migration
The system maps `../../pgdata` (relative to the compose file) to the database container.
-   **No manual migration needed** for code updates.
-   Database schema changes should be handled via Prisma Migrations (run automatically if configured in start script).

## 4. Troubleshooting
-   **"SCP Upload Failed"**: Check internet connection and VPN/SSH keys.
-   **"Remote Execution Failed"**:
    -   Try running manual commands: `python3 remote_exec.py "docker ps"`
    -   Check server disk space: `python3 remote_exec.py "df -h"`
-   **Lock Files**: If deployment hangs, check for existing `apt` or `docker` processes on the server.

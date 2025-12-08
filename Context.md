# Project Context & Agent Guide

This document provides essential context for AI Agents working on the Zenkar Platform.

## 1. Project Structure
-   **Git Root**: `zenkar-platform/`
-   **Config**: `zenkar-platform/docker-compose.yml` (Versioned)
-   **Scripts**:
    -   `deploy.sh` (Root): Deployment entry point.
    -   `remote_exec.py` (Root): Remote command execution.
    -   `remote_scp.py` (Root): Remote file transfer.

## 2. Version Control (Git)
We use a Trunk-Based Development workflow.
-   **Commit**: `git add . && git commit -m "type: message"`
-   **Release**: `git tag vX.Y.Z && git push origin master --tags`
-   **Changelog**: Always update `zenkar-platform/CHANGELOG.md` before release.

## 3. Deployment Flow (Push Pipeline)
Due to server network restrictions, we do **NOT** use `git pull` for deployment.
Git is strictly for Version Control & Backup.

### The Mechanism (`cicd.sh`)
Refers to `cicd.sh` (Local) -> `remote_scp.py` (Push) -> `remote_exec.py` (Deploy).

### Workflow
1.  **Local**: Develop and Test.
2.  **Demo**: `./cicd.sh demo` -> Push tarball to `orderdemo.zenkar.in` (Isolated).
3.  **Prod**: `./cicd.sh prod` -> Push tarball to `order.zenkar.in` (Auto-Backup).

### Manual Remote Access (If needed)
Use the python wrappers to bypass password prompts:
```bash
python3 remote_exec.py "docker ps"
```

## 4. Key Files to Check
-   `zenkar-platform/docs/deployment.md`: Detailed manual steps.
-   `zenkar-platform/frontend/src/pages/OrdersList.jsx`: Main UI logic.
-   `zenkar-platform/backend/src/orders/orders.service.ts`: Core business logic.

## 5. Troubleshooting & Patterns (Agent Knowledge)

### A. Sudo / Interactive Prompts
`remote_exec.py` can hang on password prompts.
**Solution**: Inject password via pipe.
```python
# BAD
python3 remote_exec.py "sudo docker ps"

# GOOD
python3 remote_exec.py "echo 'katte2934' | sudo -S docker ps"
```

### B. Docker Build Context
We run docker-compose from the **Project Root**.
-   `docker-compose.yml` context is `.`.
-   **Dockerfile Rule**: All `COPY` paths must be relative to Root.
    -   Example: `COPY backend/package.json ./` (Not `COPY package.json ./`)

### C. Git vs Deployment
-   **Git**: Used for tracking history and safe backups.
-   **Deployment**: Uses `scp` + `tar` (Push Pipeline).
    -   *Reason*: Server has unstable Git connection.
    -   *Agent Rule*: Do NOT try to fix `git pull` on server. Use the Push Pipeline.

### D. Container Conflicts
If `docker-compose up` fails with "container name already in use":
-   **Cause**: Old containers (manual or previous run) blocking new ones.
-   **Fix**: `docker rm -f <container_names>` then retry.

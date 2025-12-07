# Server Access & Context

**Last Updated**: 2025-12-06
**Host**: `160.250.204.219`
**User**: `vishwa`

## 1. Access

### SSH Command
```bash
ssh vishwa@160.250.204.219
```
*Note: Ensure your public key is added to `~/.ssh/authorized_keys` on the remote server.*

### Project Location
- **Root**: `/home/vishwa/projects/zenkar/Order Book/`
- **Repo**: `zenkar-platform/` (inside the root)
- **Data**: `pgdata/` (Postgres data volume in `Order Book/`)

## 2. Current State (as of Dec 6, 2025)

The server is running the Zenkar Platform via Docker Compose.

### Running Containers (`docker ps`)

| Container Name | Image | Port | Status |
| :--- | :--- | :--- | :--- |
| **zenkar-frontend** | `vishwa-frontend` | `3000:80` | ✅ Up |
| **zenkar-backend** | `vishwa-backend` | `3000` (Internal) | ✅ Up |
| **zenkar-db** | `postgres:15-alpine` | `5432:5432` | ✅ Up |
| **odoo_zenkar** | `odoo:18` | `8069:8069` | ✅ Up (Legacy/Parallel) |

### Important Processes (System)
- **Docker Daemon**: Managed by `systemd`.
- **Nginx (Host)**: Likely proxying `order.zenkar.in` to port `:3000`.

## 3. Maintenance Cheat Sheet

### Redeploying
Navigate to the project directory and pull/rebuild:
```bash
cd "/home/vishwa/projects/zenkar/Order Book/zenkar-platform"
git pull origin master
docker-compose up --build -d
```

### Viewing Logs
```bash
# Backend Logs
docker logs -f zenkar-backend

# Frontend/Nginx Logs
docker logs -f zenkar-frontend
```


## 4. Automation Workflow (Agent Access)

To interact with the server programmatically (and bypass interactive password prompts), we setup a Python-based automation pipeline.

### The Mechanism
We use **Python** with the `pexpect` library to handle SSH connections, key verification, and `sudo` password entry automatically.

### Scripts
Two utility scripts in the project root handle all remote operations:

#### 1. `remote_exec.py` (Remote Execution)
*   **Purpose**: Runs shell commands on the remote server.
*   **Flow**:
    1.  Spawns an `ssh` process with `-tt` (force TTY).
    2.  Waits for password prompt (if key isn't sufficient) or `sudo` prompt.
    3.  Sends password (`katte2934`) automatically when detected.
    4.  Captures and prints output.
*   **Usage**:
    ```bash
    python3 remote_exec.py "ls -la"
    python3 remote_exec.py 'echo "PASSWORD" | sudo -S docker ps'
    ```

#### 2. `remote_scp.py` (File Transfer)
*   **Purpose**: Uploads files to the server.
*   **Flow**:
    1.  Spawns `scp`.
    2.  Handles potential timeouts for large files (e.g., `deployment.tar.gz`).
*   **Usage**:
    ```bash
    python3 remote_scp.py local_file /remote/path/destination
    ```

### Prerequisites
To use this flow, you need:
-   Python 3 installed.
-   `pexpect` library (`pip install pexpect`).

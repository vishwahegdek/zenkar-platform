# Infrastructure & Configuration

**Source of Truth** for the Zenkar Platform infrastructure.

## 1. Technology Stack
-   **Frontend**: React (Vite) + TailwindCSS.
-   **Backend**: NestJS (Node.js).
-   **Database**: PostgreSQL 15.
-   **Containerization**: Docker & Docker Compose.

## 2. Server Details
-   **Host IP**: `160.250.204.219`
-   **SSH User**: `vishwa`
-   **Production Path**: `~/zenkar-platform-production/` (Renamed from `zenkar-platform/`)
-   **Staging Path**: `~/zenkar-staging/`

## 3. Workflow & Architecture

### A. The 3-Step Promotion Workflow
See `deploy/DEPLOYMENT_REFERENCE.md` for specific commands.

### B. Directory Isolation (Server)
We use separate directories to allow standard service names (`backend`, `frontend`) without conflict.

| Environment | Directory | Compose File |
| :--- | :--- | :--- |
| **Staging** | `~/zenkar-staging/` | `deploy/staging/docker-compose.yml` |
| **Production** | `~/zenkar-platform-production/` | `deploy/production/docker-compose.yml` |


| Feature | Production (`order.zenkar.in`) | Staging (`orderdemo.zenkar.in`) |
| :--- | :--- | :--- |
| **Database Container** | `zenkar-db-prod` | `zenkar-db-demo` |
| **DB Internal Port** | `5432` | `5432` |
| **DB Host Port** | `5433` | `5432` |
| **Backend Container** | `zenkar-backend-prod` | `zenkar-backend-demo` |
| **Backend Port** | `3001` (Host) | `3000` (Host) |
| **Frontend Container** | `zenkar-frontend-prod` | `zenkar-frontend-demo` |
| **Frontend Port** | `5174` (Host) | `5173` (Host) |

### C. Domain Connection
*   `order.zenkar.in` -> Nginx (Host) -> `http://localhost:5174`.
*   `orderdemo.zenkar.in` -> Nginx (Host) -> `http://localhost:5173`.

### D. Data Backup
*   **Location**: `~/backups/` and `pgdata` snapshots.


## 4. Domains & Routing (Nginx)
The server runs a host-level Nginx acting as a Reverse Proxy.

### A. Production (`order.zenkar.in`)
-   **Url**: `https://order.zenkar.in`
-   **Internal Routing**: `http://127.0.0.1:3000`
-   **Target**: Zenkar Frontend Container (must be mapped to port 3000).

### B. Legacy (`odoo.zenkar.in`)
-   **Internal Routing**: `http://127.0.0.1:8069`
-   **Target**: Odoo Container.

### C. Demo (`orderdemo.zenkar.in`)
-   **Status**: *Pending Configuration*
-   **Planned Port**: `3001`
-   **Nginx Config Snippet**:
    ```nginx
    server {
        server_name orderdemo.zenkar.in;
        location / {
            proxy_pass http://127.0.0.1:3001;
            proxy_set_header Host $host;
        }
        listen 80;
    }
    ```

## 5. Data Strategy (Backups)
**Zero Data Loss Policy**: We utilize a multi-layer strategy to protect User Data (`zenkar_db`).

### A. Deployment Safety
-   **Mechanism**: The CI/CD pipeline (`cicd.sh`) triggers `scripts/backup.sh` **before** any Docker changes.
-   **Fail-Safe**: If the backup fails, the deployment aborts immediately.

### B. Periodic Backups (Disaster Recovery)
-   **Recommendation**: Configure a Daily Cron Job on the server.
    ```bash
    0 3 * * * /home/vishwa/projects/zenkar/Order\ Book/zenkar-platform/scripts/backup.sh
    ```
-   **Location**: Backups are stored in `zenkar-platform/backups/`.

### C. Restore Procedure
Refer to `docs/backup_and_recovery.md` for full restore instructions (extract `.sql.gz` -> pipe to `psql`).

## 6. SSL / Certbot
Managed via LetsEncrypt.
-   **Cert Path**: `/etc/letsencrypt/live/order.zenkar.in/`
-   **Auto-Renew**: Configured via cron/systemd.

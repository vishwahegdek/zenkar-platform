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
-   **Project Root**: `/home/vishwa/projects/zenkar/Order Book/`
-   **Production Path**: `zenkar-platform/` (inside root)
-   **Staging Path**: `zenkar-staging/` (inside root)

## 3. Workflow & Architecture

### A. The 3-Step Promotion Workflow
1.  **Develop (Local)**: Code and test on your local machine.
2.  **Staging (Server)**: Deploy using the workflow script.
    ```bash
    ./zenkar-platform/scripts/deploy_workflow.sh staging
    ```
    *   **Action**: Syncs Local -> `/home/vishwa/zenkar-staging`. Rebuilds Staging.
    *   **Url**: `orderdemo.zenkar.in`
3.  **Production (Server)**: Promote Staging to Production.
    ```bash
    ./zenkar-platform/scripts/deploy_workflow.sh prod
    ```
    *   **Action**: Syncs Staging -> `/home/vishwa/zenkar-platform` (Internal Copy). Rebuilds Prod.
    *   **Url**: `order.zenkar.in`

### B. Directory Isolation (Server)
We use separate directories to allow standard service names (`backend`, `frontend`) without conflict.

| Environment | Directory | Compose File |
| :--- | :--- | :--- |
| **Staging** | `/home/vishwa/zenkar-staging/` | `deploy/staging/docker-compose.yml` |
| **Production** | `/home/vishwa/zenkar-platform/` | `deploy/production/docker-compose.yml` |


| Feature | Production (`order.zenkar.in`) | Staging (`orderdemo.zenkar.in`) |
| :--- | :--- | :--- |
| **Database Container** | `zenkar-db` | `zenkar-db-demo` |
| **DB Internal Port** | `5432` | `5432` |
| **DB Host Port** | `5433` | `5432` |
| **Backend Container** | `zenkar-backend` | `zenkar-backend-demo` |
| **Backend Port** | `3000` (Internal) / `3001` (Host) | `3000` (Internal) / `3000` (Host) |
| **Frontend Container** | `zenkar-frontend` | `zenkar-frontend-demo` |
| **Frontend Port** | `5173` (Internal) / `5174` (Host) | `5173` (Internal) / `5173` (Host) |

### C. Domain Connection
*   `order.zenkar.in` -> Nginx (Host) -> `http://localhost:5174`.
*   `orderdemo.zenkar.in` -> Nginx (Host) -> `http://localhost:5173`.

### D. Data Backup
*   **Location**: `zenkar-platform/backups/` (on the remote server).
*   **Double Safety**: Run `scripts/sync_backups.sh` locally to pull backups to your machine.


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

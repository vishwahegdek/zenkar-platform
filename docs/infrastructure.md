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
-   **Git Repo**: `zenkar-platform/` (inside root)

## 3. Database Configuration
| Environment | Host | Port | User | Database | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Local (Host)** | `localhost` | `5432` | *(You know)* | `zenkar_db` | Use for local testing. |
| **Docker (Dev)** | `db` | `5432` | `postgres` | `zenkar_db` | Mapped to host:5435 |
| **Production** | `zenkar-db` | `5432` | `postgres` | `zenkar_db` | Managed via Docker. |

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
-   **Action Required**:
    1.  Create `docker-compose.demo.yml` exposing Frontend on `3001`.
    2.  Add Nginx block for `orderdemo.zenkar.in` -> `3001`.

## 5. SSL / Certbot
Managed via LetsEncrypt.
-   **Cert Path**: `/etc/letsencrypt/live/order.zenkar.in/`
-   **Auto-Renew**: Configured via cron/systemd.

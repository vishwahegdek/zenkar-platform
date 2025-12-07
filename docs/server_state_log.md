# Server State Log

**Timestamp**: 2025-12-07 09:50:00 (Approx)
**Host**: `160.250.204.219`

## 1. Container Status (`docker ps -a`)

| Container ID | Name | Image | Status | Ports |
| :--- | :--- | :--- | :--- | :--- |
| `70ef76697042` | **zenkar-frontend** | `vishwa-frontend` | **Up 12 hours** | `0.0.0.0:3000->80/tcp` |
| `86a420f06fdd` | **zenkar-backend** | `vishwa-backend` | **Up 12 hours** | `3000/tcp` |
| `210db4df4527` | **zenkar-db** | `postgres:15-alpine` | **Up 12 hours** | `0.0.0.0:5432->5432/tcp` |
| `d25471d1c8ce` | **odoo_zenkar** | `odoo:18` | **Up 8 days** | `8069->8069` |
| `6475dbc452b2` | **odoo_db** | `postgres:13` | **Up 8 days** | `5432/tcp` |

## 2. Infrastructure Health
*(System metrics pending retry...)*

## 3. Deployment Summary
-   **App Version**: Latest (deployed ~12 hours ago).
-   **Database**: Stable (Up 12 hours).
-   **Legacy Systems**: Odoo is still running and accessible on port 8069.

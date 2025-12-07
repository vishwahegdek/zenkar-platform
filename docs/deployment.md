# Zenkar Platform: Deployment & Data Migration Guide

This guide details how to deploy the refactored Zenkar Platform (NestJS + React) to your production server while preserving your existing data.

## 1. Prerequisites
- [x] Legacy code archived to `_archive/`.
- [x] New `Dockerfile`s created for Backend and Frontend.
- [x] `docker-compose.yml` updated for new services.

## 2. Server Deployment Steps

Since you have already pulled the code to your server, follow these steps:

### Step 1: Stop the Old Application
Stop the running containers to release the database lock.
```bash
docker-compose down
```

### Step 2: Verify Data Location
Ensure your database data is structured as expected. The new configuration expects the PostgreSQL data to be in the `pgdata/` folder in the project root.
```bash
ls -d pgdata
# Should output: pgdata
```
> **Note**: If your old data lives elsewhere (e.g., a named volume), update `docker-compose.yml` to point to that location.

### Step 3: Build and Start the New Application
Rebuild the containers using the new Dockerfiles.
```bash
docker-compose up --build -d
```

### Step 4: Verify Deployment
Check the logs to ensure everything started correctly.
```bash
docker-compose logs -f
```
- **Backend**: Look for `Nest application successfully started`.
- **Frontend**: Look for Nginx startup logs.

## 3. Data Migration (Automatic)
The new application uses the **same database schema** and **same volume mapping** (`./pgdata`) as the legacy application.
**No manual data migration is required.**
When the new Backend starts, it will connect to the existing Postgres database and see all your old Customers, Products, and Orders immediately.

## 4. Troubleshooting
If you see connection errors:
1.  **Check Database URL**: Ensure `DATABASE_URL` in `docker-compose.yml` matches the credentials used by your existing Postgres instance (default: `postgres:postgres@db:5432/order_book`).
2.  **Permissions**: If `pgdata` permissions are wrong, run `sudo chown -R 70:70 pgdata/` (Postgres default user/group).

# Zenkar Platform: Deployment & Data Migration Guide

This guide details how to deploy the Zenkar Platform using the automated Push Pipeline.

## 1. Prerequisites
- [x] Local environment set up with `cicd.sh`, `remote_scp.py`, and `remote_exec.py`.
- [x] SSH access enabled to `server` (160.250.204.219).
- [x] Docker configured on the remote server.

## 2. Deployment Workflow (Manual Pull)

We verify deployments by building directly on the server.

### Staging (Demo)
1.  **Code**: Push to `deploy/staging-products`.
2.  **Server**: SSH and `cd ~/zenkar-staging`.
3.  **Command**: `git pull && docker-compose -f deploy/staging/docker-compose.yml up -d --build`.
   
### Production (Live)
1.  **Code**: Push to `deploy/staging-products`.
2.  **Server**: SSH and `cd ~/zenkar-platform-production`.
3.  **Command**: `git pull && docker-compose -f deploy/production/docker-compose.yml up -d --build`.

**Note**: Always check `deploy/DEPLOYMENT_REFERENCE.md` for the latest port configurations.

## 3. Data Migration
The system maps:
-   **Production**: `~/zenkar-platform-production/pgdata` (Legacy Data).
-   **Staging**: `~/zenkar-staging/pgdata_demo`.

Database schema changes should be handled via Prisma Migrations:
```bash
docker-compose exec backend npx prisma migrate deploy
```

## 4. Troubleshooting
-   **"Port Already Allocated"**: Check `docker ps`. You may have an old container running.
    -   Run `docker rm -f <container_name>` to clear it.
-   **"Database Does Not Exist"**: Ensure you are pointing to the correct DB name relative to the volume (`order_book` vs `zenkar_db_demo`).

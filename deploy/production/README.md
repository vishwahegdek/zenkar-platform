# Safe Production Deployment

> [!CAUTION]
> **NEVER** run `prisma migrate dev` in production. It attempts to reset the database if schema changes are destructive or drift is detected.

## Steps

1.  **Backup Database** (Optional but Recommended)
    ```bash
    # Example backup command (adjust container name if needed)
    docker exec zenkar-db-prod pg_dump -U postgres order_book > backup_$(date +%F_%H-%M).sql
    ```

2.  **Pull Latest Changes**
    ```bash
    git pull origin main
    ```

3.  **Install Dependencies**
    ```bash
    cd backend
    npm install
    # OR if using docker, rebuild
    ```

4.  **Run Migrations Safely**
    Use the `migrate:prod` script which runs `prisma migrate deploy`. This command applies pending migrations *without* resetting the database.
    ```bash
    # Inside backend directory
    npm run migrate:prod
    ```
    *Alternatively, via Docker:*
    ```bash
    docker exec zenkar-backend-prod npm run migrate:prod
    ```

5.  **Restart Services**
    ```bash
    cd ../deploy/production
    docker-compose down
    docker-compose up -d --build
    ```

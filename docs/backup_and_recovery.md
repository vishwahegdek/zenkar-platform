# Backup & Disaster Recovery Guide

## 1. Automated Backups
The system is designed to secure data in two ways:

### A. Deployment Backups
Every time you run `./deploy.sh`, a backup involves:
1.  Running `scripts/backup.sh`.
2.  Saving a snapshot to `zenkar-platform/backups/`.
3.  **Aborting** deployment if the backup fails.

### B. Periodic Backups (Cron Job)
To enable daily backups (e.g., at 3 AM), add this to your server's crontab (`crontab -e`):

```bash
# Backup Daily at 3 AM
0 3 * * * /path/to/zenkar-platform/scripts/backup.sh >> /var/log/zenkar_backup.log 2>&1
```

## 2. Restoring Data
If the database fails or gets corrupted, follow these steps to restore from a backup file.

### Step 1: Locate Backup
Find the latest healthy backup in `zenkar-platform/backups/`.
```bash
ls -l zenkar-platform/backups/
# Example: backup_2025-12-07_093000.sql.gz
```

### Step 2: Stop Application (Optional but Recommended)
```bash
sudo docker stop zenkar-backend
```

### Step 3: Execute Restore
Pipe the unzipped SQL directly into the database container.
```bash
# Syntax
zcat zenkar-platform/backups/YOUR_BACKUP_FILE.sql.gz | sudo docker exec -i zenkar-db psql -U postgres -d zenkar_db

# Example
zcat zenkar-platform/backups/backup_2025-12-07_093000.sql.gz | sudo docker exec -i zenkar-db psql -U postgres -d zenkar_db
```

### Step 4: Verify & Restart
```bash
sudo docker start zenkar-backend
```

## 3. Off-Site Backups
To download backups to your local machine for extra safety, use the provided script or SCP.

```bash
# Run from your LOCAL machine
scp -r user@server_ip:/path/to/zenkar-platform/backups/ ./local_backups/
```

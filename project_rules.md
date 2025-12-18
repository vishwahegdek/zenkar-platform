# Project Rules & Preferences

1. We develop android first web app, tested for android chrome and desktop chrome.
2. We keep the details of new additions of features in the CHANGELOG.md, bug fixes , testing changes, safety rules are not to be included in the CHANGELOG.md.
2. **DATABASE SAFETY**: NEVER use `prisma migrate dev` in production as it may reset the database. ALWAYS use `npm run migrate:prod` (or `npx prisma migrate deploy`) to safely apply migrations.
3. Frontend port for dev environment is 5173, backend port is 3000 and db port is 5432
4. **TIMEZONE & DATES**: The Timezone is strictly **IST** (Indian Standard Time). The date format must be **dd/mm/yyyy** everywhere.
4. **TIMEZONE & DATES**: The Timezone is strictly **IST** (Indian Standard Time). The date format must be **dd/mm/yyyy** everywhere.
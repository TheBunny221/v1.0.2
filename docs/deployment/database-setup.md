# PostgreSQL Database Setup

This project has been migrated from MongoDB to PostgreSQL. Follow these steps to set up the database:

## Prerequisites

1. **Install PostgreSQL**: Make sure PostgreSQL is installed and running on your system

   - Windows: Download from https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql` or download from the official site
   - Ubuntu: `sudo apt-get install postgresql postgresql-contrib`

2. **Start PostgreSQL service**:
   - Windows: Service should start automatically
   - macOS: `brew services start postgresql`
   - Ubuntu: `sudo systemctl start postgresql`

## Database Setup

1. **Create a database**:

   ```bash
   # Connect to PostgreSQL as superuser
   sudo -u postgres psql

   # Create database and user
   CREATE DATABASE citizenconnect;
   CREATE USER username WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE citizenconnect TO username;
   \q
   ```

2. **Update environment variables**:
   Update the `DATABASE_URL` in your `.env` file:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/citizenconnect"
   ```

   Replace `username` and `password` with your actual PostgreSQL credentials.

3. **Run database migrations**:

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database (for development)
   npm run db:push

   # OR create and run a migration (for production)
   npm run db:migrate
   ```

## Available Database Commands

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database (development)
- `npm run db:migrate` - Create and run migrations (production)
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:reset` - Reset database and apply all migrations

## Migration from MongoDB

The schema has been converted from MongoDB to PostgreSQL with the following changes:

### User Model Changes:

- `_id` → `id` (cuid instead of ObjectId)
- `preferences` object → separate fields (`language`, `notificationsEnabled`, `emailAlerts`)
- Enum values use snake_case (`ward_officer` instead of `ward-officer`)

### Complaint Model Changes:

- `_id` → `id` (cuid instead of ObjectId)
- `contactInfo` object → separate fields (`contactMobile`, `contactEmail`)
- `location` object → separate fields (`ward`, `area`, `address`, `latitude`, `longitude`, `landmark`)
- `feedback` object → separate fields (`feedbackRating`, `feedbackComment`, `feedbackSubmittedAt`)
- Related data moved to separate tables (`files`, `remarks`)

### New Models:

- **File**: Stores complaint attachments
- **Remark**: Stores complaint comments/updates
- **Notification**: Stores user notifications

## Data Migration

If you have existing MongoDB data, you'll need to create a migration script to transfer the data to PostgreSQL. The structure has changed significantly, so manual mapping will be required.

## Troubleshooting

1. **Connection refused error**: Make sure PostgreSQL is running
2. **Authentication failed**: Check your DATABASE_URL credentials
3. **Database does not exist**: Create the database first using the SQL commands above
4. **Permission denied**: Make sure your user has proper privileges on the database

## Development with Docker (Optional)

You can also run PostgreSQL in Docker:

```bash
docker run --name postgres-citizenconnect \
  -e POSTGRES_DB=citizenconnect \
  -e POSTGRES_USER=username \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

Then update your DATABASE_URL to:

```
DATABASE_URL="postgresql://username:password@localhost:5432/citizenconnect"
```

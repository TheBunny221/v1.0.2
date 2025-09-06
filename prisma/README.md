# Prisma Dual Database Setup

This project now supports both SQLite (development) and PostgreSQL (production) databases with dedicated schema files and seeding scripts.

## Schema Files

- **`schema.dev.prisma`**: SQLite configuration for development environment
- **`schema.prod.prisma`**: PostgreSQL configuration for production environment

## Environment Configuration

### Development (SQLite)

```bash
DATABASE_URL="file:./dev.db"
```

### Production (PostgreSQL)

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

## Available Commands

### Development Environment (SQLite)

```bash
# Generate Prisma client
npm run db:generate:dev

# Run migrations
npm run dev:db
# or
npm run db:migrate

# Reset and migrate database
npm run db:migrate:reset:dev

# Seed database
npm run seed:dev

# Complete setup (generate + migrate + seed)
npm run db:setup:dev

# Fresh setup (reset + migrate + seed)
npm run db:setup:fresh:dev

# Open Prisma Studio
npm run db:studio:dev
```

### Production Environment (PostgreSQL)

```bash
# Generate Prisma client
npm run db:generate:prod

# Deploy migrations
npm run prod:db
# or
npm run db:migrate:deploy:prod

# Seed database
npm run seed:production

# Complete setup (generate + deploy + seed)
npm run db:setup:prod 

# Migrate and seed in one command
npm run migrate-and-seed

# Open Prisma Studio
npm run db:studio:prod
```

### Utility Commands

```bash
# Validate schema files
npm run db:validate:dev
npm run db:validate:prod

# Format schema files
npm run db:format:dev
npm run db:format:prod

# Check migration status
npm run db:migrate:status:dev
npm run db:migrate:status:prod
```

## Seed Files

- **`seed.dev.ts`**: Development seeding with sample data and `.dev` email domains
- **`seed.prod.ts`**: Production seeding with minimal essential data and safety checks

## Key Differences

### SQLite (Development)

- Uses string fields instead of enums for better compatibility
- No indexes on foreign keys (handled by Prisma)
- Simpler setup for local development
- Contains sample data for testing

### PostgreSQL (Production)

- Uses proper enums for better type safety
- Includes database indexes for performance
- Production-ready constraints and relationships
- Minimal seeding with safety checks

## Migration Workflow

### Development

1. Make schema changes in `schema.dev.prisma`
2. Run `npm run db:migrate` to create and apply migration
3. Test changes locally

### Production

1. Update `schema.prod.prisma` with the same changes
2. Test migration in staging environment
3. Deploy to production using `npm run prod:db`

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Development
DATABASE_URL="file:./dev.db"

# Production
# DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
# ADMIN_PASSWORD="YourSecureAdminPassword"
```

## Best Practices

1. **Always test migrations in development first**
2. **Backup production database before major migrations**
3. **Use environment-specific seed files appropriately**
4. **Keep schema files in sync between dev and prod**
5. **Use the safety checks in production seeding**

## Troubleshooting

### SQLite Issues

- Delete `dev.db` file to start fresh
- Run `npm run db:setup:fresh:dev`

### PostgreSQL Issues

- Check connection string format
- Ensure database exists before running migrations
- Verify user permissions

### Schema Sync Issues

- Use `npm run db:validate:dev` and `npm run db:validate:prod`
- Compare schema files manually
- Run `npm run db:format:dev` and `npm run db:format:prod`

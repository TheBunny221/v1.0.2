import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
  errorFormat: 'pretty',
});

const connectDB = async () => {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('PostgreSQL Connected successfully');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await prisma.$disconnect();
      console.log('PostgreSQL connection closed due to app termination');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await prisma.$disconnect();
      console.log('PostgreSQL connection closed due to app termination');
      process.exit(0);
    });

    return prisma;

  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    console.error('Make sure PostgreSQL is running and DATABASE_URL is correct');
    // Don't exit in development to allow for database setup
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Get the Prisma client instance
const getPrisma = () => {
  return prisma;
};

export { connectDB, getPrisma };
export default connectDB;

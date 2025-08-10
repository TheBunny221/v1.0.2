import { PrismaClient } from '@prisma/client';

let prisma;

const connectDB = async () => {
  try {
    // Create Prisma client instance
    prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });

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
    process.exit(1);
  }
};

// Get the Prisma client instance
const getPrisma = () => {
  if (!prisma) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return prisma;
};

export { connectDB, getPrisma };
export default connectDB;

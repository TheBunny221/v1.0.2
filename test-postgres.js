import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connection successful');
    
    // Test if we can run a simple query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database query successful');
    
    await prisma.$disconnect();
    console.log('✅ PostgreSQL setup complete');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    console.log('\n📋 Please follow these steps:');
    console.log('1. Install PostgreSQL and start the service');
    console.log('2. Create a database named "citizenconnect"');
    console.log('3. Update DATABASE_URL in .env file');
    console.log('4. Run: npm run db:push');
    process.exit(1);
  }
}

testConnection();

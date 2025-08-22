import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Function to load environment-specific configuration
export function loadEnvironmentConfig() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  console.log(`🔧 Loading ${NODE_ENV} environment configuration...`);

  // Load base .env file first
  const baseEnvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(baseEnvPath)) {
    dotenv.config({ path: baseEnvPath });
    console.log(`✅ Base environment loaded from: ${baseEnvPath}`);
  }

  // Load environment-specific .env file
  const envPath = path.resolve(process.cwd(), `.env.${NODE_ENV}`);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    console.log(`✅ Environment-specific config loaded from: ${envPath}`);
  } else {
    console.log(`⚠️ No environment-specific config found at: ${envPath}`);
  }

  // Validate required environment variables
  validateEnvironmentVariables();

  return {
    NODE_ENV,
    isDevelopment: NODE_ENV === 'development',
    isProduction: NODE_ENV === 'production',
    isTest: NODE_ENV === 'test'
  };
}

// Function to validate required environment variables
function validateEnvironmentVariables() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => {
      console.error(`   • ${key}`);
      
      // Provide specific guidance
      if (key === 'DATABASE_URL') {
        if (process.env.NODE_ENV === 'development') {
          console.error('     For development: DATABASE_URL="file:./dev.db"');
        } else {
          console.error('     For production: DATABASE_URL="postgresql://user:pass@host:port/db"');
        }
      } else if (key === 'JWT_SECRET') {
        console.error('     Example: JWT_SECRET="your-secure-secret-key"');
      }
    });

    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Exiting due to missing environment variables in production');
      process.exit(1);
    } else {
      console.warn('⚠️ Some environment variables are missing - this may cause issues');
    }
  } else {
    console.log('✅ All required environment variables are set');
  }
}

// Function to get database connection module based on environment
export async function getDatabaseConnection() {
  const { isDevelopment } = loadEnvironmentConfig();

  if (isDevelopment) {
    console.log('📊 Using SQLite database for development');
    const { connectDB } = await import('../db/connection.dev.js');
    return connectDB;
  } else {
    console.log('📊 Using PostgreSQL database for production');
    const { connectDB } = await import('../db/connection.js');
    return connectDB;
  }
}

// Function to get Prisma client based on environment
export async function getPrismaClient() {
  const { isDevelopment } = loadEnvironmentConfig();

  if (isDevelopment) {
    const { getPrisma } = await import('../db/connection.dev.js');
    return getPrisma();
  } else {
    const { getPrisma } = await import('../db/connection.js');
    return getPrisma();
  }
}

// Export environment info
export const env = loadEnvironmentConfig();

import pkg from "@prisma/client";
const { PrismaClient } = pkg;

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
  errorFormat: "pretty",
});

const connectDB = async () => {
  try {
    // Connect to database
    await prisma.$connect();

    const dbType = process.env.DATABASE_URL?.includes("postgresql")
      ? "PostgreSQL"
      : "SQLite";
    console.log(`${dbType} Connected successfully`);
    console.log(
      `Database URL: ${process.env.DATABASE_URL?.replace(/\/\/.*@/, "//***:***@")}`,
    );

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      await prisma.$disconnect();
      console.log(`${dbType} connection closed due to app termination`);
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await prisma.$disconnect();
      console.log(`${dbType} connection closed due to app termination`);
      process.exit(0);
    });

    return prisma;
  } catch (error) {
    console.error("Error connecting to database:", error);
    console.error(
      "Make sure database is accessible and DATABASE_URL is correct",
    );
    // Don't exit in development to allow for database setup
    if (process.env.NODE_ENV === "production") {
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

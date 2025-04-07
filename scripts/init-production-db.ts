/**
 * Production Database Initialization Script
 * 
 * This script initializes the production database with sample data.
 * Usage: npx ts-node scripts/init-production-db.ts
 */

const { PrismaClient } = require("@prisma/client");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

// Production database URL
const PRODUCTION_DB_URL = "postgresql://postgres:MXuayHEjJacgYvUleSzoQlHSBNEwLEzk@mainline.proxy.rlwy.net:27473/edge";

// Create a Prisma client with the production URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: PRODUCTION_DB_URL,
    },
  },
});

async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Successfully connected to production database");
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to production database:", error);
    return false;
  }
}

async function runMigrations() {
  try {
    console.log("Running database migrations...");
    
    // Set environment variable for Prisma migrate
    process.env.DATABASE_URL = PRODUCTION_DB_URL;
    
    // Run Prisma migration
    const { stdout, stderr } = await execAsync("npx prisma migrate deploy");
    
    if (stderr) {
      console.error("Migration stderr:", stderr);
    }
    
    console.log("Migration output:", stdout);
    console.log("✅ Database migrations completed");
    
    return true;
  } catch (error) {
    console.error("❌ Failed to run migrations:", error);
    return false;
  }
}

async function seedDatabase() {
  try {
    console.log("Seeding database with initial data...");
    
    // Set environment variable for seed script
    process.env.DATABASE_URL = PRODUCTION_DB_URL;
    
    // Run the seed script
    const { stdout, stderr } = await execAsync("npx ts-node --project prisma/tsconfig.json prisma/seed.ts");
    
    if (stderr && !stderr.includes("ExperimentalWarning")) {
      console.error("Seed stderr:", stderr);
    }
    
    console.log("Seed output:", stdout);
    console.log("✅ Database seeding completed");
    
    return true;
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    return false;
  }
}

async function main() {
  console.log("=== PRODUCTION DATABASE INITIALIZATION ===");
  console.log("Database URL:", PRODUCTION_DB_URL);
  
  try {
    // Step 1: Check database connection
    const connected = await checkDatabaseConnection();
    if (!connected) {
      console.error("Cannot proceed with initialization due to connection issues");
      process.exit(1);
    }
    
    // Step 2: Run migrations
    const migrationsSuccessful = await runMigrations();
    if (!migrationsSuccessful) {
      console.error("Cannot proceed with seeding due to migration issues");
      process.exit(1);
    }
    
    // Step 3: Seed the database
    const seedingSuccessful = await seedDatabase();
    if (!seedingSuccessful) {
      console.error("Database seeding encountered issues");
      process.exit(1);
    }
    
    console.log("=== PRODUCTION DATABASE INITIALIZATION COMPLETED SUCCESSFULLY ===");
  } catch (error) {
    console.error("Unexpected error during database initialization:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 
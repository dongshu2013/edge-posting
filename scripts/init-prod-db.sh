#!/bin/bash

# Production database URL
export DATABASE_URL="postgresql://postgres:MXuayHEjJacgYvUleSzoQlHSBNEwLEzk@mainline.proxy.rlwy.net:27473/edge"

echo "=== PRODUCTION DATABASE INITIALIZATION ==="
echo "Database URL: $DATABASE_URL"

# Step 1: Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "❌ Failed to run migrations. Exiting."
  exit 1
fi

echo "✅ Database migrations completed"

# Step 2: Seed the database
echo "Seeding database with initial data..."
npx ts-node --project prisma/tsconfig.json prisma/seed.ts

if [ $? -ne 0 ]; then
  echo "❌ Failed to seed database. Exiting."
  exit 1
fi

echo "✅ Database seeding completed"
echo "=== PRODUCTION DATABASE INITIALIZATION COMPLETED SUCCESSFULLY ===" 
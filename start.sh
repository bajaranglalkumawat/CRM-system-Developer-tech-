#!/bin/sh
# Startup script for Render / production deployment
# Runs migrations and seeds admin user before starting the app

set -e

echo "=== Running database setup ==="
echo "DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo 'YES' || echo 'NO')"

# Push schema to database (creates/updates tables)
echo "Pushing schema to database..."
npx prisma db push --accept-data-loss
echo "Schema pushed successfully."

# Seed admin user and service categories
echo "Seeding database..."
echo "ADMIN_EMAIL=$ADMIN_EMAIL"
npx tsx prisma/seed.ts
echo "Seed completed successfully."

echo "=== Database setup complete ==="

# Use Render's PORT env variable (default 3000 for local)
export PORT=${PORT:-3000}
export HOSTNAME="0.0.0.0"

# Copy static files for standalone (if not already done)
if [ -d ".next/standalone" ] && [ -d ".next/static" ]; then
  cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
  cp -r public .next/standalone/public 2>/dev/null || true
  echo "Starting standalone server on port $PORT..."
  exec node .next/standalone/server.js
else
  echo "Starting Next.js server on port $PORT..."
  exec npx next start -p $PORT
fi

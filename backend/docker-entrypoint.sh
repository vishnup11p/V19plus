#!/bin/sh
set -e
echo "Running database migrations..."
npx prisma migrate deploy
echo "Starting V19+ backend..."
exec npm run dev

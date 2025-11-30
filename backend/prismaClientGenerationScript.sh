#!/bin/bash

# Prisma Client Generation Script
# This script generates the Prisma Client after schema changes

echo "Generating Prisma Client..."
npx prisma generate

echo "Prisma Client generated successfully!"
echo "Next steps:"
echo "1. Run migrations: npx prisma migrate dev"
echo "2. (Optional) Open Prisma Studio: npx prisma studio"


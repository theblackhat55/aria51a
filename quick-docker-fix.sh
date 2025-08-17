#!/bin/bash
# Quick fix for current Docker permission issues

echo "🛑 Stopping current containers..."
docker-compose down

echo "🧹 Cleaning up problematic containers..."
docker system prune -f

echo "🔧 Creating directories with correct permissions..."
mkdir -p ./database ./logs ./uploads ./backups
sudo chown -R 1001:1001 ./database ./logs ./uploads ./backups
sudo chmod -R 755 ./database ./logs ./uploads ./backups

echo "🔨 Rebuilding Docker image with fixes..."
docker-compose build --no-cache

echo "🚀 Starting with fixed configuration..."
docker-compose up -d

echo "⏳ Waiting for startup..."
sleep 10

echo "📋 Checking container status..."
docker-compose ps

echo "📝 Checking logs..."
docker-compose logs --tail=20

echo ""
echo "✅ Quick fix complete!"
echo "🔍 To check if it's working: docker-compose logs -f"
echo "🌐 Application should be available at: http://localhost:3000"
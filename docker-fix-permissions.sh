#!/bin/bash
# Quick Docker Permission Fix Script
# Run this before starting docker-compose to fix permission issues

set -e

echo "🔧 Fixing Docker directory permissions..."

# Create local directories with proper permissions
sudo mkdir -p ./database ./logs ./uploads ./backups
sudo chown -R 1001:1001 ./database ./logs ./uploads ./backups
sudo chmod -R 755 ./database ./logs ./uploads ./backups

echo "✅ Directory permissions fixed!"
echo "📂 Database directory: $(ls -la ./database)"
echo "📂 Logs directory: $(ls -la ./logs)"

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker compose down 2>/dev/null || true

echo "🚀 Ready to start with: docker compose up -d"
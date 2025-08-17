# DMT Risk Assessment Platform - Ubuntu Docker Deployment Guide

## 🐧 Ubuntu + Docker Local Deployment

This guide provides complete instructions for running the DMT Risk Assessment Platform locally on Ubuntu using Docker.

## 📋 Prerequisites

### System Requirements
- **Ubuntu 20.04 LTS or higher**
- **4GB RAM minimum** (8GB recommended)
- **10GB free disk space**
- **Docker and Docker Compose**

### Required Software Installation

#### 1. Update Ubuntu System
```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. Install Docker
```bash
# Remove old Docker versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Add your user to Docker group
sudo usermod -aG docker $USER

# Log out and log back in for group changes to take effect
# Or run: newgrp docker
```

#### 3. Install Docker Compose
```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### 4. Install Git (if not already installed)
```bash
sudo apt install -y git curl wget
```

## 🚀 Quick Start Deployment

### Method 1: Using Docker Compose (Recommended)

#### 1. Clone the Repository
```bash
git clone https://github.com/theblackhat55/GRC.git
cd GRC
```

#### 2. Create Required Directories
```bash
mkdir -p database logs uploads ssl
chmod 755 database logs uploads
```

#### 3. Set Environment Variables (Optional)
```bash
# Create .env file for custom configuration
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_PATH=/app/database/dmt.sqlite
JWT_SECRET=$(openssl rand -hex 32)
API_RATE_LIMIT=100
SESSION_TIMEOUT=86400
EOF
```

#### 4. Build and Start Services
```bash
# Start the application
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f dmt-risk-app
```

#### 5. Access the Application
- **Main Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Login Page**: http://localhost:3000/login

### Method 2: Using Docker Only

#### 1. Build Docker Image
```bash
# Clone repository
git clone https://github.com/theblackhat55/GRC.git
cd GRC

# Build image
docker build -t dmt-risk-assessment .
```

#### 2. Run Container
```bash
# Create directories for data persistence
mkdir -p $(pwd)/database $(pwd)/logs $(pwd)/uploads

# Run container with volume mounts
docker run -d \
  --name dmt-risk-app \
  -p 3000:3000 \
  -v $(pwd)/database:/app/database \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/uploads:/app/uploads \
  -e NODE_ENV=production \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  --restart unless-stopped \
  dmt-risk-assessment

# Check container status
docker ps

# View logs
docker logs -f dmt-risk-app
```

## 👤 Default Login Credentials

After deployment, use these credentials to login:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `demo123` | System Administrator |
| `avi_security` | `demo123` | Risk Manager |
| `sjohnson` | `demo123` | Risk Manager |
| `mchen` | `demo123` | Compliance Officer |
| `edavis` | `demo123` | Auditor |

## 🔧 Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | production | Application environment |
| `PORT` | 3000 | Application port |
| `DATABASE_PATH` | /app/database/dmt.sqlite | SQLite database path |
| `JWT_SECRET` | auto-generated | JWT signing secret |
| `API_RATE_LIMIT` | 100 | API requests per minute |
| `SESSION_TIMEOUT` | 86400 | Session timeout in seconds |

### Volume Mounts

| Container Path | Host Path | Purpose |
|----------------|-----------|---------|
| `/app/database` | `./database` | SQLite database storage |
| `/app/logs` | `./logs` | Application logs |
| `/app/uploads` | `./uploads` | File uploads |

## 🔍 Verification Steps

### 1. Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-17T...",
  "version": "2.0.1",
  "database": "connected"
}
```

### 2. Test Login API
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "demo123"}'
```

### 3. Database Check
```bash
# Connect to running container
docker exec -it dmt-risk-app sh

# Check database
sqlite3 /app/database/dmt.sqlite "SELECT username, role FROM users;"
```

## 📊 Managing the Application

### Common Docker Commands

```bash
# View running containers
docker ps

# Stop application
docker-compose down

# Start application
docker-compose up -d

# Restart application
docker-compose restart

# View logs
docker-compose logs -f

# Update application
git pull
docker-compose build
docker-compose up -d

# Backup database
docker cp dmt-risk-app:/app/database/dmt.sqlite ./backup-$(date +%Y%m%d).sqlite

# Restore database
docker cp ./backup-database.sqlite dmt-risk-app:/app/database/dmt.sqlite
docker-compose restart
```

### Application Management

```bash
# Check application status
curl http://localhost:3000/health

# View application logs
docker logs -f dmt-risk-app

# Access container shell
docker exec -it dmt-risk-app sh

# Monitor resource usage
docker stats dmt-risk-app
```

## 🔒 Production Deployment

### 1. Enable HTTPS with Nginx

```bash
# Generate SSL certificates (Let's Encrypt recommended)
sudo apt install certbot

# Generate certificates for your domain
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to ssl directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
sudo chown $USER:$USER ./ssl/*.pem

# Start with Nginx
docker-compose --profile production up -d
```

### 2. Security Hardening

```bash
# Change default JWT secret
echo "JWT_SECRET=$(openssl rand -hex 64)" >> .env

# Set secure permissions
chmod 600 .env
chmod 600 ssl/*.pem

# Configure firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 3. Backup Strategy

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"
mkdir -p "$BACKUP_DIR"

# Backup database
docker cp dmt-risk-app:/app/database "$BACKUP_DIR/"

# Backup logs
docker cp dmt-risk-app:/app/logs "$BACKUP_DIR/"

# Create archive
tar -czf "backup_$DATE.tar.gz" -C "./backups" "$DATE"

echo "Backup created: backup_$DATE.tar.gz"
EOF

chmod +x backup.sh

# Run backup
./backup.sh
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>

# Or use different port
docker-compose down
sed -i 's/3000:3000/3001:3000/' docker-compose.yml
docker-compose up -d
```

#### 2. Permission Denied Errors
```bash
# Fix permissions
sudo chown -R $USER:$USER ./database ./logs ./uploads
chmod 755 ./database ./logs ./uploads
```

#### 3. Database Connection Issues
```bash
# Check database file
ls -la ./database/

# Reset database
rm -f ./database/dmt.sqlite
docker-compose restart
```

#### 4. Container Won't Start
```bash
# Check logs
docker logs dmt-risk-app

# Debug container
docker run -it --rm dmt-risk-assessment sh
```

### Log Analysis

```bash
# Application logs
docker logs dmt-risk-app | tail -100

# System logs
journalctl -u docker.service | tail -50

# Resource usage
docker stats --no-stream
```

## 📈 Performance Optimization

### 1. Resource Limits
Add to docker-compose.yml:
```yaml
services:
  dmt-risk-app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 2. Database Optimization
```bash
# Inside container
sqlite3 /app/database/dmt.sqlite "VACUUM;"
sqlite3 /app/database/dmt.sqlite "ANALYZE;"
```

## 🔄 Updates and Maintenance

### 1. Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d

# Verify update
curl http://localhost:3000/health
```

### 2. Scheduled Maintenance
```bash
# Add to crontab for automatic backups
crontab -e

# Add line for daily backup at 2 AM
0 2 * * * /path/to/GRC/backup.sh

# Add line for weekly system cleanup
0 3 * * 0 docker system prune -f
```

## 📞 Support

- **GitHub Issues**: https://github.com/theblackhat55/GRC/issues
- **Documentation**: Check README.md for additional information
- **Logs**: Always check `docker logs dmt-risk-app` for troubleshooting

## 🎉 Next Steps

1. **Login** to the application at http://localhost:3000
2. **Change default passwords** in the user management section
3. **Configure your organization** structure
4. **Import your risk data** or start creating new risks
5. **Set up regular backups** using the provided scripts

Your DMT Risk Assessment Platform is now ready for use! 🚀
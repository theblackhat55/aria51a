# GRC Tier 3.1 - Enterprise Risk Management Platform

## 🚀 Kong Gateway + Keycloak + Risk Management Platform

A comprehensive, enterprise-grade risk management platform built with modern technologies and production-ready infrastructure.

### 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │────│  Kong Gateway   │────│ Risk Management │
│  Load Balancer  │    │  API Management │    │   Application   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │    Keycloak     │    │   PostgreSQL    │
         │              │      IAM        │    │    Database     │
         └──────────────┴─────────────────┘    └─────────────────┘
                                 │                       │
                        ┌─────────────────┐    ┌─────────────────┐
                        │     Redis       │    │   Monitoring    │
                        │     Cache       │    │ Prom + Grafana  │
                        └─────────────────┘    └─────────────────┘
```

### ✨ Features

#### 🔐 Enterprise Security
- **Kong Gateway**: API management, rate limiting, CORS, JWT validation
- **Keycloak**: Identity and Access Management with OIDC/SAML support
- **Multi-layer Authentication**: JWT + OAuth2 + RBAC
- **Security Headers**: Automatic security header injection
- **SSL/TLS**: Production-ready certificate management

#### 📊 Risk Management
- **AI-Powered Risk Assessment**: Automated likelihood and impact analysis
- **Service-Risk Mapping**: Link risks to services (not assets)
- **Real-time Risk Scoring**: Dynamic calculation with visual indicators
- **Enhanced Threat Sources**: Comprehensive threat categorization
- **Optional Risk Categories**: Flexible risk classification

#### 🛠️ Production Ready
- **Docker Compose**: Complete stack deployment
- **Health Checks**: Comprehensive service monitoring
- **Logging**: Centralized logging with structured format
- **Monitoring**: Prometheus + Grafana dashboards
- **Backup**: Automated database and configuration backups
- **Load Balancing**: Nginx with upstream health checks

#### 🔧 Development Experience
- **Hot Reload**: Development mode with automatic rebuilds
- **API Documentation**: Interactive API exploration
- **Debug Mode**: Comprehensive debugging tools
- **TypeScript**: Full type safety throughout the stack

### 🚀 Quick Start

#### Prerequisites
- Ubuntu 18.04+ (or compatible Linux)
- Docker 20.10+
- Docker Compose 1.29+
- 4GB+ RAM recommended
- 10GB+ disk space

#### One-Command Installation
```bash
# Clone the repository
git clone <repository-url>
cd webapp

# Run the automated installer
./install-grctier.sh
```

The installer will:
1. ✅ Check system requirements
2. ✅ Install Docker/Docker Compose (if needed)
3. ✅ Create SSL certificates
4. ✅ Pull all Docker images
5. ✅ Start all services
6. ✅ Configure Kong Gateway
7. ✅ Set up Keycloak realm
8. ✅ Test service health
9. ✅ Display access information

#### Manual Installation
```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Start all services
docker compose up -d

# 3. Wait for services to be healthy
docker compose ps

# 4. Configure Kong Gateway
./scripts/configure-kong.sh

# 5. Access the application
open http://localhost
```

### 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Main Application** | http://localhost | Full risk management platform |
| **Kong Gateway** | http://localhost:8000 | API gateway (direct access) |
| **Kong Admin** | http://localhost:8001 | Kong management API |
| **Kong Manager** | http://localhost:8002 | Kong web interface |
| **Keycloak** | http://localhost:8080 | Identity management |
| **Prometheus** | http://localhost:9090 | Metrics collection |
| **Grafana** | http://localhost:3001 | Monitoring dashboards |

### 🔑 Default Credentials

#### Risk Management Application
- **Admin**: `admin` / `admin_secure_password_2024`
- **Risk Manager**: `avi_security` / `demo123`

#### Keycloak Admin
- **Username**: `admin`
- **Password**: `admin_secure_password_2024`

#### Grafana
- **Username**: `admin`
- **Password**: `admin_secure_password_2024`

> ⚠️ **Security Warning**: Change all default passwords before production deployment!

### 🛠️ Management Commands

```bash
# Service Management
docker compose up -d              # Start all services
docker compose down               # Stop all services
docker compose restart            # Restart all services
docker compose ps                 # Check service status

# Logs and Debugging
docker compose logs -f            # Follow all logs
docker compose logs -f kong       # Kong Gateway logs
docker compose logs -f keycloak   # Keycloak logs
docker compose logs -f risk-app   # Application logs

# Maintenance
docker compose pull               # Update images
docker system prune -f            # Clean up Docker
./scripts/backup.sh               # Create backup
./scripts/restore.sh backup.tar   # Restore from backup

# Kong Management
curl http://localhost:8001/status          # Kong status
curl http://localhost:8001/services        # List services
curl http://localhost:8001/routes          # List routes
curl http://localhost:8001/plugins         # List plugins

# Database Access
docker compose exec postgres psql -U grctier -d riskmanagement
```

### 📈 Monitoring

#### Prometheus Metrics
- Kong Gateway performance
- Application response times
- Database connections
- System resources

#### Grafana Dashboards
- API Gateway metrics
- Risk management KPIs
- System health overview
- Security monitoring

#### Health Endpoints
- Application: `http://localhost/api/health`
- Kong: `http://localhost:8001/status`
- Keycloak: `http://localhost:8080/health`

### 🔧 Configuration

#### Environment Variables
Copy `.env.example` to `.env` and customize:
- Database credentials
- JWT secrets
- Keycloak configuration
- Kong settings
- Monitoring URLs

#### Kong Gateway
Kong is configured via:
- `kong/kong.conf` - Main configuration
- `docker-compose.yml` - Environment variables
- API calls to Kong Admin API

#### Keycloak
Keycloak realm is configured via:
- `keycloak/realm-export.json` - Realm definition
- Automatic import on startup
- Web UI for additional configuration

### 🚢 Production Deployment

#### Security Checklist
- [ ] Change all default passwords
- [ ] Configure SSL certificates
- [ ] Set up firewall rules
- [ ] Enable audit logging
- [ ] Configure backup strategy
- [ ] Update CORS origins
- [ ] Set proper JWT secrets

#### Performance Tuning
```bash
# Kong Gateway
KONG_WORKER_PROCESSES=4
KONG_WORKER_CONNECTIONS=2048

# PostgreSQL
POSTGRES_SHARED_BUFFERS=256MB
POSTGRES_EFFECTIVE_CACHE_SIZE=1GB

# Redis
REDIS_MAXMEMORY=512mb
REDIS_MAXMEMORY_POLICY=allkeys-lru
```

#### High Availability
- Deploy multiple Kong instances
- Use PostgreSQL clustering
- Set up Redis cluster
- Configure load balancer health checks

### 🐛 Troubleshooting

#### Common Issues

**Services not starting**
```bash
docker compose logs postgres  # Check database logs
docker compose down && docker compose up -d
```

**Kong configuration issues**
```bash
curl http://localhost:8001/status
./scripts/configure-kong.sh  # Reconfigure Kong
```

**Authentication problems**
```bash
# Reset Keycloak
docker compose restart keycloak
# Check logs
docker compose logs keycloak
```

**Performance issues**
```bash
docker stats                  # Check resource usage
curl http://localhost:9090    # Check Prometheus
```

#### Support
- Check logs: `docker compose logs -f [service]`
- Verify configuration: `docker compose config`
- Test connectivity: `curl http://localhost/api/health`
- Monitor resources: `docker stats`

### 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

### 🙏 Acknowledgments

- **Kong Inc.** for the amazing API gateway
- **Keycloak/Red Hat** for enterprise IAM
- **Cloudflare** for Workers platform inspiration
- **Hono** for the lightweight web framework

---

**Built with ❤️ for enterprise security and risk management**
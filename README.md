# DMT Risk Assessment Platform v2.0.1

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-supported-blue.svg)](https://docker.com/)

## 🚀 Enterprise GRC Platform with AI-Powered Intelligence

DMT Risk Assessment Platform is a next-generation Enterprise Governance, Risk, and Compliance (GRC) platform featuring AI-powered risk intelligence, comprehensive framework support, and enterprise-grade Keycloak SSO authentication.

### ✨ Key Features

- **🔐 Enterprise SSO Authentication** - Keycloak-based authentication with role-based access control
- **🤖 AI-Powered Risk Intelligence** - Advanced risk analysis and insights
- **📊 Comprehensive GRC Framework Support** - ISO 27001, NIST, SOC 2, and custom frameworks
- **🏗️ Modern Architecture** - Built with Hono framework and TypeScript
- **🐳 Docker Support** - Easy deployment with Docker and Docker Compose
- **📈 Real-time Analytics** - Advanced reporting and dashboard capabilities
- **🔄 Audit Trail** - Complete audit logging and compliance tracking
- **🌐 Multi-tenant Support** - Enterprise-ready multi-organization support

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Contributing](#-contributing)
- [Support](#-support)

## 🚀 Quick Start

### Option 1: Automated Installation (Recommended)

Run the comprehensive install script that handles everything including Keycloak setup:

```bash
# Clone the repository
git clone https://github.com/theblackhat55/GRC.git
cd GRC

# Run the automated installer
sudo ./install.sh
```

This will install and configure:
- ✅ Docker and Docker Compose
- ✅ Node.js 20 LTS and PM2
- ✅ PostgreSQL 15
- ✅ Keycloak 25.0 with pre-configured realm
- ✅ DMT application with all dependencies
- ✅ Systemd services for automatic startup
- ✅ Database initialization with sample data

### Option 2: Docker Deployment

```bash
# Quick Docker setup
docker compose up -d

# Or using the build script with cleanup and testing
./build-docker.sh --clean --test
```

### Option 3: Manual Installation

See [Installation Guide](docs/QUICK_START_IMPLEMENTATION_GUIDE.md) for detailed manual setup instructions.

## 🔧 Installation

### System Requirements

- **OS**: Ubuntu 20.04+, Debian 11+, CentOS 8+, or RHEL 8+
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 10GB available disk space
- **Network**: Internet connection for dependencies

### Dependencies

The install script automatically installs:

- **Docker** & **Docker Compose** - Container orchestration
- **Node.js 20 LTS** - JavaScript runtime
- **PostgreSQL 15** - Database for Keycloak
- **PM2** - Process manager for Node.js
- **Keycloak 25.0** - Enterprise authentication server

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/theblackhat55/GRC.git
   cd GRC
   ```

2. **Run Installer**
   ```bash
   chmod +x install.sh
   sudo ./install.sh
   ```

3. **Access Platform**
   - **DMT Platform**: http://localhost:3000
   - **Keycloak Admin**: http://localhost:8080/admin
   - **Health Check**: http://localhost:3000/health

## ⚙️ Configuration

### Environment Variables

The installer creates these configuration files:

- **`.env.production`** - Main application configuration
- **`config/keycloak-credentials.env`** - Keycloak database credentials
- **`config/keycloak-client.env`** - Keycloak client configuration

### Default User Accounts

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Super Admin | `admin` | `admin123` | Full system access |
| Risk Manager | `riskmanager` | `risk123` | Risk management access |
| Auditor | `auditor` | `audit123` | Read-only audit access |

> ⚠️ **Security**: Change default passwords immediately after first login!

### Service Configuration

```bash
# DMT Application Service
sudo systemctl start dmt-webapp
sudo systemctl enable dmt-webapp

# Keycloak Service (Docker)
docker compose -f docker-compose.keycloak.yml up -d
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        DMT Platform                        │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │   Frontend      │  │         Backend API             │  │
│  │   (Static)      │  │        (Hono + Node.js)        │  │
│  │                 │  │                                 │  │
│  │ • Dashboard     │  │ • Authentication Routes         │  │
│  │ • Risk Forms    │  │ • Risk Assessment API           │  │
│  │ • Reports       │  │ • Framework Management          │  │
│  │ • Settings      │  │ • User Management               │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Layer                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                  Keycloak SSO                       │  │
│  │                                                     │  │
│  │ • OIDC/OAuth2 Provider                              │  │
│  │ • User & Role Management                            │  │
│  │ • Multi-Factor Authentication                       │  │
│  │ • Session Management                                │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                            │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │    SQLite       │  │           PostgreSQL            │  │
│  │ (Application)   │  │          (Keycloak)             │  │
│  │                 │  │                                 │  │
│  │ • Risk Data     │  │ • User Accounts                 │  │
│  │ • Frameworks    │  │ • Roles & Permissions           │  │
│  │ • Assessments   │  │ • Sessions                      │  │
│  │ • Audit Logs    │  │ • Authentication Logs           │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

- **Backend**: Hono Framework, Node.js, TypeScript
- **Frontend**: Vanilla JavaScript, TailwindCSS, Chart.js
- **Authentication**: Keycloak (OIDC/OAuth2)
- **Database**: SQLite (Application), PostgreSQL (Keycloak)
- **Deployment**: Docker, Docker Compose, Systemd
- **Process Management**: PM2, Supervisor

## 🛠️ Development

### Development Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/theblackhat55/GRC.git
   cd GRC
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Services**
   ```bash
   # Start Keycloak
   docker compose -f docker-compose.keycloak.yml up -d
   
   # Start development server
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

### Project Structure

```
DMT-GRC/
├── src/                    # Source code
│   ├── api/               # API route handlers
│   ├── database/          # Database utilities
│   ├── auth-keycloak.js   # Keycloak authentication
│   └── index.tsx          # Main application entry
├── public/                # Static assets
│   └── static/           # JS, CSS, images
├── docs/                  # Documentation
├── scripts/               # Utility scripts
├── config/                # Configuration files
├── database/              # SQL files and database
├── keycloak/              # Keycloak configuration
├── Dockerfile.ubuntu      # Docker configuration
├── docker-compose.yml     # Docker services
├── install.sh            # Automated installer
└── package.json          # Dependencies
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main dashboard |
| `/api/auth/login` | GET | Initiate Keycloak login |
| `/api/auth/callback` | GET | Handle Keycloak callback |
| `/api/auth/logout` | POST | Logout user |
| `/api/risks` | GET/POST | Risk management |
| `/api/frameworks` | GET | Compliance frameworks |
| `/api/assessments` | GET/POST | Risk assessments |
| `/api/users` | GET | User management |
| `/health` | GET | Health check |

### Database Schema

- **Users**: User profiles and preferences
- **Risks**: Risk assessments and data
- **Frameworks**: Compliance frameworks (ISO 27001, NIST, etc.)
- **Controls**: Security controls and mappings
- **Assessments**: Risk assessment results
- **Audit_Logs**: System audit trail

## 🔧 Service Management

### DMT Application

```bash
# Service control
sudo systemctl start dmt-webapp
sudo systemctl stop dmt-webapp  
sudo systemctl restart dmt-webapp
sudo systemctl status dmt-webapp

# View logs
sudo journalctl -u dmt-webapp -f

# Direct management (alternative)
pm2 start ecosystem.config.cjs
pm2 stop dmt-webapp
pm2 restart dmt-webapp
pm2 logs dmt-webapp --nostream
```

### Keycloak Service

```bash
# Service control
docker compose -f docker-compose.keycloak.yml up -d
docker compose -f docker-compose.keycloak.yml down
docker compose -f docker-compose.keycloak.yml restart

# View logs
docker compose -f docker-compose.keycloak.yml logs -f

# Service health
curl http://localhost:8080/health/ready
```

### Database Management

```bash
# SQLite (Application Database)
sqlite3 database/dmt-production.sqlite
.tables
.schema users

# PostgreSQL (Keycloak Database)
sudo -u postgres psql keycloak
\\dt
\\q
```

## 🔒 Security

### Authentication Flow

1. User accesses DMT platform
2. Redirected to Keycloak login
3. Keycloak authenticates user
4. Returns JWT tokens to DMT
5. DMT validates tokens and creates session
6. User gains access based on roles

### Role-Based Access Control (RBAC)

- **super_admin**: Full system access, user management
- **admin**: Organization management, user creation
- **risk_manager**: Risk assessments, framework management
- **auditor**: Read-only access to all data
- **user**: Basic platform access

### Security Best Practices

- ✅ Change default passwords
- ✅ Enable HTTPS in production
- ✅ Configure firewall rules
- ✅ Regular security updates
- ✅ Backup encryption
- ✅ Audit log monitoring

## 🚨 Troubleshooting

### Common Issues

1. **Keycloak not accessible**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql
   
   # Check Keycloak container
   docker compose -f docker-compose.keycloak.yml ps
   docker compose -f docker-compose.keycloak.yml logs
   ```

2. **DMT application not starting**
   ```bash
   # Check service status
   sudo systemctl status dmt-webapp
   
   # Check logs
   sudo journalctl -u dmt-webapp -f
   
   # Check database permissions
   ls -la database/
   ```

3. **Authentication failures**
   ```bash
   # Verify Keycloak realm
   curl http://localhost:8080/realms/dmt-risk-platform
   
   # Check client configuration
   cat config/keycloak-client.env
   ```

### Log Locations

- **DMT Application**: `sudo journalctl -u dmt-webapp -f`
- **Keycloak**: `docker compose -f docker-compose.keycloak.yml logs -f`
- **PostgreSQL**: `sudo journalctl -u postgresql -f`
- **System**: `/var/log/syslog`

## 📚 Documentation

- [Quick Start Guide](docs/QUICK_START_IMPLEMENTATION_GUIDE.md)
- [Docker Deployment](docs/DOCKER-DEPLOYMENT.md)
- [Keycloak Integration](docs/KEYCLOAK_INTEGRATION.md)
- [Security Guide](docs/SECURITY.md)
- [Risk Framework Documentation](docs/RISK_FRAMEWORK_DOCUMENTATION.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Community Support

- **Issues**: [GitHub Issues](https://github.com/theblackhat55/GRC/issues)
- **Discussions**: [GitHub Discussions](https://github.com/theblackhat55/GRC/discussions)

### Professional Support

For enterprise support, custom development, or professional services, please contact the development team.

## 🔄 Version History

- **v2.0.1** - Current version with Keycloak SSO integration
- **v2.0.0** - Major release with enterprise features
- **v1.x** - Legacy versions

## 🏆 Acknowledgments

- Keycloak team for the excellent authentication platform
- Hono framework contributors
- The open-source community

---

**⚡ Ready to secure your enterprise? Get started with DMT Risk Assessment Platform today!**

```bash
git clone https://github.com/theblackhat55/GRC.git
cd GRC
sudo ./install.sh
```
# DMT Risk Assessment Platform v2.0.1

## 🛡️ Enterprise GRC Platform with Keycloak Authentication

A comprehensive Risk Management and Governance, Risk & Compliance (GRC) platform built with modern technologies and enterprise-grade security.

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://docker.com)
[![Keycloak](https://img.shields.io/badge/Keycloak-SSO-red?logo=redhat)](https://keycloak.org)
[![Ubuntu](https://img.shields.io/badge/Ubuntu-Compatible-orange?logo=ubuntu)](https://ubuntu.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org)

---

## 🚀 **Quick Start**

### **Option 1: Ubuntu Docker Deployment (Recommended)**

```bash
# Clone the repository
git clone https://github.com/theblackhat55/GRC.git
cd GRC

# Run automated deployment
./deploy-ubuntu-docker.sh
```

### **Option 2: Manual Setup**

```bash
# Install dependencies
npm install

# Start Keycloak (required)
docker compose -f docker-compose.keycloak.yml up -d

# Create test users
./create-keycloak-users.sh

# Start application
npm start
```

**Access URLs:**
- **Application**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Keycloak Admin**: http://localhost:8080 (admin/admin123)

---

## 🏗️ **Architecture**

### **Technology Stack**
- **Backend**: Node.js + Hono Framework
- **Authentication**: Keycloak SSO (OIDC/OAuth2)
- **Database**: SQLite (production) / PostgreSQL (Keycloak)
- **Frontend**: Vanilla JS + TailwindCSS
- **Container**: Docker + Docker Compose
- **OS**: Ubuntu 22.04 LTS

### **Security Features**
- ✅ **Enterprise SSO**: Keycloak authentication
- ✅ **Role-Based Access Control**: 5 user roles with granular permissions
- ✅ **JWT Token Management**: Secure token handling with refresh
- ✅ **CORS Protection**: Configured for production use
- ✅ **Rate Limiting**: API and authentication endpoint protection
- ✅ **Input Validation**: Comprehensive data validation
- ✅ **Security Headers**: Full security headers implementation

---

## 👥 **User Roles & Permissions**

| Role | Description | Access Level |
|------|-------------|--------------|
| **admin** | System Administrator | Full platform access |
| **risk_manager** | Risk Management Lead | Risk assessment & management |
| **compliance_officer** | Compliance Specialist | Compliance tracking & reporting |
| **auditor** | Internal/External Auditor | Read-only audit access |
| **risk_owner** | Risk Owner | Basic risk reporting |

### **Default Test Users**
- **Username**: `admin` | **Password**: `password123` | **Role**: System Administrator
- **Username**: `avi_security` | **Password**: `password123` | **Role**: Risk Manager
- **Username**: `sjohnson` | **Password**: `password123` | **Role**: Compliance Officer
- **Username**: `mchen` | **Password**: `password123` | **Role**: Auditor
- **Username**: `edavis` | **Password**: `password123` | **Role**: Risk Owner

---

## 🐳 **Docker Deployment**

### **Complete Stack (Production)**
```bash
# Build and deploy full stack
docker compose -f docker-compose.production.yml up -d

# Services included:
# - PostgreSQL (Keycloak database)
# - Keycloak (Identity provider)
# - DMT App (Main application)
# - Nginx (Reverse proxy - optional)
```

### **Development Stack**
```bash
# Keycloak only (for development)
docker compose -f docker-compose.keycloak.yml up -d

# Run application locally
npm start
```

### **Environment Variables**
```bash
# Core Configuration
NODE_ENV=production
PORT=3000

# Keycloak Configuration
KEYCLOAK_BASE_URL=http://localhost:8080
KEYCLOAK_REALM=dmt-risk-platform
KEYCLOAK_CLIENT_ID=dmt-webapp
KEYCLOAK_CLIENT_SECRET=dmt-webapp-secret-key-2024

# Security
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
```

---

## 🔧 **Development**

### **Prerequisites**
- Node.js 18+ and npm 8+
- Docker and Docker Compose
- Ubuntu 22.04 LTS (recommended)

### **Local Development Setup**
```bash
# Install dependencies
npm install

# Start Keycloak
docker compose -f docker-compose.keycloak.yml up -d

# Wait for Keycloak to start
sleep 60

# Create test users
./create-keycloak-users.sh

# Start development server
npm run dev
```

### **Available Scripts**
```bash
npm start                    # Start production server
npm run dev                  # Start development server
npm run build               # Build application (if needed)
npm run health              # Check application health
npm run keycloak:start      # Start Keycloak stack
npm run keycloak:stop       # Stop Keycloak stack
npm run keycloak:users      # Create test users
npm run logs                # View application logs
```

---

## 📊 **Features**

### **Risk Management**
- ✅ Risk identification and assessment
- ✅ Risk scoring and prioritization
- ✅ Risk treatment planning
- ✅ Risk monitoring and reporting
- ✅ Risk register management

### **Compliance Management**
- ✅ Compliance framework mapping
- ✅ Control assessment and testing
- ✅ Compliance reporting
- ✅ Audit trail management
- ✅ Regulatory requirement tracking

### **Incident Management**
- ✅ Incident reporting and tracking
- ✅ Impact assessment
- ✅ Response planning and execution
- ✅ Lessons learned capture
- ✅ Incident analytics

### **Asset & Service Management**
- ✅ Asset inventory management
- ✅ Service mapping and dependencies
- ✅ Technology stack tracking
- ✅ Asset risk assessment
- ✅ Service availability monitoring

### **AI-Powered Features**
- ✅ AI-driven risk analysis
- ✅ Intelligent compliance mapping
- ✅ Automated risk scoring
- ✅ Natural language processing for documentation
- ✅ Predictive risk analytics

---

## 🔒 **Security & Authentication**

### **Keycloak Integration**
- **Authentication Protocol**: OIDC/OAuth2
- **Token Type**: JWT with refresh tokens
- **Session Management**: Server-side session handling
- **Multi-Factor Authentication**: Configurable MFA support
- **SAML Support**: Enterprise identity provider integration

### **API Security**
- **Authorization**: Bearer token authentication
- **Rate Limiting**: Configurable rate limits
- **CORS**: Cross-origin request protection
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries

---

## 📈 **Monitoring & Health**

### **Health Endpoints**
- **Application**: `GET /health`
- **API**: `GET /api/health`
- **Keycloak**: `GET /health/ready`
- **Database**: Included in health checks

### **Logging**
- **Application Logs**: `/logs/app.log`
- **Error Logs**: `/logs/error.log`
- **Access Logs**: Nginx access logs
- **Audit Logs**: User activity tracking

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Keycloak Not Starting**
```bash
# Check container logs
docker logs dmt-keycloak

# Restart Keycloak
docker compose -f docker-compose.keycloak.yml restart keycloak
```

#### **Authentication Failures**
```bash
# Verify Keycloak health
curl http://localhost:8080/health/ready

# Check realm configuration
curl http://localhost:8080/realms/dmt-risk-platform/.well-known/openid_configuration

# Verify application can reach Keycloak
curl http://localhost:3000/api/auth/keycloak/login
```

#### **Database Issues**
```bash
# Check database file permissions
ls -la database/

# Reinitialize database
npm run db:init

# Check database health
npm run health
```

#### **Port Conflicts**
```bash
# Check port usage
netstat -tulpn | grep -E ":3000|:8080|:5432"

# Kill processes using ports
sudo fuser -k 3000/tcp 8080/tcp 5432/tcp
```

---

## 🔄 **Updates & Maintenance**

### **Updating the Application**
```bash
# Pull latest changes
git pull origin main

# Rebuild Docker images
docker compose -f docker-compose.production.yml build

# Restart services
docker compose -f docker-compose.production.yml up -d
```

### **Database Backups**
```bash
# Manual backup
cp database/dmt-production.sqlite backups/dmt-$(date +%Y%m%d_%H%M%S).sqlite

# Automated backups are included in Docker setup
```

### **Log Rotation**
```bash
# Application logs are automatically rotated
# Manual cleanup if needed
find logs/ -name "*.log.*" -type f -mtime +30 -delete
```

---

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow existing code style and patterns
- Add tests for new features
- Update documentation for API changes
- Ensure Docker builds work correctly
- Test Keycloak integration thoroughly

---

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 **Support**

- **Issues**: [GitHub Issues](https://github.com/theblackhat55/GRC/issues)
- **Documentation**: [GitHub Wiki](https://github.com/theblackhat55/GRC/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/theblackhat55/GRC/discussions)

---

## 🙏 **Acknowledgments**

- **Keycloak** for enterprise-grade authentication
- **Hono Framework** for lightweight and fast web framework
- **TailwindCSS** for modern and responsive UI
- **Docker** for containerization and deployment
- **Node.js** for server-side JavaScript runtime

---

**Built with ❤️ for enterprise risk management and compliance**

![DMT Platform](https://img.shields.io/badge/DMT-Platform-blue?style=for-the-badge)
![Enterprise](https://img.shields.io/badge/Enterprise-Ready-green?style=for-the-badge)
![Secure](https://img.shields.io/badge/Security-First-red?style=for-the-badge)
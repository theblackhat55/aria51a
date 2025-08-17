# 🔐 Keycloak IAM Integration Guide

## Overview

The DMT Risk Assessment System has been upgraded with complete Keycloak Identity and Access Management (IAM) integration, replacing the legacy basic authentication system with enterprise-grade OIDC/OAuth2 authentication.

## Architecture

### Authentication Flow
1. **User Login** → Application redirects to Keycloak
2. **Keycloak Authentication** → User authenticates with Keycloak (local or SAML)
3. **OAuth Callback** → Keycloak returns authorization code
4. **Token Exchange** → Application exchanges code for JWT tokens
5. **User Session** → Application validates tokens and creates session

### Components
- **Keycloak Server**: Identity provider (port 8080)
- **PostgreSQL**: Keycloak database (port 5432)
- **DMT Application**: Resource server (port 3000)
- **Realm**: `dmt-risk-platform`
- **Client**: `dmt-webapp`

## Setup Instructions

### Prerequisites
- Ubuntu Server (or compatible Linux distribution)
- Docker and Docker Compose
- Node.js and npm

### 1. Install Keycloak Infrastructure

```bash
# Clone or navigate to the project directory
cd /path/to/webapp

# Run the automated setup script
./setup-keycloak.sh
```

This script will:
- Install Docker and Docker Compose (if not present)
- Start Keycloak and PostgreSQL containers
- Import the pre-configured DMT realm
- Set up all necessary configurations

### 2. Import Users

```bash
# First, export users from the legacy system
npm run users:export

# Then import users into Keycloak
./import-users-keycloak.sh
```

### 3. Start the Application

```bash
# Build and start the DMT application
npm run build
pm2 start ecosystem.config.cjs

# Test the integration
./test-keycloak.sh
```

## Configuration

### Environment Variables

Add these to your environment or `.env` file:

```bash
KEYCLOAK_BASE_URL=http://localhost:8080
KEYCLOAK_REALM=dmt-risk-platform
KEYCLOAK_CLIENT_ID=dmt-webapp
KEYCLOAK_CLIENT_SECRET=dmt-webapp-secret-key-2024
REDIRECT_URI=http://localhost:3000/api/auth/callback
```

### Keycloak Admin Access

- **URL**: http://localhost:8080/admin
- **Username**: admin
- **Password**: admin123

## User Management

### Default Users

After import, these test users are available:

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| admin | password123 | admin | System Administrator |
| avi_security | password123 | risk_manager | Risk Manager |
| sjohnson | password123 | compliance_officer | Compliance Officer |
| mchen | password123 | auditor | Auditor |
| edavis | password123 | risk_owner | Risk Owner |

### Role Mapping

Keycloak roles are mapped to application roles:

- `admin` → Full system access
- `risk_manager` → Risk management functions
- `compliance_officer` → Compliance and assessment functions
- `auditor` → Read-only audit access
- `risk_owner` → Basic risk reporting access

## API Endpoints

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/keycloak/login` | GET | Initiate Keycloak login |
| `/api/auth/callback` | GET | OAuth callback handler |
| `/api/auth/refresh` | POST | Refresh JWT tokens |
| `/api/auth/logout` | POST | Logout from Keycloak |
| `/api/auth/user` | GET | Get current user info |
| `/api/auth/saml/login` | GET | SAML SSO initiation |

### Legacy Endpoints (Deprecated)

The following endpoints are deprecated and will be removed:

- `/api/auth/login` → Use `/api/auth/keycloak/login`
- `/api/auth/me` → Use `/api/auth/user`

## SAML Integration

Keycloak supports SAML integration with external identity providers:

1. Navigate to Keycloak Admin Console
2. Select the `dmt-risk-platform` realm
3. Go to **Identity Providers** → **SAML v2.0**
4. Configure your SAML provider details
5. Map attributes to user fields

### Common SAML Providers
- Active Directory Federation Services (ADFS)
- Azure AD SAML
- Okta SAML
- Google SAML

## Testing

### Automated Tests

```bash
# Run comprehensive Keycloak integration tests
npm run keycloak:test

# Or directly:
./test-keycloak.sh
```

### Manual Testing

1. **Login Flow**:
   - Navigate to http://localhost:3000
   - Click login or go to `/api/auth/keycloak/login`
   - Authenticate with Keycloak
   - Verify successful callback and session creation

2. **API Access**:
   ```bash
   # Get login URL
   curl http://localhost:3000/api/auth/keycloak/login
   
   # Test authenticated endpoint (with Bearer token)
   curl -H "Authorization: Bearer <JWT_TOKEN>" \
        http://localhost:3000/api/auth/user
   ```

3. **Role-Based Access**:
   - Test different user roles
   - Verify proper authorization for protected endpoints

## Database Migration

### Linking Existing Data

After Keycloak import, link existing risk owners:

```sql
-- Update risk owners with Keycloak user IDs
UPDATE risks SET owner_id = (
    SELECT id FROM users WHERE email = (
        SELECT email FROM users WHERE id = risks.owner_id
    )
) WHERE owner_id IN (
    SELECT id FROM users WHERE auth_provider = 'local'
);
```

### User Data Synchronization

The system maintains local user records for reference:

- **Keycloak**: Primary identity and authentication
- **Local DB**: User relationships and audit trails

## Troubleshooting

### Common Issues

1. **Keycloak Not Starting**:
   ```bash
   # Check container logs
   docker logs dmt-keycloak
   
   # Restart services
   ./setup-keycloak.sh
   ```

2. **Authentication Failures**:
   ```bash
   # Verify Keycloak health
   curl http://localhost:8080/health/ready
   
   # Check realm configuration
   curl http://localhost:8080/realms/dmt-risk-platform/.well-known/openid_configuration
   ```

3. **User Import Issues**:
   ```bash
   # Check exported users file
   cat keycloak/export/users.json
   
   # Re-run import
   ./import-users-keycloak.sh
   ```

### Debug Mode

Enable detailed logging:

```bash
# In Keycloak
export KC_LOG_LEVEL=DEBUG

# In application
export NODE_ENV=development
export DEBUG=keycloak:*
```

## Production Deployment

### Security Considerations

1. **Change Default Passwords**:
   - Keycloak admin password
   - Database passwords
   - Client secrets

2. **Use HTTPS**:
   - Configure SSL certificates
   - Update redirect URIs
   - Enable secure cookies

3. **Network Security**:
   - Firewall configuration
   - Network segmentation
   - Database access restrictions

### Environment-Specific Configuration

Update configurations for production:

```bash
# Production environment variables
KEYCLOAK_BASE_URL=https://keycloak.yourdomain.com
KEYCLOAK_CLIENT_SECRET=<secure-random-secret>
REDIRECT_URI=https://dmt.yourdomain.com/api/auth/callback
```

## Maintenance

### Regular Tasks

1. **User Management**:
   - Review and update user roles
   - Remove inactive users
   - Update user attributes

2. **Security Updates**:
   - Keep Keycloak updated
   - Monitor security advisories
   - Review access logs

3. **Backup**:
   - Database backups
   - Keycloak configuration export
   - User data backups

### Monitoring

Set up monitoring for:

- Keycloak availability
- Authentication success rates
- Token validation errors
- User session activities

## Support

For issues and questions:

1. Check logs: `docker logs dmt-keycloak`
2. Run diagnostics: `./test-keycloak.sh`
3. Verify configuration in Keycloak Admin Console
4. Review authentication flow in browser developer tools

## Migration Timeline

1. ✅ **Phase 1**: Keycloak infrastructure setup
2. ✅ **Phase 2**: User migration and import
3. 🔄 **Phase 3**: Frontend integration (in progress)
4. ⏳ **Phase 4**: Legacy authentication deprecation
5. ⏳ **Phase 5**: Production deployment and testing
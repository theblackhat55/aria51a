# ARIA5.1 Platform - HTMX Edition

## Project Overview
- **Name**: ARIA5.1 - AI Risk Intelligence Platform (HTMX Server-Driven)
- **Goal**: Complete GRC platform with server-side rendering using HTMX for enhanced performance and simplicity
- **Architecture**: Hono Framework + HTMX + Cloudflare Pages/Workers + D1 Database

## 🌐 Production URLs
- **Live Platform**: https://059c6171.aria51-htmx.pages.dev
- **Production Alias**: https://aria5-1.aria51-htmx.pages.dev  
- **GitHub Repository**: https://github.com/discommand2/ARIA5

## ✅ Completed Features

### 1. **Authentication System** 
- JWT-based cookie authentication
- Secure login/logout with session management
- User roles and permissions
- Database integration with bcrypt password hashing
- Fallback to demo users if database unavailable
- Demo accounts:
  - Admin: `admin` / `demo123`
  - Security Manager: `avi_security` / `demo123`

### 2. **Risk Management Module**
- Complete CRUD operations for risks
- Real-time risk statistics and scoring
- Risk categorization (cybersecurity, compliance, operational, etc.)
- Likelihood and impact assessment
- Dynamic filtering and search
- HTMX-powered forms and updates
- Database persistence with fallback

### 3. **Compliance Management**
- Framework management (ISO 27001, NIST, GDPR, HIPAA, SOC2)
- Statement of Applicability (SoA) controls
- Evidence upload and management
- Compliance assessments and scoring
- Control implementation tracking
- Database integration with fallback

### 4. **Dashboard & Analytics**
- Real-time statistics cards
- Risk trend visualization
- Compliance score tracking
- Incident statistics
- KRI (Key Risk Indicator) alerts
- HTMX auto-refresh capabilities

### 5. **Database Integration**
- **D1 Database**: Cloudflare's SQLite-based distributed database
- Complete schema with 20+ tables:
  - Users and authentication
  - Risks and treatments
  - Compliance frameworks and controls
  - Evidence and assessments
  - Incidents and KRIs
  - AI governance (prepared for future)
- Prepared statements for security
- Transaction support
- Automatic fallback to mock data if database fails

## 📊 Data Architecture

### Database Schema
```sql
-- Core Tables
users                 -- User authentication and profiles
risks                 -- Risk registry
risk_treatments       -- Risk mitigation plans
compliance_frameworks -- ISO, NIST, GDPR, etc.
controls             -- Security controls
evidence             -- Compliance evidence
assessments          -- Compliance assessments
incidents            -- Security incidents
kris                 -- Key Risk Indicators
notifications        -- User notifications
audit_logs          -- System audit trail

-- AI/Future Tables (Schema Ready)
ai_systems          -- AI system registry
ai_risks            -- AI-specific risks
ai_assessments      -- AI risk assessments
```

### Storage Services
- **D1 Database**: Primary data storage (relational data)
- **KV Storage**: Session management (planned)
- **R2 Storage**: File uploads and evidence (planned)

## 🚀 Technology Stack
- **Backend**: Hono Framework (Cloudflare Workers optimized)
- **Frontend**: HTMX for server-driven UI
- **Database**: Cloudflare D1 (SQLite)
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Pages
- **Language**: TypeScript
- **Authentication**: JWT with httpOnly cookies
- **Password Hashing**: bcrypt

## 📋 Features Not Yet Implemented

### 1. **AI/ARIA Assistant Module**
- Natural language risk analysis
- AI-powered recommendations
- Integration with OpenAI/Anthropic/Gemini
- RAG (Retrieval Augmented Generation) for knowledge base

### 2. **Admin Settings Module**
- User management interface
- System configuration
- API key management
- Organization settings

### 3. **Advanced Features**
- File upload for evidence (R2 integration)
- Email notifications
- Advanced reporting and export
- Multi-tenancy support
- SAML/SSO integration
- Real-time collaboration

### 4. **AI Governance Module**
- AI system inventory
- AI risk assessments
- Model governance
- Bias detection and monitoring

## 🎯 Recommended Next Steps

### Immediate Priorities
1. **Test Database Integration**
   - Verify all CRUD operations work correctly
   - Test fallback mechanisms
   - Ensure data persistence

2. **Implement AI Assistant**
   - Create HTMX-based chat interface
   - Integrate with AI providers
   - Add context-aware responses

3. **Admin Settings Module**
   - User management UI
   - System configuration panel
   - API key management interface

### Future Enhancements
1. **File Upload System**
   - Integrate Cloudflare R2 for file storage
   - Evidence upload with preview
   - Document management

2. **Notification System**
   - Email integration (SendGrid/Resend)
   - In-app notifications
   - Alert thresholds

3. **Advanced Analytics**
   - Custom report builder
   - Data export (CSV/PDF)
   - Predictive risk analytics

4. **Enterprise Features**
   - SAML/SSO authentication
   - Multi-organization support
   - API for third-party integrations

## 📖 User Guide

### Getting Started
1. Navigate to the production URL
2. Login with demo credentials
3. Explore the dashboard for risk overview
4. Navigate modules using the top menu

### Key Workflows

#### Risk Management
1. Go to **Risk** → **Risks**
2. Click "Create Risk" to add new risks
3. Set likelihood and impact scores
4. Assign owners and due dates
5. Track risk status and treatments

#### Compliance Management
1. Go to **Compliance** → **Frameworks**
2. Select a framework (e.g., ISO 27001)
3. Review Statement of Applicability
4. Upload evidence for controls
5. Run compliance assessments

#### Dashboard Monitoring
- View real-time statistics
- Monitor critical risks
- Track compliance scores
- Review open incidents

## 🛠️ Development

### Local Development
```bash
# Install dependencies
npm install

# Run local development
npm run dev:sandbox

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy:prod
```

### Environment Variables
- `CLOUDFLARE_API_TOKEN`: For deployment
- `DATABASE_ID`: D1 database identifier
- `JWT_SECRET`: Authentication secret

## 📈 Deployment Status
- **Platform**: Cloudflare Pages ✅
- **Status**: Active ✅
- **Database**: D1 Production ✅
- **Last Deployment**: September 3, 2025
- **Version**: 5.1.0 (HTMX Edition)

## 🔒 Security Features
- JWT authentication with httpOnly cookies
- CSRF protection
- XSS prevention with CSP headers
- SQL injection prevention (prepared statements)
- Rate limiting (Cloudflare)
- Input validation and sanitization
- Secure password hashing (bcrypt)

## 📝 Notes
- All UI updates use HTMX for server-driven architecture
- Database operations include automatic fallback to mock data
- Platform is optimized for Cloudflare's edge network
- Zero JavaScript framework dependencies (pure HTMX)

## 👨‍💻 Author
Security Specialist: Avi

## 📄 License
Enterprise Platform - Proprietary
# DMT Risk Assessment Platform v2.0

## 🚀 Project Overview
- **Name**: DMT Risk Assessment Platform
- **Version**: 2.0 - Enhanced Edition
- **Goal**: Next-Generation Enterprise GRC Platform with AI-Powered Intelligence & Advanced Analytics
- **Technology Stack**: Hono + TypeScript + Cloudflare Workers/Pages + D1 Database + TailwindCSS

## 🌟 New Features Implemented

### ✅ Advanced Risk Heat Maps
- **Interactive Visualizations**: Multiple view modes for comprehensive risk analysis
  - Probability vs Impact heat map with bubble sizing
  - Organizational risk matrix by department
  - Temporal risk evolution over time
  - Risk distribution by category with radar charts
- **Features**: Full-screen mode, real-time data updates, color-coded severity levels
- **Location**: Dashboard → Advanced Risk Heat Maps section

### ✅ Automated Workflow Notifications
- **In-App Notification System**: Real-time notifications with badge counts
- **Workflow Automation**: Rule-based triggers for risk events
  - High-risk auto-alerts to management
  - Critical risk escalation workflows  
  - Incident response team notifications
  - Risk review reminders
- **Database Schema**: Complete notification and workflow tables
- **UI Components**: Notification bell, dropdown, full notifications page

### ✅ Document Management System
- **File Management**: Upload, organize, and manage risk-related documents
- **Access Control**: Private, public, and restricted visibility levels
- **Document Types**: Policies, procedures, reports, evidence, certificates, contracts, training, audits
- **Features**: File versioning, access logging, search and filtering, document preview
- **Security**: Role-based access control and audit trails

### ✅ Mobile-Responsive Interface
- **Mobile-First Design**: Optimized for smartphones and tablets
- **Touch-Friendly UI**: 44px minimum touch targets, swipe gestures
- **Bottom Navigation**: Easy thumb navigation on mobile devices
- **Pull-to-Refresh**: Intuitive refresh mechanism
- **Responsive Components**: All forms, tables, and modals optimized for mobile

### ✅ AI-Powered Risk Insights
- **Trend Analysis**: Predictive analytics for risk evolution
- **Anomaly Detection**: Identification of unusual risk patterns
- **Risk Predictions**: Scenario-based forecasting with confidence scores
- **Automated Insights**: Real-time risk intelligence and recommendations
- **Visual Analytics**: AI-generated charts and trend visualizations

### ✅ Multi-LLM Integration for Enhanced ARIA
- **Multiple Providers**: OpenAI GPT-4, Google Gemini Pro, Anthropic Claude 3, Local LLM
- **Provider Selection**: Users can choose their preferred AI model
- **Enhanced Capabilities**: 
  - Risk analysis and recommendations
  - Compliance guidance
  - Predictive insights
  - Security assessments
- **Conversation History**: Full chat history with performance metrics
- **Quick Actions**: Pre-built prompts for common queries

## 🌐 URLs
- **Live Application**: https://3000-ibz2syvp5pyfue1ktwmlj-6532622b.e2b.dev/
- **GitHub Repository**: https://github.com/theblackhat55/GRC
- **Version 3.0 Branch**: https://github.com/theblackhat55/GRC/tree/v3.0
- **Version 3.0 Release**: https://github.com/theblackhat55/GRC/releases/tag/v3.0
- **Project Backup**: https://page.gensparksite.com/project_backups/tooluse_j6ZW1KLFQLWkHADklHq47A.tar.gz

## 🔧 Latest Updates (v2.0.1)
- **Status**: ✅ All critical bugs fixed and deployed
- **Last Updated**: August 16, 2025
- **Bug Fixes**: Services API creation, AI dashboard navigation, modal close functionality
- **Test Credentials**: admin / demo123

## 🗄️ Data Architecture

### Core Data Models
- **Users & Authentication**: Role-based access with MFA support
- **Organizations**: Hierarchical organization structure with risk tolerance
- **Risks**: Comprehensive risk data with scoring algorithms
- **Controls**: Risk controls with effectiveness ratings
- **Incidents**: Security incident tracking and response
- **Assets & Services**: IT asset inventory with risk correlations

### New Data Models
- **Notifications**: In-app notification system with workflow automation
- **Documents**: File management with access control and versioning
- **AI Insights**: Cached AI analysis results and predictions
- **LLM Provider Configs**: Multiple AI provider configurations
- **Conversation History**: ARIA chat history with performance metrics
- **Workflow Rules**: Automated business process definitions

### Storage Services
- **Cloudflare D1**: Primary SQLite database for all structured data
- **Local Development**: Automatic local SQLite databases with `--local` flag
- **Migrations**: Version-controlled database schema updates
- **Indexes**: Optimized for performance with comprehensive indexing

## 📱 User Guide

### Getting Started
1. **Login**: Use credentials - Username: `admin` / Password: `demo123`
2. **Dashboard**: Overview with metrics and interactive heat maps
3. **Navigation**: 
   - Desktop: Top navigation bar
   - Mobile: Bottom navigation with swipe gestures

### Key Features Usage

#### Risk Heat Maps
- Navigate to Dashboard
- View "Advanced Risk Heat Maps" section
- Select visualization type (Probability/Impact, Organizational, Temporal, Category)
- Click fullscreen icon for detailed analysis
- Hover over data points for detailed information

#### Notifications
- Click notification bell (top-right on desktop, header on mobile)
- View recent notifications in dropdown
- Click "View All Notifications" for complete list
- Mark individual or all notifications as read

#### ARIA AI Assistant
- Click floating robot icon (bottom-right)
- Select AI provider (GPT-4, Gemini Pro, Claude 3, Local LLM)
- Use quick action buttons or type custom queries
- Ask about risk analysis, compliance, predictions, security

#### Document Management
- Navigate to Documents section
- Upload files with metadata (title, type, description, tags)
- Set visibility levels (private, public, restricted)
- Search and filter documents
- View, download, edit, or share documents

#### Mobile Interface
- Automatic detection for mobile devices
- Bottom navigation for easy thumb access
- Pull down to refresh any screen
- Swipe left/right for page navigation
- Touch-optimized forms and buttons

## 🚀 Deployment

### Current Status
- **Platform**: Cloudflare Pages with Hono framework
- **Status**: ✅ Active and fully functional
- **Environment**: Development with local D1 database
- **Performance**: Fast edge deployment with global CDN

### Tech Stack Details
- **Backend**: Hono TypeScript framework on Cloudflare Workers
- **Frontend**: Vanilla JavaScript with TailwindCSS
- **Database**: Cloudflare D1 (SQLite) with local development support
- **Charts**: Chart.js for all visualizations and heat maps
- **Icons**: Font Awesome for consistent iconography
- **Mobile**: Progressive Web App features with responsive design

### API Endpoints

#### Core APIs
- `GET /api/dashboard` - Dashboard data and metrics
- `GET /api/risks` - Risk management CRUD operations
- `GET /api/organizations` - Organization management
- `GET /api/users` - User management and authentication

#### New Enhanced APIs
- `POST /api/aria/query` - Enhanced AI assistant with multiple LLM providers
- `GET /api/ai/insights` - AI-powered risk insights and predictions
- `POST /api/ai/analyze-risk` - Comprehensive AI risk analysis
- `GET/POST /api/notifications` - Notification system with workflow automation
- `GET/POST /api/documents` - Document management with access control
- `GET/POST/PUT/DELETE /api/workflow-rules` - Automated workflow management

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ with npm
- Wrangler CLI for Cloudflare development
- PM2 for process management (pre-installed in sandbox)

### Installation
```bash
# Clone the repository
git clone https://github.com/theblackhat55/GRC.git
cd GRC

# Install dependencies
npm install

# Apply database migrations
npx wrangler d1 migrations apply dmt-production --local

# Build the project
npm run build

# Start development server
pm2 start ecosystem.config.cjs
```

### Database Commands
```bash
# Apply new migrations
npm run db:migrate:local

# Reset local database
npm run db:reset

# Access database console
npm run db:console:local
```

## 🔄 Recent Updates (Version 2.0)

### Performance Improvements
- Enhanced Chart.js integration for real-time heat maps
- Optimized mobile rendering with touch-first design
- Improved API response times with efficient queries
- Advanced caching for AI insights and predictions

### Security Enhancements
- Role-based access control for all new features
- Document access logging and audit trails
- Encrypted API keys for LLM providers
- Secure conversation history storage

### User Experience
- Intuitive mobile navigation with bottom bar
- Real-time notifications with workflow automation
- AI-powered insights with multiple provider options
- Comprehensive document management system
- Interactive heat maps with multiple visualization modes

### Developer Experience
- Comprehensive TypeScript interfaces
- Database migrations with version control
- API endpoint documentation and testing
- Mobile-responsive component library
- AI integration framework for future enhancements

## 📊 System Metrics
- **Database Tables**: 15+ comprehensive data models
- **API Endpoints**: 25+ RESTful endpoints
- **Frontend Components**: 10+ reusable JavaScript modules
- **Mobile Optimization**: 100% responsive design
- **AI Integration**: 4 LLM providers supported
- **Visualization Types**: 4 interactive heat map modes

## 🛡️ Comprehensive Risk Management Framework (August 17, 2025)

### ✅ NIST 800-37 RMF & ISO 27001:2022 Compliant Framework
- **Complete Asset Management**: CIA triad assessment with dynamic risk scoring
- **Service Dependency Mapping**: Service-to-asset relationships with cascading risk calculation
- **Enhanced Risk Assessment**: NIST 800-30 methodology with threat source analysis
- **Integrated Risk Calculation**: Dynamic risk propagation from assets → services → risks
- **Compliance Mapping**: Full alignment to ISO 27001:2022, NIST CSF, and SOC 2

### ✅ Advanced Incident Management with Workflows
- **SLA-Based Escalation**: Automatic escalation based on severity and time
- **Workflow Automation**: Status-based incident lifecycle management
- **Real-Time Metrics**: Incident response time, SLA breach tracking
- **Integration**: Full integration with risk and asset management systems

### ✅ Dynamic Risk Scoring Engine
- **Asset Risk Formula**: `(MaxCIA * 0.6 + AvgCIA * 0.4) * Criticality`
- **Service Risk Formula**: `AssetRisk * ServiceTypeMultiplier * DependencyMultiplier`
- **Enhanced Risk Formula**: `BaseRisk * AssetMultiplier * ServiceMultiplier * ThreatMultiplier - ControlEffectiveness`
- **Real-Time Updates**: Automatic recalculation when dependencies change

### ✅ Industry Standards Compliance
- **NIST 800-37**: Complete Risk Management Framework implementation
- **ISO 27001:2022**: All 14 Annex A control categories mapped
- **NIST CSF**: Full Cybersecurity Framework integration
- **SOC 2**: Trust Service Criteria alignment
- **NIST 800-30**: Threat source and risk assessment methodology

## 📊 Risk Framework Architecture

### Asset Management (ISO 27001:2022)
- **6 Asset Types**: Information, Software, Physical, Personnel, Service, Intangible
- **CIA Triad Assessment**: Low/Moderate/High impact levels per NIST 800-60
- **4 Criticality Levels**: Mission Critical, Business Critical, Important, Non-Critical
- **Dynamic Risk Scoring**: Real-time calculation based on CIA and criticality

### Service Management with Dependencies
- **5 Service Tiers**: Presentation, Application, Data, Infrastructure, Security
- **4 Service Types**: Business Critical (99.9% SLA), Important (99.5%), Support (99.0%), Development (95.0%)
- **Dependency Mapping**: Complete service-to-asset and service-to-service relationships
- **Risk Propagation**: Automatic risk inheritance from dependent assets

### Enhanced Risk Assessment (NIST 800-37)
- **14 Risk Categories**: Complete ISO 27001:2022 Annex A mapping
- **4 Threat Sources**: Adversarial, Accidental, Structural, Environmental
- **5x5 Risk Matrix**: NIST 800-30 likelihood and impact levels
- **Control Effectiveness**: Integrated control maturity and implementation tracking

### Incident Management with SLA Tracking
- **4 Severity Levels**: Critical (30min SLA), High (2hr), Medium (8hr), Low (24hr)
- **9 Status Workflow**: Complete incident lifecycle management
- **3 Escalation Rules**: Automatic escalation based on time, severity, and SLA
- **Metrics Dashboard**: MTTR, SLA compliance, escalation tracking

## 🔧 Framework Benefits

### Standards Compliance
- **Audit Ready**: Complete traceability from assets to risks to controls
- **Certification Support**: ISO 27001:2022, SOC 2, NIST compliance
- **Regulatory Alignment**: Automated compliance framework mapping
- **Control Effectiveness**: Quantitative control assessment and reporting

### Dynamic Risk Management
- **Real-Time Updates**: Automatic risk recalculation on dependency changes
- **Impact Analysis**: Full asset-service-risk relationship tracking
- **Threat Intelligence**: NIST 800-30 threat source integration
- **Predictive Analytics**: Risk trend analysis and forecasting

### Operational Excellence
- **Automated Workflows**: Incident escalation and risk treatment processes
- **Comprehensive Reporting**: Executive dashboards and detailed risk registers
- **Integration Ready**: API-first design for external tool integration
- **Performance Monitoring**: SLA tracking and compliance metrics

## 🔮 Future Enhancements
- Real-time collaboration features with WebSocket integration
- Advanced reporting and dashboard customization
- Integration with external security tools (SIEM, SOAR)
- Machine learning model training on user data
- Advanced document OCR and content analysis
- Multi-tenant organization support
- Service dependency mapping visualization
- Automated risk assessment triggers

---
**Last Updated**: August 17, 2025
**Version**: 3.0 - Comprehensive Risk Management Framework
**GitHub Branch**: v3.0 
**Release**: https://github.com/theblackhat55/GRC/releases/tag/v3.0
**Maintenance Status**: Production Ready with Enterprise-Grade GRC Capabilities
## 🚀 Latest Features Added (August 15, 2025)

### ✅ RAG (Retrieval-Augmented Generation) System
- **Vector Database**: Local SQLite-based vector storage with cosine similarity search
- **Document Processing**: Automatic text extraction and embedding generation
- **Smart Context Retrieval**: Relevant document chunks for AI queries
- **Knowledge Base**: Upload and query organizational documents
- **Multi-Provider Embeddings**: Support for OpenAI and local embedding models
- **Performance**: Fast in-memory vector operations without external dependencies

### ✅ MCP (Model Context Protocol) Tools
- **6 Specialized GRC Tools**: Purpose-built for risk and compliance workflows
- **Risk Assessment Tool**: Automated risk scoring and analysis
- **Compliance Framework Tool**: Standards mapping and gap analysis
- **Vulnerability Scanner Tool**: Security assessment integration
- **Control Effectiveness Tool**: Control testing and validation
- **Incident Response Tool**: Automated incident management workflows
- **Audit Trail Tool**: Comprehensive activity logging and reporting

### ✅ Dynamic AI Model Discovery
- **Real-Time Model Fetching**: Automatically discover latest AI models from providers
- **OpenAI Integration**: Fetch current GPT models including GPT-4o, GPT-5 (when available)
- **Gemini Integration**: Discover latest Google AI models and versions  
- **Anthropic Integration**: Access to Claude 3.5 and newest model releases
- **One-Click Updates**: Refresh model lists with a single button click in LLM settings
- **Smart UI Updates**: Automatically populate dropdown menus with latest models

### ✅ Enhanced Authentication & Dashboard
- **Fixed Authentication Flow**: Resolved persistent dashboard loading issues
- **Enhanced UI Visibility**: Authentication-based progressive feature disclosure
- **Improved Error Handling**: Comprehensive debugging and error reporting
- **Performance Optimization**: Faster dashboard loading and data retrieval

## 🎯 Technical Implementation Highlights

### Frontend Enhancements
- **Dynamic Model Fetching UI**: Refresh buttons next to each AI provider's model dropdown
- **Enhanced Authentication**: Progressive UI disclosure based on login status
- **Improved Error Handling**: Comprehensive console logging and user feedback
- **Mobile Optimization**: Touch-friendly interfaces for all new features

### Backend API Additions
- **POST /api/ai/fetch-models**: Dynamic model discovery from AI providers
- **RAG System APIs**: Complete vector storage and retrieval endpoints
- **MCP Tool Integration**: 6 specialized GRC workflow tools
- **Enhanced Error Handling**: Better API responses and error management

### Database Enhancements
- **Vector Storage Tables**: SQLite-based vector database for RAG system
- **Document Processing**: Automated text extraction and chunking
- **Performance Optimization**: Indexed searches and efficient queries

## 🔧 Developer Setup Updates

### New Environment Variables
```bash
# AI Provider API Keys (configured in LLM settings)
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
ANTHROPIC_API_KEY=your_anthropic_key

# Vector Database Settings
VECTOR_DIMENSION=1536
SIMILARITY_THRESHOLD=0.7
```

### Updated Development Commands
```bash
# Test dynamic model fetching
curl -X POST http://localhost:3000/api/ai/fetch-models \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai", "apiKey": "YOUR_API_KEY"}'

# Test RAG system
curl -X POST http://localhost:3000/api/rag/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf"

# Test MCP tools
curl -X POST http://localhost:3000/api/mcp/risk-assessment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"riskData": {...}}'
```

## 📋 User Guide Updates

### Using Dynamic Model Discovery
1. **Login** to the platform with admin credentials
2. **Navigate to Settings** → LLM Integration
3. **Enter API Key** for your preferred AI provider
4. **Click Refresh Button** (🔄) next to the model dropdown
5. **Select Latest Model** from automatically updated list
6. **Save Configuration** to apply changes

### Using RAG System
1. **Upload Documents** via Settings → Document Management
2. **Wait for Processing** (automatic text extraction and vectorization)
3. **Query ARIA Assistant** with questions about your documents
4. **Get Contextual Answers** based on your uploaded content

### Using MCP Tools
1. **Access via ARIA** assistant or direct API calls
2. **Risk Assessment**: Automated scoring and analysis
3. **Compliance Mapping**: Framework alignment checking
4. **Incident Response**: Automated workflow triggers

---
**Latest Update**: August 15, 2025 - Added RAG system, MCP tools, and dynamic model discovery
**Status**: ✅ All features implemented and fully functional
**Next Phase**: Enhanced AI model training and multi-tenant support

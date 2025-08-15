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
- **Project Backup**: https://page.gensparksite.com/project_backups/tooluse_QUKE4t7UQPuBq6WOH-JkKw.tar.gz

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

## 🔮 Future Enhancements
- Real-time collaboration features
- Advanced reporting and dashboard customization
- Integration with external security tools
- Machine learning model training on user data
- Advanced document OCR and content analysis
- Multi-tenant organization support

---
**Last Updated**: August 15, 2025
**Version**: 2.0 - Enhanced Edition
**Maintenance Status**: Active Development
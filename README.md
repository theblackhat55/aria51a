# ARIA - AI Risk Intelligence Assistant

## Project Overview
- **Name**: ARIA
- **Goal**: AI-Powered Risk Intelligence Assistant for Enterprise GRC
- **Features**: Next-Generation Enterprise GRC Platform with AI-Powered Intelligence & Advanced Analytics
- **Version**: 5.2.0

## 🚀 Live Deployment URLs
- **Production**: https://aria-platform.pages.dev/
- **Latest Production**: https://83d50092.aria-platform.pages.dev *(Clean ARIA branding)*
- **Previous Production**: https://fbab6e00.aria-platform.pages.dev
- **Development Sandbox**: https://3000-i5y648fwqc9hcsy2275d3-6532622b.e2b.dev

## 🤖 Platform Features
### **AI-Powered Capabilities**
- **ARIA Assistant**: Conversational AI with deep GRC knowledge
- **Smart Risk Management**: AI-driven risk assessment and monitoring
- **Intelligent Compliance**: Automated framework mapping and evidence collection
- **Predictive Analytics**: Advanced threat intelligence and trend analysis

### **Core GRC Modules**
- **Risk Management**: Comprehensive risk assessment, treatments, and KRIs
- **Compliance Management**: Framework management, SoA, and evidence tracking
- **Asset Management**: IT asset tracking with vulnerability assessments
- **Incident Management**: Security incident response and reporting
- **Document Management**: Centralized document and evidence repository

## 🔐 Authentication
### **Demo Accounts Available**
- **Administrator**: `admin` / `demo123`
- **Risk Manager**: `avi_security` / `demo123`  
- **Compliance Officer**: `sjohnson` / `demo123`

### **Authentication Features**
- Unified login experience (no duplicate login pages)
- Role-based access control
- Session management with JWT tokens
- Mobile-responsive authentication UI

## 🏗️ Technical Architecture
### **Frontend Stack**
- **Framework**: Vanilla JavaScript with Modern ES6+
- **Styling**: TailwindCSS + FontAwesome Icons
- **Charts**: Chart.js for analytics and reporting
- **HTTP Client**: Axios for API communication
- **Date/Time**: Day.js for date manipulation

### **Backend Stack**
- **Runtime**: Cloudflare Workers/Pages
- **Framework**: Hono (lightweight, fast web framework)
- **Database**: SQLite (local development) / D1 (production)
- **Authentication**: JWT-based with bcrypt password hashing
- **API**: RESTful API with comprehensive endpoints

### **Infrastructure**
- **Deployment**: Cloudflare Pages with edge deployment
- **CDN**: Global edge network for optimal performance
- **Storage**: File-based SQLite for development, D1 for production
- **Build Tool**: Vite with Hono plugin for Workers/Pages

## 📱 Mobile Experience
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Hamburger Navigation**: Touch-optimized mobile navigation
- **Authentication Security**: Navigation hidden until user authentication
- **Progressive Enhancement**: Works across all device sizes

## 🛠️ Development
### **Project Structure**
```
aria-platform/
├── src/
│   ├── index.js           # Cloudflare Workers entry point
│   ├── server.js          # Node.js development server
│   ├── api/               # API route handlers
│   └── database/          # Database schema and migrations
├── public/static/         # Static assets (JS, CSS, images)
├── dist/                  # Built files for deployment
├── ecosystem.config.cjs   # PM2 configuration
├── wrangler.toml         # Cloudflare configuration
├── vite.config.js        # Build configuration
└── package.json          # Dependencies and scripts
```

### **Development Commands**
```bash
npm start              # Start Node.js development server
npm run build          # Build for Cloudflare Pages deployment
npm run deploy         # Build and deploy to Cloudflare Pages
npm run dev:sandbox    # Development server for sandbox (PM2)
npm test               # Test local server
```

### **Deployment Workflow**
1. **Build**: `npm run build` - Creates optimized dist/ directory
2. **Deploy**: `npx wrangler pages deploy dist --project-name aria-platform`
3. **Verify**: Test all URLs and functionality post-deployment

## 🧠 AI Integration
### **ARIA Chat Assistant**
- **Context-Aware**: Understands GRC domain and user context
- **Multi-Modal**: Text-based conversational interface
- **Knowledge Base**: Integrated with GRC frameworks and best practices
- **Real-Time**: Instant responses and recommendations

### **AI-Enhanced Features**
- **Risk Scoring**: AI-powered risk assessment algorithms
- **Trend Analysis**: Pattern recognition in compliance data  
- **Automated Reporting**: AI-generated executive summaries
- **Predictive Insights**: Early warning systems for emerging risks

## 🚀 Recent Updates (v5.2.0)
### **Platform Rebranding**
- ✅ Complete rebrand from DMT to ARIA Platform
- ✅ Unified authentication experience (eliminated duplicate login pages)
- ✅ Updated all branding, titles, and messaging
- ✅ AI-focused visual identity with robot icons
- ✅ Deployed to Cloudflare Pages with new branding

### **Technical Improvements**
- ✅ Cloudflare Workers/Pages optimization
- ✅ Mobile-responsive navigation with hamburger menu
- ✅ Authentication-secured UI visibility
- ✅ Unified login flow with consistent branding
- ✅ Performance optimizations for edge deployment

## 📊 Current Status
- **Platform**: ✅ Active and deployed
- **Authentication**: ✅ Fully functional with demo accounts
- **Mobile Support**: ✅ Responsive design implemented
- **AI Integration**: ✅ ARIA assistant integrated
- **Cloudflare Deployment**: ✅ Successfully deployed to edge network
- **Performance**: ✅ Optimized for global edge distribution

## 🔮 Future Roadmap
- **Enhanced AI**: Advanced natural language processing
- **Real-time Collaboration**: Multi-user real-time editing
- **Advanced Analytics**: Machine learning-powered insights
- **API Ecosystem**: Public API for third-party integrations
- **Enterprise SSO**: SAML/OIDC integration
- **Compliance Automation**: Auto-mapping to regulatory frameworks

---

**ARIA v5.2.0** - AI Risk Intelligence Assistant  
*Next-Generation Enterprise GRC Platform with AI-Powered Intelligence*

🌐 **Live Platform**: https://aria-platform.pages.dev/  
🤖 **Experience ARIA**: Sign in with demo credentials above
# ARIA5-HTMX 🚀

**ARIA5.1 Enterprise Risk Intelligence Platform - HTMX Version**

[![Technology](https://img.shields.io/badge/Technology-HTMX-blue)](https://htmx.org/) 
[![Framework](https://img.shields.io/badge/Framework-Hono-orange)](https://hono.dev/) 
[![Platform](https://img.shields.io/badge/Platform-Cloudflare-yellow)](https://workers.cloudflare.com/) 
[![AI](https://img.shields.io/badge/AI-Enhanced_Chatbot-green)](https://developers.cloudflare.com/workers-ai/)

> Advanced AI-powered risk management and threat intelligence platform built with HTMX, featuring an enhanced conversational AI chatbot and RAG (Retrieval-Augmented Generation) analytics.

## 🌟 Key Features

### 🤖 Enhanced AI Chatbot
- **Object-oriented architecture** with `EnhancedChatbot` class
- **Context-aware conversations** with localStorage history persistence
- **Advanced UI/UX** with typing indicators, animations, and message formatting
- **Quick action buttons** for common risk management tasks
- **Voice input support** using Web Speech Recognition API
- **Auto-resize textarea** with character counter and send button states
- **Notification system** with unread message tracking
- **Professional styling** with gradient backgrounds and smooth animations

### 🛡️ Risk Management Suite
- **Dynamic risk assessment** with automated scoring algorithms
- **Risk register management** with mitigation tracking
- **Impact & probability matrices** for comprehensive analysis
- **Real-time risk monitoring** and alert system
- **Mobile-responsive risk dashboard** with touch-friendly controls

### 🔍 Threat Intelligence
- **IOC & threat feed management** with automated ingestion
- **Campaign attribution tracking** and analysis
- **Automated threat hunting** capabilities
- **Intelligence report generation** with contextual insights

### 📋 Compliance Management
- **Multi-framework support** (SOC 2, ISO 27001, custom standards)
- **Automated evidence collection** and assessment scheduling
- **Compliance reporting** with audit trail functionality
- **Control effectiveness monitoring**
- **Mobile-optimized framework cards** with responsive layouts

### 🧠 AI & RAG Analytics
- **Cloudflare Llama3 AI** integration with intelligent fallback
- **Platform data indexing** and retrieval capabilities
- **Contextual ARIA chatbot** with domain-specific knowledge
- **Real-time AI analytics** dashboard with insights

### ⚙️ Operations Center
- **Asset inventory & classification** with security ratings
- **Service management** with CIA (Confidentiality, Integrity, Availability) assessments
- **Security controls tracking** and effectiveness monitoring
- **Operational dashboards** with real-time status updates
- **Mobile-responsive operations dashboard** with optimized stat cards

## 🏗️ Architecture

### Technology Stack
- **Backend**: Hono framework on Cloudflare Workers
- **Frontend**: HTMX + TailwindCSS + Vanilla JavaScript
- **Database**: Cloudflare D1 (SQLite) with global replication
- **AI/ML**: Cloudflare Workers AI with Llama3 models
- **Storage**: Cloudflare KV + R2 for caching and file storage
- **Authentication**: JWT-based with secure session management

### Database Schema
- **Complete database schema** with 15+ migrations
- **User management** with role-based access control
- **Risk assessment** tables with comprehensive tracking
- **Compliance frameworks** and control mappings
- **Threat intelligence** IOC and campaign data
- **AI assistant** knowledge base and conversation history

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account with Workers enabled
- Wrangler CLI installed globally

### Installation

```bash
# Clone the repository
git clone https://github.com/theblackhat55/ARIA5-HTMX.git
cd ARIA5-HTMX

# Install dependencies
npm install

# Set up environment variables
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your configuration

# Apply database migrations
npm run db:migrate:local

# Seed the database with sample data
npm run db:seed

# Start development server
npm run dev
```

### Development Commands

```bash
# Build for production
npm run build

# Start local development server
npm run dev:sandbox

# Database operations
npm run db:migrate:local     # Apply migrations locally
npm run db:migrate:prod      # Apply migrations to production
npm run db:seed              # Seed database with sample data
npm run db:reset             # Reset local database
npm run db:console:local     # Local database console
npm run db:console:prod      # Production database console

# Deployment
npm run deploy               # Deploy to Cloudflare Pages
npm run deploy:prod          # Deploy to production with project name

# Utilities
npm run clean-port           # Kill processes on port 3000
npm run test                 # Test local server
```

## 🌍 Live Demo

**Production URL**: [https://b2074e3e.aria51.pages.dev](https://b2074e3e.aria51.pages.dev)

### 📱 Mobile-Optimized Features
- **Responsive hamburger menu** with smooth animations
- **Touch-friendly interface** with optimized button sizes  
- **Mobile-first design** across all pages
- **Progressive disclosure** - essential info prioritized on small screens
- **Responsive tables** with collapsible columns for mobile

### Demo Accounts
- **Administrator**: `admin / demo123`
- **Risk Manager**: `avi_security / demo123`
- **Compliance Officer**: `sjohnson / demo123`

## 📊 Enhanced Chatbot Features

### Advanced Functionality
- **Context Persistence**: Maintains conversation history across sessions
- **Smart Formatting**: Automatically formats URLs, highlights risk levels
- **Quick Actions**: Predefined prompts for common tasks
- **Voice Input**: Speech-to-text functionality (browser dependent)
- **Typing Indicators**: Real-time typing animations during AI responses
- **Character Counter**: Input validation with 500-character limit
- **Notification System**: Alert badges for new messages when minimized
- **Responsive Design**: Optimized for desktop and mobile devices

### AI Capabilities
- **Risk Assessment**: Intelligent analysis of risk scenarios
- **Compliance Guidance**: Framework-specific compliance assistance
- **Security Recommendations**: Contextual security control suggestions
- **Threat Intelligence**: IOC analysis and threat hunting support

## 🗂️ Project Structure

```
ARIA5-HTMX/
├── src/
│   ├── index.ts                    # Main application entry
│   ├── routes/                     # API route handlers
│   │   ├── auth-routes.ts          # Authentication endpoints
│   │   ├── risk-routes-aria5.ts    # Risk management APIs
│   │   ├── compliance-routes.ts    # Compliance management APIs
│   │   ├── ai-routes.ts            # AI chatbot endpoints
│   │   └── intelligence-routes.ts  # Threat intelligence APIs
│   ├── templates/
│   │   ├── layout-clean.ts         # Enhanced chatbot layout
│   │   └── *.ts                    # Page templates
│   ├── middleware/
│   │   ├── auth-middleware.ts      # JWT authentication
│   │   └── csrf-middleware.ts      # CSRF protection
│   └── lib/                        # Utility libraries
├── migrations/                     # Database schema migrations
├── public/                         # Static assets
├── wrangler.jsonc                  # Cloudflare configuration
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite build configuration
└── ecosystem.config.cjs            # PM2 process configuration
```

## 🔒 Security Features

- **JWT Authentication** with secure token management
- **CSRF Protection** with token validation
- **Role-based Access Control** (Admin, Manager, Analyst)
- **Input Validation** and sanitization
- **SQL Injection Protection** via prepared statements
- **XSS Prevention** through proper escaping
- **Secure Headers** implementation
- **Rate Limiting** for API endpoints

## 📈 Performance & Scalability

- **Global Edge Deployment** on Cloudflare network
- **Sub-100ms response times** worldwide
- **Automatic scaling** with serverless architecture
- **Efficient caching** with KV storage
- **Optimized database queries** with proper indexing
- **Lazy loading** for improved page performance

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: [support@aria51.com](mailto:support@aria51.com)
- 💬 GitHub Issues: [Create an issue](https://github.com/theblackhat55/ARIA5-HTMX/issues)
- 📖 Documentation: [Wiki](https://github.com/theblackhat55/ARIA5-HTMX/wiki)

---

**Built with ❤️ using HTMX, Hono, and Cloudflare Workers**

*Powering enterprise security operations with intelligent risk management and AI-driven insights.*
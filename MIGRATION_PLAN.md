# ARIA5 to ARIA5.1 HTMX Migration Plan

## Complete Feature List from ARIA5

### 1. Core Modules ✅
- [x] Authentication (Login/Logout)
- [ ] Dashboard with real-time metrics
- [ ] Risk Management
- [ ] Risk Treatments
- [ ] Key Risk Indicators (KRIs)
- [ ] Compliance Management
- [ ] Compliance Frameworks
- [ ] Statement of Applicability (SoA)
- [ ] Evidence Management
- [ ] Compliance Assessments
- [ ] Incident Management
- [ ] Asset Management
- [ ] Document Management

### 2. Intelligence Modules
- [ ] AI/ARIA Assistant (Chat Interface)
- [ ] RAG & Knowledge Base
- [ ] AI Providers Management
- [ ] AI Analytics
- [ ] Advanced Search

### 3. Admin & Settings
- [ ] User Management
- [ ] Organization Management
- [ ] Risk Owners Management
- [ ] SAML Configuration
- [ ] Microsoft Integration
- [ ] System Settings
- [ ] Audit Logs

### 4. Reports & Analytics
- [ ] Risk Reports
- [ ] Compliance Reports
- [ ] Incident Reports
- [ ] Executive Summary
- [ ] Custom Reports
- [ ] Export Functions

### 5. Advanced Features
- [ ] Risk Scoring Engine
- [ ] Automated Assessments
- [ ] Workflow Automation
- [ ] Email Notifications
- [ ] Multi-tenancy Support
- [ ] Role-Based Access Control
- [ ] Data Import/Export
- [ ] API Integrations

## Migration Strategy

### Phase 1: Core Infrastructure (Current)
1. ✅ Authentication & Session Management
2. ✅ Basic Routing Structure
3. ✅ Layout Templates
4. ⏳ Dashboard with HTMX updates

### Phase 2: Risk Management Module
1. Risk List View (table with HTMX pagination)
2. Risk Details (modal with HTMX forms)
3. Risk Creation/Edit (HTMX form submission)
4. Risk Treatments Management
5. KRI Monitoring & Alerts

### Phase 3: Compliance Module
1. Frameworks Management
2. Statement of Applicability
3. Evidence Upload & Management
4. Compliance Assessments
5. Audit Trail

### Phase 4: Intelligence Features
1. ARIA Chat Interface (HTMX streaming)
2. RAG Document Processing
3. AI Provider Configuration
4. Knowledge Base Search

### Phase 5: Admin & Reports
1. User & Organization Management
2. System Configuration
3. Report Generation
4. Analytics Dashboard

## HTMX Patterns to Implement

### 1. Table with Pagination
```html
<div hx-get="/api/risks?page=1" 
     hx-trigger="load" 
     hx-target="#risk-table">
  <!-- Table content -->
</div>
```

### 2. Modal Forms
```html
<button hx-get="/risk/create" 
        hx-target="#modal-container" 
        hx-swap="innerHTML">
  Add Risk
</button>
```

### 3. Real-time Updates
```html
<div hx-get="/dashboard/metrics" 
     hx-trigger="every 30s" 
     hx-swap="innerHTML">
  <!-- Metrics -->
</div>
```

### 4. Search as You Type
```html
<input hx-post="/search" 
       hx-trigger="keyup changed delay:500ms" 
       hx-target="#search-results">
```

### 5. Infinite Scroll
```html
<div hx-get="/risks?page=2" 
     hx-trigger="revealed" 
     hx-swap="afterend">
  <!-- More items -->
</div>
```

## Database Schema (from ARIA5)
- Users
- Organizations
- Risks
- Risk_Treatments
- KRIs
- Compliance_Frameworks
- Compliance_Evidence
- Compliance_Assessments
- Incidents
- Assets
- Documents
- Audit_Logs
- AI_Configurations
- RAG_Documents
- Chat_History

## API Endpoints to Migrate
- /api/auth/*
- /api/risks/*
- /api/compliance/*
- /api/incidents/*
- /api/assets/*
- /api/kris/*
- /api/treatments/*
- /api/frameworks/*
- /api/evidence/*
- /api/assessments/*
- /api/admin/*
- /api/organizations/*
- /api/users/*
- /api/aria/*
- /api/rag/*
- /api/ai-providers/*
- /api/reports/*
- /api/analytics/*

## Priority Implementation Order
1. Risk Management (Most Used)
2. Compliance Management
3. AI/ARIA Features
4. Admin Settings
5. Reports & Analytics
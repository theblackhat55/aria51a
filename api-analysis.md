# API Endpoint Analysis

## Missing Backend Endpoints (Frontend calls these but backend doesn't implement them):

1. `/api/ai/chat` - Used in aria-chat.js
2. `/api/ai/risk-assessment` - Used in risk-enhancements.js  
3. `/api/ai-grc/*` - Multiple AI GRC endpoints used in ai-grc-dashboard.js:
   - `/api/ai-grc/assets/risk-dashboard`
   - `/api/ai-grc/services/risk-dashboard` 
   - `/api/ai-grc/ai-analysis/queue`
   - `/api/ai-grc/assets/analyze-bulk`
   - `/api/ai-grc/risks/dynamic-analysis-bulk`
   - `/api/ai-grc/ai-analysis/process-queue`
   - `/api/ai-grc/defender/sync`
4. `/api/kris/:id/readings` - Used in app.js line 1737
5. `/api/rag/*` - Multiple RAG endpoints used in enterprise-modules.js:
   - `/api/rag/stats`
   - `/api/rag/initialize`
   - `/api/rag/index/document`
   - `/api/rag/query`
   - `/api/rag/documents`
   - `/api/rag/cache/clear`
   - `/api/rag/analytics/queries`
   - `/api/rag/analytics/mcp`
6. `/api/saml/config` - Used in enterprise-modules.js
7. `/api/soa` - Used in app.js lines 1494, 1602

## Potentially Missing Features:

- Frontend expects KRI readings endpoint (`/api/kris/:id/readings`)
- Frontend expects SoA (Statement of Applicability) endpoint (`/api/soa`)
- RAG system endpoints not fully implemented
- AI GRC dashboard endpoints missing
- SAML configuration endpoint missing
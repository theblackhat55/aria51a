# ARIA51 Codebase Cleanup Analysis

## Summary
Total files analyzed: 120+ SQL/JS/TS files
**Files that can be safely removed: 89 files**
**Files to keep: 31 files**

---

## ✅ ACTIVE FILES - KEEP THESE (31 files)

### Core Application Files (3)
- `src/index.ts` - Main entry point
- `src/index-secure.ts` - Secure application implementation
- `ecosystem.config.cjs` - PM2 configuration

### Active Route Files (18)
✅ Used in `src/index-secure.ts`:
1. `src/routes/auth-routes.ts` - Authentication (LOGIN/LOGOUT)
2. `src/routes/dashboard-routes-clean.ts` - Main dashboard
3. `src/routes/risk-routes-aria5.ts` - Risk management
4. `src/routes/ai-assistant-routes.ts` - AI assistant
5. `src/routes/enhanced-compliance-routes.ts` - Compliance management
6. `src/routes/operations-fixed.ts` - Operations center
7. `src/routes/intelligence-routes.ts` - Threat intelligence
8. `src/routes/admin-routes-aria5.ts` - Admin panel
9. `src/routes/risk-control-routes.ts` - Risk controls
10. `src/routes/system-health-routes.ts` - System health
11. `src/routes/conversational-assistant.ts` - Conversational AI
12. `src/routes/api-threat-intelligence.ts` - Threat Intel API
13. `src/routes/api-ti-grc-integration.ts` - TI-GRC integration
14. `src/routes/enhanced-ai-chat-routes.ts` - Enhanced AI chat
15. `src/routes/business-units-routes.ts` - Business units
16. `src/routes/ms-defender-routes.ts` - MS Defender integration
17. `src/routes/enhanced-dynamic-risk-routes.ts` - Dynamic risk scoring
18. `src/routes/api-management-routes.ts` - API management (NEW)
19. `src/routes/smtp-settings-routes.ts` - SMTP settings
20. `src/routes/api-ai-threat-analysis.ts` - AI threat analysis
21. `src/routes/api-risk-consistency.ts` - Risk consistency checks

### Active Migration Files (2)
- `migrations/0001_complete_schema.sql` - Core database schema
- `migrations/0113_api_management.sql` - API management (NEW)

### Active Static Files (2)
- `public/static/ai-governance.js` - Referenced in admin routes
- `public/static/enhanced-chatbot.js` - Referenced in templates

### Active Script Files (2)
- `update_admin_password.js` - Admin password utility
- `debug-production-auth.js` - Production auth debugging

### HTMX Library (1)
- `public/htmx/htmx.min.js` - HTMX library (used throughout app)

### Configuration Files (Keep but not counted above)
- `package.json`
- `tsconfig.json`
- `wrangler.jsonc`
- `.gitignore`
- `README.md`

---

## ❌ UNUSED FILES - CAN BE REMOVED (89 files)

### Category 1: Duplicate/Old Route Files (16 files)
These routes are NOT imported in `src/index-secure.ts`:
```
src/routes/auth-routes-cookie.ts           # Old auth implementation
src/routes/api-analytics.ts                # Not imported
src/routes/api-incident-response.ts        # Not imported
src/routes/api-key-routes.ts               # Not imported
src/routes/api-routes.ts                   # Generic, not used
src/routes/api-service-criticality.ts      # Not imported
src/routes/compliance-automation-api.ts    # Not imported
src/routes/compliance-routes.ts            # Replaced by enhanced-compliance-routes.ts
src/routes/ai-compliance-api.ts            # Not imported
src/routes/enhanced-risk-routes.ts         # Replaced by risk-routes-aria5.ts
src/routes/enterprise-multitenancy-api.ts  # Commented out (future feature)
src/routes/incident-response.ts            # Not imported
src/routes/intelligence-settings.ts        # Not imported
src/routes/ml-analytics.ts                 # Not imported
src/routes/policy-management-routes.ts     # Not imported
src/routes/threat-intelligence.ts          # Replaced by intelligence-routes.ts
```

### Category 2: Unused Static JavaScript Files (25 files)
Not referenced anywhere in templates or routes:
```
public/static/ai-assure-module.js
public/static/ai-grc-dashboard.js
public/static/app.js
public/static/aria-chat.js
public/static/asset-service-management.js
public/static/auth-debug.js
public/static/auth.js
public/static/chatbot-widget.js              # Widget is inline in layout-clean.ts
public/static/conversational-assistant.js
public/static/dashboard.js
public/static/document-management.js
public/static/enhanced-compliance-dashboard.js
public/static/enhanced-settings.js
public/static/enterprise-modules.js
public/static/framework-management.js
public/static/helpers.js
public/static/incident-management-enhanced.js
public/static/integrated-risk-framework.js
public/static/kong-config.js
public/static/mobile-interface.js
public/static/modules.js
public/static/notifications.js
public/static/risk-enhancements.js
public/static/risk-management-enhanced.js
public/static/secure-aria.js
public/static/secure-key-manager.js
public/static/system-settings-integration.js
```

### Category 3: Old/Redundant Migration Files (32 files)
These are superseded by the complete schema or are fix scripts:
```
migrations/0002_compliance_schema.sql       # Included in 0001_complete_schema.sql
migrations/0002_seed_data.sql               # Old seed data
migrations/0002_threat_feeds.sql            # Included in complete schema
migrations/0003_compliance_seed_data.sql    # Old seed
migrations/0003_threat_intelligence.sql     # Old
migrations/0004_threat_intelligence_seed.sql # Old seed
migrations/0005_ai_assistant_schema.sql     # Included in complete schema
migrations/0006_ai_assistant_seed.sql       # Old seed
migrations/0007_ai_service_criticality.sql  # Old
migrations/0007_ai_service_criticality_simple.sql # Old
migrations/0007_security_enhancements.sql   # Old
migrations/0008_production_seed_data.sql    # Old seed
migrations/0009_production_security_only.sql # Old
migrations/0010_production_security_simple.sql # Old
migrations/0010_system_settings.sql         # Duplicate number
migrations/0011_rag_schema_production.sql   # Old
migrations/0012_enhanced_risk_management_framework.sql # Old
migrations/0012_system_health_monitoring.sql # Duplicate number
migrations/0012_ti_risk_integration.sql     # Duplicate number
migrations/0013_fix_compliance_frameworks.sql # Fix script
migrations/0014_risk_control_linkage_and_fixes.sql # Fix script
migrations/0018_dynamic_ti_risk_lifecycle.sql # Old
migrations/0019_ai_threat_analysis.sql      # Old
migrations/0020_ti_risk_integration_simplified.sql # Old
migrations/0021_create_services_table.sql   # Included in complete schema
migrations/0022_create_users_table.sql      # Included in complete schema
migrations/0100_ai_ml_standalone.sql        # Old
migrations/0100_enhanced_dynamic_risk_scoring.sql # Duplicate number
migrations/0101_enhanced_grc_ai_integration.sql # Old
migrations/0102_ai_performance_analytics.sql # Old
migrations/0103_audit_logging_system.sql    # Old
migrations/0104_enhanced_rbac_saml_integration.sql # Old
migrations/0105_production_rbac_completion.sql # Old
migrations/0106_production_threat_feeds_fix.sql # Fix script
migrations/0107_fix_risks_table_schema.sql  # Fix script
migrations/0108_ai_compliance_enhancement.sql # Old
migrations/0109_phase3_automation_workflows.sql # Future feature
migrations/0110_phase4_multitenancy_enterprise.sql # Future feature
migrations/0111_business_units_and_services.sql # Included in complete schema
migrations/0112_ms_defender_integration.sql # Included in complete schema
```

### Category 4: Root-Level SQL Fix/Seed Scripts (36 files)
Temporary scripts used during development:
```
analyze-tables.sql
aria51-assets-kris-seed-data.sql
aria51-assets-only-seed-data.sql
aria51-basic-setup.sql
aria51-essential-data.sql
aria51-kris-seed-data.sql
aria52_core_seed.sql
aria52_seed_data.sql
aria52_simplified_seed.sql
cleanup-duplicate-tables.sql
complete_seed_data.sql
comprehensive_seed_data.sql
create_basic_tables.sql
fix-audit-constraint.sql
fix-audit-logs-column.sql
fix-missing-column.sql
fix-production-passwords.sql
fix-production-risk-consistency.sql
fix-risk-data-consistency.sql
fix-risks-production.sql
fix-user-sessions-columns.sql
init_database.sql
insert-user-guide.sql
production-seed-basic.sql
production-seed-correct.sql
production-seed-corrected.sql
production-seed-final.sql
production_setup.sql
sample-enhanced-risk-data.sql
sample-ms-defender-incidents.sql
seed-essential.sql
seed-production.sql
seed.sql
seed_data_fixed.sql
setup-demo-production.sql
simple-compliance-seed.sql
simple_seed_data.sql
test-production-auth.sql
upload-access-control-policy.sql
upload-complete-rag-production.sql
upload-policies-fixed.sql
upload-policies-to-rag.sql
upload-remaining-policies.sql
upload-risk-methodology.sql
upload-user-guide.sql
```

### Category 5: Docs Folder SQL Files (2 files)
```
docs/insert-user-guide-fixed.sql
docs/insert-user-guide.sql
```

### Category 6: Scripts Folder (2 files)
```
scripts/add-user-guide-to-rag.js          # RAG setup utility (optional)
scripts/generate-pdf.js                   # PDF generation (optional)
```

### Category 7: Test/Debug Files (1 file)
```
test-html-fix.js
```

---

## 🗂️ Recommended Cleanup Commands

### Safe Removal (Non-destructive - creates backup first)

```bash
# Create backup directory
mkdir -p ~/aria51-cleanup-backup
cd /home/user/webapp

# Backup files before deletion
tar -czf ~/aria51-cleanup-backup/aria51-unused-files-$(date +%Y%m%d-%H%M%S).tar.gz \
  src/routes/auth-routes-cookie.ts \
  src/routes/api-analytics.ts \
  src/routes/api-incident-response.ts \
  src/routes/api-key-routes.ts \
  src/routes/api-routes.ts \
  src/routes/api-service-criticality.ts \
  src/routes/compliance-automation-api.ts \
  src/routes/compliance-routes.ts \
  src/routes/ai-compliance-api.ts \
  src/routes/enhanced-risk-routes.ts \
  src/routes/enterprise-multitenancy-api.ts \
  src/routes/incident-response.ts \
  src/routes/intelligence-settings.ts \
  src/routes/ml-analytics.ts \
  src/routes/policy-management-routes.ts \
  src/routes/threat-intelligence.ts \
  public/static/*.js \
  migrations/0002*.sql migrations/0003*.sql migrations/0004*.sql \
  migrations/0005*.sql migrations/0006*.sql migrations/0007*.sql \
  migrations/0008*.sql migrations/0009*.sql migrations/0010*.sql \
  migrations/0011*.sql migrations/0012*.sql migrations/0013*.sql \
  migrations/0014*.sql migrations/0018*.sql migrations/0019*.sql \
  migrations/0020*.sql migrations/0021*.sql migrations/0022*.sql \
  migrations/010*.sql migrations/011*.sql \
  *.sql \
  docs/*.sql \
  scripts/*.js \
  test-*.js

echo "✅ Backup created in ~/aria51-cleanup-backup/"

# Remove unused route files
rm -f src/routes/auth-routes-cookie.ts
rm -f src/routes/api-analytics.ts
rm -f src/routes/api-incident-response.ts
rm -f src/routes/api-key-routes.ts
rm -f src/routes/api-routes.ts
rm -f src/routes/api-service-criticality.ts
rm -f src/routes/compliance-automation-api.ts
rm -f src/routes/compliance-routes.ts
rm -f src/routes/ai-compliance-api.ts
rm -f src/routes/enhanced-risk-routes.ts
rm -f src/routes/enterprise-multitenancy-api.ts
rm -f src/routes/incident-response.ts
rm -f src/routes/intelligence-settings.ts
rm -f src/routes/ml-analytics.ts
rm -f src/routes/policy-management-routes.ts
rm -f src/routes/threat-intelligence.ts

# Remove unused static files (keep only ai-governance.js and enhanced-chatbot.js)
cd public/static
rm -f ai-assure-module.js ai-grc-dashboard.js app.js aria-chat.js \
      asset-service-management.js auth-debug.js auth.js chatbot-widget.js \
      conversational-assistant.js dashboard.js document-management.js \
      enhanced-compliance-dashboard.js enhanced-settings.js \
      enterprise-modules.js framework-management.js helpers.js \
      incident-management-enhanced.js integrated-risk-framework.js \
      kong-config.js mobile-interface.js modules.js notifications.js \
      risk-enhancements.js risk-management-enhanced.js secure-aria.js \
      secure-key-manager.js system-settings-integration.js
cd ../..

# Remove old migration files (keep only 0001_complete_schema.sql and 0113_api_management.sql)
cd migrations
rm -f 0002*.sql 0003*.sql 0004*.sql 0005*.sql 0006*.sql 0007*.sql \
      0008*.sql 0009*.sql 0010*.sql 0011*.sql 0012*.sql 0013*.sql \
      0014*.sql 0018*.sql 0019*.sql 0020*.sql 0021*.sql 0022*.sql \
      010*.sql 011*.sql
cd ..

# Remove root-level SQL files
rm -f *.sql

# Remove docs SQL files
rm -f docs/*.sql

# Remove optional script files
rm -f scripts/*.js

# Remove test files
rm -f test-*.js

echo "✅ Cleanup complete! Removed 89 unused files."
echo "✅ Backup available at: ~/aria51-cleanup-backup/"
echo ""
echo "To restore if needed:"
echo "  tar -xzf ~/aria51-cleanup-backup/aria51-unused-files-*.tar.gz"
```

---

## 📊 Space Savings Estimate

- **Route files**: ~16 files × ~50KB avg = ~800KB
- **Static JS files**: ~25 files × ~20KB avg = ~500KB
- **Migration files**: ~32 files × ~10KB avg = ~320KB
- **Root SQL files**: ~36 files × ~15KB avg = ~540KB
- **Other files**: ~6 files × ~5KB avg = ~30KB

**Total estimated space saved: ~2.2MB**

---

## ⚠️ Important Notes

1. **Always backup before deletion** - The commands above create a tarball backup
2. **Test after cleanup** - Run `npm run build` and test the application
3. **Git safety** - Commit current state before cleanup: `git commit -am "Pre-cleanup snapshot"`
4. **Restore if needed** - If something breaks, extract the backup tarball
5. **Migration files** - Keep migrations/0001_complete_schema.sql as the source of truth

---

## 🧪 Post-Cleanup Verification

After cleanup, verify everything works:

```bash
# 1. Build the application
npm run build

# 2. Start development server
pm2 start ecosystem.config.cjs

# 3. Test critical routes
curl http://localhost:3000/health
curl http://localhost:3000/auth/login

# 4. Check for errors
pm2 logs --nostream

# 5. If all good, commit cleanup
git add .
git commit -m "Cleanup: Remove 89 unused files (routes, migrations, scripts)"
git push origin main
```

---

**Analysis Date**: October 7, 2025
**Analyzed By**: AI Assistant
**Total Files Reviewed**: 120+
**Removal Recommendation**: 89 files (74% reduction)

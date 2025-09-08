# ARIA5 Database Table Analysis & Cleanup Recommendations

## 📊 Complete Table Inventory (59 Tables Total)

### 🔍 **CONFIRMED DUPLICATES - Action Required**

#### 1. **Risk Management Tables**
| Table | Records | Status | Action |
|-------|---------|--------|--------|
| `risks` | 5 | ✅ **KEEP** - Comprehensive enterprise table | Primary table |
| `risks_simple` | 16 | ❌ **REMOVE** - Legacy/demo table | **DELETE** |

**Issue**: Fixed in latest deployment, but `risks_simple` still exists with stale data.

#### 2. **Asset Management Tables** 
| Table | Records | Status | Action |
|-------|---------|--------|--------|
| `assets` | 30 | ⚠️ **LEGACY** - Basic fields | Used by operations-fixed.ts |
| `assets_enhanced` | 0 | ✅ **MODERN** - Comprehensive fields | Used by enhanced-risk-routes.ts |

**Issue**: Code uses both tables. Need to migrate data and standardize.

### 🧹 **EMPTY LEGACY TABLES - Safe to Remove**

#### Controls Tables
| Table | Records | Status | Action |
|-------|---------|--------|--------|
| `controls` | 0 | 🗑️ Empty legacy table | **DROP** |
| `controls_enhanced` | 0 | 🗑️ Empty enhanced table | **DROP** |

#### Chat History Tables  
| Table | Records | Status | Action |
|-------|---------|--------|--------|
| `chat_history` | 0 | 🗑️ Empty legacy table | **DROP** |
| `ai_chat_history` | 3 | ✅ Active enhanced table | **KEEP** |

#### Documents Tables
| Table | Records | Status | Action |
|-------|---------|--------|--------|
| `documents` | 0 | 🗑️ Empty legacy table | **DROP** |
| `rag_documents` | 10 | ✅ Active RAG-enabled table | **KEEP** |

#### Audit Tables
| Table | Records | Status | Action |
|-------|---------|--------|--------|
| `audit_logs` | 83 | ✅ Active with data | **KEEP** |
| `security_audit_logs` | 0 | 🗑️ Empty specialized table | **DROP** |

### 📋 **ACTIVE CORE TABLES - Keep**

#### User & Organization Management
- `users` (10 records) - Core user management
- `organizations` (1 record) - Organization data
- `user_sessions` - Session management

#### Security & Intelligence  
- `incidents` (4 records) - Security incidents
- `iocs` (1 record) - Indicators of compromise  
- `threat_campaigns`, `threat_events`, `threat_reports`, `threat_sources` - Threat intelligence
- `hunt_findings`, `hunt_results` - Threat hunting

#### Compliance & Risk
- `compliance_assessments`, `compliance_frameworks`, `compliance_requirements` - Compliance management
- `assessment_findings`, `assessment_responses` - Assessment data
- `risk_categories`, `risk_control_mappings`, `risk_treatments` - Risk management support
- `evidence`, `framework_controls` - Compliance evidence

#### System Management
- `api_keys`, `api_performance_metrics` - API management
- `backup_operations`, `system_health_metrics`, `system_health_status` - System monitoring
- `security_scan_results`, `security_events` - Security monitoring

#### AI & Analytics
- `ai_configurations`, `ai_insights` - AI service management
- `document_chunks` - RAG processing
- `esg_metrics` - ESG analytics

#### Specialized Features
- `vulnerabilities_enhanced` - Vulnerability management  
- `risk_assessments_enhanced` - Advanced risk assessments
- `workflows` - Workflow management
- `saml_config` - SSO configuration
- `system_configuration` - System settings

### 🔧 **METADATA/SYSTEM TABLES - Keep**
- `_cf_KV` - Cloudflare KV integration
- `d1_migrations` - Migration history
- `sqlite_sequence` - SQLite auto-increment
- `soa`, `kris` - System/legacy tables

## 🚨 **IMMEDIATE CLEANUP ACTIONS**

### Priority 1: Remove Confirmed Duplicates
```sql
-- CRITICAL: Remove risks_simple (already fixed in code)
DROP TABLE IF EXISTS risks_simple;

-- Remove empty legacy tables  
DROP TABLE IF EXISTS controls;
DROP TABLE IF EXISTS chat_history;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS security_audit_logs;
```

### Priority 2: Asset Table Migration
1. **Analyze asset table usage** in operations-fixed.ts
2. **Migrate data** from `assets` to `assets_enhanced`  
3. **Update code** to use `assets_enhanced` exclusively
4. **Drop legacy** `assets` table

### Priority 3: Enhanced Tables Review
- `controls_enhanced` (empty) - Check if needed for future compliance features
- `vulnerabilities_enhanced` - Verify integration with threat intelligence
- `risk_assessments_enhanced` - Confirm usage in risk workflows

## 📈 **IMPACT ANALYSIS**

### Storage Optimization
- **Before**: 59 tables (including 7+ empty duplicates)  
- **After**: ~50 tables (remove empty legacy tables)
- **Space Saved**: Eliminate unused schema overhead

### Performance Benefits
- Reduced table scanning for system queries
- Cleaner migration history  
- Simplified backup/restore operations

### Maintenance Benefits
- Single source of truth for each data domain
- Reduced confusion in development
- Cleaner database schema documentation

## 🎯 **RECOMMENDATIONS**

1. **Immediate** - Drop `risks_simple` (code already fixed)
2. **Short-term** - Remove empty legacy tables (safe operation)
3. **Medium-term** - Migrate assets data and standardize
4. **Long-term** - Implement table lifecycle management to prevent future duplicates

This analysis ensures ARIA5 has a clean, efficient database structure with no duplicate or unnecessary tables.
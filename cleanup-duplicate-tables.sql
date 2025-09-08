-- ARIA5 Database Cleanup Script
-- Remove duplicate and empty legacy tables
-- CRITICAL: Run this ONLY after verifying code no longer uses these tables

-- =============================================================================
-- PRIORITY 1: Remove risks_simple (CONFIRMED SAFE - Code already fixed)
-- =============================================================================

-- Backup data before deletion (optional - uncomment if needed)
-- CREATE TABLE risks_simple_backup AS SELECT * FROM risks_simple;

-- Remove the duplicate risks table that caused data inconsistencies
DROP TABLE IF EXISTS risks_simple;

-- =============================================================================  
-- PRIORITY 2: Remove Empty Legacy Tables (SAFE - No data loss)
-- =============================================================================

-- Empty controls tables (0 records each)
DROP TABLE IF EXISTS controls;
DROP TABLE IF EXISTS controls_enhanced;

-- Empty chat history table (0 records)  
DROP TABLE IF EXISTS chat_history;

-- Empty documents table (0 records)
DROP TABLE IF EXISTS documents;

-- Empty security audit logs (0 records)
DROP TABLE IF EXISTS security_audit_logs;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify key tables still exist and have expected data
SELECT 'VERIFICATION: Core tables status' as check_type;

SELECT 'risks' as table_name, COUNT(*) as record_count 
FROM risks
UNION ALL
SELECT 'assets', COUNT(*) 
FROM assets  
UNION ALL
SELECT 'users', COUNT(*)
FROM users
UNION ALL  
SELECT 'ai_chat_history', COUNT(*)
FROM ai_chat_history
UNION ALL
SELECT 'rag_documents', COUNT(*)
FROM rag_documents
UNION ALL
SELECT 'audit_logs', COUNT(*)
FROM audit_logs;

-- List remaining tables to confirm cleanup
SELECT 'VERIFICATION: Remaining table count' as check_type;
SELECT COUNT(*) as total_tables 
FROM sqlite_master 
WHERE type='table' AND name NOT LIKE 'sqlite_%';

SELECT 'Cleanup completed successfully - Duplicate tables removed' as status;
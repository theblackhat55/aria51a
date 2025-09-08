-- Analyze all user tables with record counts
-- Identify potential duplicates and usage patterns

SELECT 
    'assets' as table_name, 
    COUNT(*) as record_count,
    'Legacy assets table' as description,
    'POTENTIAL DUPLICATE' as status
FROM assets
UNION ALL
SELECT 
    'assets_enhanced',
    COUNT(*),
    'Enhanced assets with detailed fields',
    'KEEP - Comprehensive'
FROM assets_enhanced
UNION ALL
SELECT 
    'controls',
    COUNT(*),
    'Legacy controls table',
    'POTENTIAL DUPLICATE'
FROM controls
UNION ALL
SELECT 
    'controls_enhanced',
    COUNT(*),
    'Enhanced controls with maturity levels',
    'KEEP - Comprehensive'
FROM controls_enhanced
UNION ALL
SELECT 
    'risks',
    COUNT(*),
    'Comprehensive enterprise risks table',
    'KEEP - Primary'
FROM risks
UNION ALL
SELECT 
    'risks_simple',
    COUNT(*),
    'Legacy/demo risks table',
    'DUPLICATE - Remove'
FROM risks_simple
UNION ALL
SELECT 
    'chat_history',
    COUNT(*),
    'Legacy chat history',
    'POTENTIAL DUPLICATE'
FROM chat_history
UNION ALL
SELECT 
    'ai_chat_history',
    COUNT(*),
    'Enhanced AI chat with models/metrics',
    'KEEP - Enhanced'
FROM ai_chat_history
UNION ALL
SELECT 
    'audit_logs',
    COUNT(*),
    'Legacy audit logs',
    'CHECK USAGE'
FROM audit_logs
UNION ALL
SELECT 
    'security_audit_logs',
    COUNT(*),
    'Security-specific audit logs',
    'KEEP - Security'
FROM security_audit_logs
UNION ALL
SELECT 
    'documents',
    COUNT(*),
    'Legacy documents table',
    'POTENTIAL DUPLICATE'
FROM documents
UNION ALL
SELECT 
    'rag_documents',
    COUNT(*),
    'RAG-enabled documents',
    'KEEP - AI Enhanced'
FROM rag_documents
ORDER BY table_name;
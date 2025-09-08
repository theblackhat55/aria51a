-- Comprehensive Audit Logging System
-- This migration creates a comprehensive audit log table for tracking all user activities
-- including login with public IP, logout, changes, and other activities

-- Create audit_logs table for comprehensive activity tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- User Information
    user_id INTEGER,
    username TEXT,
    user_email TEXT,
    user_role TEXT,
    
    -- Activity Information
    activity_type TEXT NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete', 'view', 'export', 'config_change'
    activity_description TEXT NOT NULL,
    activity_category TEXT, -- 'authentication', 'risk_management', 'compliance', 'system', 'data_access'
    
    -- Target Information (what was acted upon)
    target_type TEXT, -- 'risk', 'user', 'compliance_framework', 'asset', 'system_config'
    target_id TEXT,
    target_name TEXT,
    
    -- Request Information
    http_method TEXT, -- 'GET', 'POST', 'PUT', 'DELETE'
    request_url TEXT,
    request_path TEXT,
    user_agent TEXT,
    
    -- Network Information
    public_ip TEXT,
    forwarded_ip TEXT,
    session_id TEXT,
    
    -- Change Details
    old_values TEXT, -- JSON string of old values for updates
    new_values TEXT, -- JSON string of new values for updates
    
    -- Security & Compliance
    risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    compliance_relevant INTEGER DEFAULT 0, -- 1 if relevant for compliance audits
    
    -- Metadata
    success INTEGER DEFAULT 1, -- 1 for success, 0 for failure/error
    error_message TEXT,
    response_code INTEGER,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Retention and archival
    retention_period INTEGER DEFAULT 2555, -- Days to retain (default 7 years for compliance)
    archived INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_activity_type ON audit_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_activity_category ON audit_logs(activity_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_public_ip ON audit_logs(public_ip);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_audit_logs_compliance_relevant ON audit_logs(compliance_relevant);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON audit_logs(risk_level);

-- Create user session tracking table
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    username TEXT,
    
    -- Login Information
    login_ip TEXT,
    login_user_agent TEXT,
    login_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Session Status
    status TEXT DEFAULT 'active', -- 'active', 'expired', 'logged_out', 'terminated'
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Logout Information
    logout_timestamp DATETIME,
    logout_reason TEXT, -- 'user_logout', 'timeout', 'admin_termination', 'security_violation'
    
    -- Security Information
    failed_attempts INTEGER DEFAULT 0,
    security_flags TEXT, -- JSON for security-related flags
    
    -- Geographic and Device Info
    country TEXT,
    city TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    
    -- Compliance
    compliance_session INTEGER DEFAULT 0, -- 1 if this is a compliance-related session
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON user_sessions(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_ip ON user_sessions(login_ip);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_timestamp ON user_sessions(login_timestamp);

-- Insert initial audit log entry
INSERT INTO audit_logs (
    activity_type,
    activity_description,
    activity_category,
    target_type,
    public_ip,
    risk_level,
    compliance_relevant
) VALUES (
    'system',
    'Audit logging system initialized - comprehensive user activity tracking enabled',
    'system',
    'database',
    '127.0.0.1',
    'medium',
    1
);
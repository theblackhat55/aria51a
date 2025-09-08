-- Production RBAC Completion Migration
-- Add missing RBAC tables and columns for production deployment

-- Add missing columns to users table (only if they don't exist)
-- Note: SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so we'll use a different approach

-- First, let's add the missing columns that we need
ALTER TABLE users ADD COLUMN permissions TEXT;
ALTER TABLE users ADD COLUMN manager_id INTEGER REFERENCES users(id);
ALTER TABLE users ADD COLUMN last_password_change DATETIME;
ALTER TABLE users ADD COLUMN password_expires_at DATETIME;

-- Create roles table (essential for RBAC)
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT, -- JSON string of permissions
  is_system_role INTEGER DEFAULT 0, -- System roles cannot be deleted
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create user_roles junction table (essential for RBAC)
CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  assigned_by INTEGER,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  UNIQUE(user_id, role_id)
);

-- Create audit log table for user management actions
CREATE TABLE IF NOT EXISTS user_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'role_assigned', 'role_removed', 'login', 'logout'
  details TEXT, -- JSON details of the change
  performed_by INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- Create enhanced session management table
CREATE TABLE IF NOT EXISTS user_sessions_enhanced (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  csrf_token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  is_active INTEGER DEFAULT 1,
  login_method TEXT DEFAULT 'local', -- 'local', 'saml', 'api'
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert system roles with comprehensive RBAC permissions
INSERT OR IGNORE INTO roles (name, description, permissions, is_system_role) VALUES 
  ('super_admin', 'Super Administrator with full system access', 
   '{"admin":{"all":true},"users":{"create":true,"read":true,"update":true,"delete":true},"risks":{"all":true},"compliance":{"all":true},"intelligence":{"all":true},"ai":{"all":true},"analytics":{"all":true},"system":{"all":true}}', 1),
  
  ('admin', 'System Administrator', 
   '{"admin":{"users":true,"config":true},"users":{"create":true,"read":true,"update":true},"risks":{"create":true,"read":true,"update":true},"compliance":{"create":true,"read":true,"update":true},"intelligence":{"read":true,"update":true},"ai":{"use":true},"analytics":{"read":true}}', 1),
  
  ('risk_manager', 'Risk Management Specialist', 
   '{"risks":{"create":true,"read":true,"update":true},"compliance":{"read":true,"update":true},"intelligence":{"read":true},"ai":{"use":true},"analytics":{"read":true}}', 1),
  
  ('security_analyst', 'Security Analyst', 
   '{"risks":{"read":true,"update":true},"compliance":{"read":true},"intelligence":{"create":true,"read":true,"update":true},"ai":{"use":true},"analytics":{"read":true}}', 1),
  
  ('compliance_officer', 'Compliance Officer', 
   '{"compliance":{"create":true,"read":true,"update":true},"risks":{"read":true},"intelligence":{"read":true},"analytics":{"read":true}}', 1),
  
  ('manager', 'Department Manager', 
   '{"risks":{"read":true},"compliance":{"read":true},"intelligence":{"read":true},"analytics":{"read":true}}', 1),
  
  ('analyst', 'Business Analyst', 
   '{"risks":{"read":true},"compliance":{"read":true},"analytics":{"read":true}}', 1),
  
  ('viewer', 'Read-Only Viewer', 
   '{"risks":{"read":true},"compliance":{"read":true}}', 1);

-- Assign default roles to existing users based on their current role field
-- This helps migrate existing users to the new RBAC system

-- Assign super_admin role to existing admin users
INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, 1
FROM users u, roles r 
WHERE u.role = 'admin' AND r.name = 'super_admin';

-- Assign appropriate roles to other existing users
INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, 1
FROM users u, roles r 
WHERE u.role = 'manager' AND r.name = 'manager';

INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, 1
FROM users u, roles r 
WHERE u.role = 'analyst' AND r.name = 'security_analyst';

INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, 1
FROM users u, roles r 
WHERE u.role = 'viewer' AND r.name = 'viewer';

-- For any users with roles not covered above, assign viewer role as default
INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, 1
FROM users u, roles r 
WHERE r.name = 'viewer' 
AND u.id NOT IN (
  SELECT DISTINCT user_id FROM user_roles
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_type ON users(auth_type);
CREATE INDEX IF NOT EXISTS idx_users_saml_subject_id ON users(saml_subject_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_enhanced_token ON user_sessions_enhanced(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_enhanced_user_id ON user_sessions_enhanced(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_user_id ON user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_timestamp ON user_audit_log(timestamp);

-- Create view for easy user permission checking
CREATE VIEW IF NOT EXISTS user_permissions_view AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.role as legacy_role,
  u.auth_type,
  u.department,
  GROUP_CONCAT(r.name) as role_names,
  GROUP_CONCAT(r.permissions) as role_permissions,
  u.permissions as user_specific_permissions
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND (ur.expires_at IS NULL OR ur.expires_at > datetime('now'))
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.username, u.email, u.role, u.auth_type, u.department, u.permissions;
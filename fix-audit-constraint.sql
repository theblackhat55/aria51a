-- Since we can't easily modify NOT NULL constraints in SQLite, 
-- let's create a compatible insert that provides both columns

-- First, let's check what failed_login attempts might be causing issues
-- and clear them to start fresh

-- Update admin user to ensure clean state
UPDATE users 
SET failed_login_attempts = 0, 
    locked_until = NULL,
    password_hash = 'demo123',
    password_salt = NULL
WHERE username = 'admin';

-- Test if we can insert into audit_logs with resource_type
INSERT INTO audit_logs (user_id, action, resource_type, entity_type, ip_address, user_agent, created_at)
VALUES (1, 'test_login', 'authentication', 'authentication', '127.0.0.1', 'test', datetime('now'));

-- Check the insert worked
SELECT * FROM audit_logs WHERE action = 'test_login';
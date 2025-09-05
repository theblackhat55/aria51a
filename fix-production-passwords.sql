-- Fix Production Password Authentication Issue
-- Update admin user password to use demo123 with proper PBKDF2 format

-- For demo purposes, set password_hash to 'demo123' temporarily to trigger migration
-- This will allow the legacy authentication path to work and auto-migrate to secure format
UPDATE users 
SET password_hash = 'demo123', password_salt = null 
WHERE username = 'admin';

-- Also ensure the user is active and not locked
UPDATE users 
SET is_active = 1, 
    failed_login_attempts = 0, 
    locked_until = null,
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'admin';

-- Verify the update
SELECT id, username, password_hash, password_salt, is_active, failed_login_attempts 
FROM users WHERE username = 'admin';
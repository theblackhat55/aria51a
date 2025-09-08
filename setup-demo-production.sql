-- Setup demo accounts for ARIA5 production
-- Password: demo123 (bcrypt hashed)

-- Create/Update demo account
INSERT OR REPLACE INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  role, 
  is_active, 
  organization_id,
  created_at,
  updated_at
) VALUES (
  'demo', 
  'demo@aria5.local', 
  '$2a$10$Q7L1OJ0TfPIZ6V3V4sE5ue5gH4JNqyF9hqPbcFmz.YXd6xGzP3P9a', 
  'Demo', 
  'User', 
  'admin', 
  1, 
  1,
  datetime('now'),
  datetime('now')
);

-- Update admin account with demo123 password
UPDATE users 
SET password_hash = '$2a$10$Q7L1OJ0TfPIZ6V3V4sE5ue5gH4JNqyF9hqPbcFmz.YXd6xGzP3P9a', 
    updated_at = datetime('now')
WHERE username = 'admin';

-- Verify accounts
SELECT username, first_name, last_name, role, is_active FROM users WHERE username IN ('demo', 'admin');
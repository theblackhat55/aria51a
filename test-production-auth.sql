-- Test production authentication - check current admin user status after fix
SELECT 
  id, username, email, 
  password_hash, password_salt, 
  is_active, failed_login_attempts, locked_until,
  last_login, created_at
FROM users 
WHERE username = 'admin';
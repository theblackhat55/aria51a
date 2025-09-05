-- Fix missing password_changed_at column in production database
ALTER TABLE users ADD COLUMN password_changed_at DATETIME DEFAULT NULL;

-- Verify the column was added
PRAGMA table_info(users);
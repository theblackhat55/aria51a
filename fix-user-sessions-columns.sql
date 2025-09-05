-- Fix missing columns in user_sessions table for production
ALTER TABLE user_sessions ADD COLUMN session_data TEXT;
ALTER TABLE user_sessions ADD COLUMN csrf_token TEXT;

-- Verify the columns were added
SELECT name FROM pragma_table_info('user_sessions') WHERE name IN ('session_data', 'csrf_token');
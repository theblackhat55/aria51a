-- Fix missing entity_type column in audit_logs table
ALTER TABLE audit_logs ADD COLUMN entity_type TEXT;

-- Also add created_at column if missing (used in auth code)
ALTER TABLE audit_logs ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Verify the columns were added
SELECT name FROM pragma_table_info('audit_logs') WHERE name IN ('entity_type', 'created_at');
-- Fix compliance_frameworks table structure
-- Add missing columns to existing table

-- Add the type column that was missing
ALTER TABLE compliance_frameworks ADD COLUMN type TEXT DEFAULT 'standard';

-- Add the status column 
ALTER TABLE compliance_frameworks ADD COLUMN status TEXT DEFAULT 'active';

-- Add the created_by column
ALTER TABLE compliance_frameworks ADD COLUMN created_by INTEGER;

-- Update the existing data to have proper type values
UPDATE compliance_frameworks SET type = 'standard' WHERE type IS NULL;
UPDATE compliance_frameworks SET status = 'active' WHERE status IS NULL;
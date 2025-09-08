-- Fix risks table schema - Add missing columns
-- Migration 0107: Fix production risks table to match expected schema

-- Add missing category column if it doesn't exist
ALTER TABLE risks ADD COLUMN category TEXT;

-- Update existing risks to have default category if they don't have one
UPDATE risks SET category = 'operational' WHERE category IS NULL;

-- Make category NOT NULL after setting defaults
-- Note: SQLite doesn't support ALTER COLUMN, so we'll leave it nullable for now
-- but the application will ensure it's always set

-- Add missing subcategory column if it doesn't exist (should already exist in most schemas)
ALTER TABLE risks ADD COLUMN subcategory TEXT;
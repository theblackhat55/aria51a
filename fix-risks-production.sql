-- Simple fix for production risks table
-- Add missing category column and set defaults

-- Add category column if it doesn't exist
ALTER TABLE risks ADD COLUMN category TEXT DEFAULT 'operational';

-- Update existing risks to have a category
UPDATE risks SET category = 'operational' WHERE category IS NULL OR category = '';

-- Add subcategory column if it doesn't exist  
ALTER TABLE risks ADD COLUMN subcategory TEXT;
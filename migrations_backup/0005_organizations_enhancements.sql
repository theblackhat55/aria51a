-- Organizations Table Enhancements
-- Add missing columns that the frontend expects

-- Add missing columns to organizations table
ALTER TABLE organizations ADD COLUMN code TEXT;
ALTER TABLE organizations ADD COLUMN department TEXT;
ALTER TABLE organizations ADD COLUMN location TEXT;
ALTER TABLE organizations ADD COLUMN is_active INTEGER DEFAULT 1;

-- Create index for code lookups
CREATE INDEX IF NOT EXISTS idx_organizations_code ON organizations(code);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- Update existing organizations to set them as active
UPDATE organizations SET is_active = 1 WHERE is_active IS NULL;
-- Add technology_stack column to services table
-- This fixes the "no such column: technology_stack" error

ALTER TABLE services ADD COLUMN technology_stack TEXT;

-- Set default values for existing services
UPDATE services SET technology_stack = 'Unknown' WHERE technology_stack IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_services_technology_stack ON services(technology_stack);
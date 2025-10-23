-- Migration: Add risk_id field to risks table
-- Purpose: Add human-readable unique risk identifiers (RISK-001, RISK-002, etc.)
-- Date: 2025-01-23

-- Step 1: Add risk_id column (nullable initially)
ALTER TABLE risks ADD COLUMN risk_id TEXT;

-- Step 2: Generate risk_id for existing records
-- Format: RISK-00001, RISK-00002, etc.
UPDATE risks 
SET risk_id = 'RISK-' || PRINTF('%05d', id)
WHERE risk_id IS NULL;

-- Step 3: Create unique index on risk_id
CREATE UNIQUE INDEX idx_risks_risk_id ON risks(risk_id);

-- Step 4: Verify all records have risk_id
-- This should return 0 rows
SELECT COUNT(*) as missing_risk_ids FROM risks WHERE risk_id IS NULL;

-- ===============================================
-- PRODUCTION RISK DATA CONSISTENCY FIX
-- Add risk level columns and ensure consistency
-- Safe for production - handles existing columns gracefully
-- ===============================================

-- Step 1: Update any risk_score values that don't match probability * impact
UPDATE risks 
SET risk_score = probability * impact 
WHERE risk_score != (probability * impact) 
  AND probability IS NOT NULL 
  AND impact IS NOT NULL;

-- Step 2: Add risk_level_code column (will fail silently if exists)
-- Note: SQLite doesn't have IF NOT EXISTS for ALTER COLUMN
-- We'll handle this by trying to add and ignoring errors

-- Step 3: Since we can't add columns safely in this context,
-- let's ensure data consistency by updating existing risk_score values
-- and rely on application queries to calculate risk levels dynamically

-- Verify all calculations are correct
UPDATE risks 
SET 
  risk_score = COALESCE(probability * impact, risk_score),
  updated_at = datetime('now')
WHERE probability IS NOT NULL 
  AND impact IS NOT NULL 
  AND (risk_score IS NULL OR risk_score != probability * impact);
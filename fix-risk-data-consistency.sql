-- ===============================================
-- RISK DATA CONSISTENCY FIX
-- Fix inconsistent risk numbers and ratings by updating the risk table
-- This ensures all queries (direct DB, API, frontend) return the same data
-- ===============================================

-- Step 1: Add risk level columns to risks table if they don't exist
ALTER TABLE risks ADD COLUMN risk_level_code TEXT;
ALTER TABLE risks ADD COLUMN risk_level_name TEXT;

-- Step 2: Update inherent_risk to match the calculated risk_score 
-- (This ensures consistency with the GENERATED column)
UPDATE risks 
SET inherent_risk = risk_score 
WHERE inherent_risk != risk_score OR inherent_risk IS NULL;

-- Step 3: Update risk levels based on the standardized thresholds
-- Critical: 20-25, High: 12-19, Medium: 6-11, Low: 1-5
UPDATE risks 
SET 
  risk_level_code = CASE 
    WHEN risk_score >= 20 THEN 'critical'
    WHEN risk_score >= 12 THEN 'high' 
    WHEN risk_score >= 6 THEN 'medium'
    ELSE 'low'
  END,
  risk_level_name = CASE 
    WHEN risk_score >= 20 THEN 'Critical'
    WHEN risk_score >= 12 THEN 'High'
    WHEN risk_score >= 6 THEN 'Medium' 
    ELSE 'Low'
  END;

-- Step 4: Ensure residual_risk is reasonable (not higher than inherent_risk)
UPDATE risks 
SET residual_risk = inherent_risk 
WHERE residual_risk > inherent_risk OR residual_risk IS NULL;

-- Step 5: Update timestamps to reflect the data fix
UPDATE risks 
SET updated_at = datetime('now') 
WHERE 1=1;
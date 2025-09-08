-- AI Service Criticality Assessment Database Schema (Safe Version)
-- This migration adds only new tables and columns that don't already exist

-- Add criticality assessment history table
CREATE TABLE IF NOT EXISTS service_criticality_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  calculated_criticality TEXT CHECK(calculated_criticality IN ('Critical', 'High', 'Medium', 'Low')) NOT NULL,
  criticality_score INTEGER CHECK(criticality_score >= 0 AND criticality_score <= 100) NOT NULL,
  confidence_level REAL CHECK(confidence_level >= 0 AND confidence_level <= 1) NOT NULL,
  
  -- Store JSON objects for complex data
  contributing_factors TEXT NOT NULL, -- JSON: CIA, asset deps, risks, business, technical, historical scores
  recommendations TEXT NOT NULL,      -- JSON: array of recommendation strings
  reassessment_triggers TEXT NOT NULL, -- JSON: array of trigger condition strings
  
  last_assessment DATETIME NOT NULL,
  next_assessment_due DATETIME NOT NULL,
  
  -- Audit fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Service-Asset relationship table for dependency tracking
CREATE TABLE IF NOT EXISTS service_asset_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  relationship_type TEXT DEFAULT 'depends_on' CHECK(relationship_type IN ('depends_on', 'supports', 'contains', 'integrates_with')),
  dependency_strength TEXT DEFAULT 'medium' CHECK(dependency_strength IN ('critical', 'high', 'medium', 'low')),
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  
  -- Unique constraint to prevent duplicate relationships
  UNIQUE(service_id, asset_id, relationship_type)
);

-- Service-Risk relationship table for risk correlation
CREATE TABLE IF NOT EXISTS service_risk_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  risk_id INTEGER NOT NULL,
  relationship_type TEXT DEFAULT 'affects' CHECK(relationship_type IN ('affects', 'threatens', 'impacts', 'degrades')),
  impact_level TEXT DEFAULT 'medium' CHECK(impact_level IN ('critical', 'high', 'medium', 'low')),
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  
  -- Unique constraint to prevent duplicate relationships
  UNIQUE(service_id, risk_id, relationship_type)
);

-- ML model storage table for criticality assessment models
CREATE TABLE IF NOT EXISTS ml_criticality_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT UNIQUE NOT NULL,
  model_name TEXT NOT NULL,
  algorithm_type TEXT CHECK(algorithm_type IN ('random_forest', 'neural_network', 'gradient_boosting', 'ensemble')) NOT NULL,
  model_version TEXT NOT NULL,
  
  -- Model performance metrics
  accuracy_score REAL CHECK(accuracy_score >= 0 AND accuracy_score <= 1),
  precision_score REAL CHECK(precision_score >= 0 AND precision_score <= 1),
  recall_score REAL CHECK(recall_score >= 0 AND recall_score <= 1),
  f1_score REAL CHECK(f1_score >= 0 AND f1_score <= 1),
  
  -- Model metadata
  training_features TEXT NOT NULL,    -- JSON: array of feature names
  feature_importance TEXT,            -- JSON: feature importance scores
  hyperparameters TEXT,              -- JSON: model hyperparameters
  training_data_size INTEGER,
  
  -- Model lifecycle
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'deprecated', 'testing')),
  last_trained DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample service-asset relationships for testing (safe insert)
INSERT OR IGNORE INTO service_asset_links (service_id, asset_id, relationship_type, dependency_strength) 
SELECT DISTINCT 
  s.asset_id as service_id,
  a.asset_id as asset_id,
  'depends_on' as relationship_type,
  CASE 
    WHEN a.criticality = 'Critical' THEN 'critical'
    WHEN a.criticality = 'High' THEN 'high'  
    ELSE 'medium'
  END as dependency_strength
FROM assets_enhanced s
CROSS JOIN assets_enhanced a
WHERE s.category = 'service' 
  AND a.category != 'service'
  AND s.asset_id != a.asset_id
  AND RANDOM() % 4 = 0  -- Random 25% sample for demo
LIMIT 15;
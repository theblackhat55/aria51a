-- Risk-Assets Linking Table for RMF Hierarchy
-- Implements: Risks → Services → Assets → Incidents/Vulnerabilities

CREATE TABLE IF NOT EXISTS risk_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  asset_id INTEGER NOT NULL,
  impact_weight REAL DEFAULT 1.0,  -- How much this asset affects risk score (0.0-1.0)
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  UNIQUE(risk_id, asset_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_risk_assets_risk_id ON risk_assets(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_assets_asset_id ON risk_assets(asset_id);

-- Risk-Incidents Linking Table (already have incidents.risk_id FK)
-- Just add index for better performance
CREATE INDEX IF NOT EXISTS idx_incidents_risk_id ON incidents(risk_id);

-- Add trigger to auto-update risks.updated_at when linked assets change
CREATE TRIGGER IF NOT EXISTS update_risk_on_asset_change
AFTER UPDATE OF criticality ON assets
FOR EACH ROW
BEGIN
  UPDATE risks 
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT risk_id 
    FROM risk_assets 
    WHERE asset_id = NEW.id
  );
END;

-- Add trigger to auto-update risks when risk_assets relationship changes
CREATE TRIGGER IF NOT EXISTS update_risk_on_link_change
AFTER INSERT ON risk_assets
FOR EACH ROW
BEGIN
  UPDATE risks 
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.risk_id;
END;

-- Comments for documentation
-- RMF Hierarchy: Risks → Assets → Incidents
-- Future extension: Services table can link to Assets
-- Services → Assets → Incidents → Vulnerabilities

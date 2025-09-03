-- Recommendations Migration: Audit Log, KRI governance, minor indexes
-- Safe to re-run: uses IF NOT EXISTS and ALTER TABLE add columns guarded by EXISTS checks where possible

-- 1) Audit log for write operations
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  action TEXT NOT NULL,            -- create | update | delete
  user_id INTEGER,
  before_json TEXT,
  after_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity, entity_id);

-- 2) KRI governance fields
ALTER TABLE kris ADD COLUMN owner_id INTEGER;
ALTER TABLE kris ADD COLUMN calculation_method TEXT;     -- description of how value is collected
ALTER TABLE kris ADD COLUMN alerting_policy TEXT;        -- e.g., email/webhook/escalation
ALTER TABLE kris ADD COLUMN breach_workflow_id INTEGER;  -- optional workflow reference

-- Add reference index
CREATE INDEX IF NOT EXISTS idx_kris_owner ON kris(owner_id);

-- Backfill defaults where NULL
UPDATE kris SET calculation_method = COALESCE(calculation_method, ''), alerting_policy = COALESCE(alerting_policy, '');

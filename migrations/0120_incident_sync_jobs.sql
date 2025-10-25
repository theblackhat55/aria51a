-- Migration: 0118_incident_sync_jobs.sql
-- Week 6 - Incident Sync Jobs for Integration Marketplace
-- Enables automated incident synchronization from MS Defender, ServiceNow, etc.

CREATE TABLE IF NOT EXISTS incident_sync_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  integration_key TEXT NOT NULL,
  organization_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  incidents_synced INTEGER DEFAULT 0,
  last_sync_at DATETIME,
  next_sync_at DATETIME,
  sync_interval_minutes INTEGER DEFAULT 15,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_next_sync 
  ON incident_sync_jobs(next_sync_at, status);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_integration 
  ON incident_sync_jobs(integration_key, organization_id);

-- Add external_id column to incidents table if not exists
-- This allows tracking of incidents from external systems
ALTER TABLE incidents ADD COLUMN external_id TEXT;
ALTER TABLE incidents ADD COLUMN external_source TEXT; -- ms_defender, servicenow, tenable

CREATE UNIQUE INDEX IF NOT EXISTS idx_incidents_external_id 
  ON incidents(external_id, external_source) 
  WHERE external_id IS NOT NULL;

-- Incident sync log for tracking historical syncs
CREATE TABLE IF NOT EXISTS incident_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  incident_id INTEGER,
  action TEXT NOT NULL, -- created, updated, skipped, error
  message TEXT,
  sync_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES incident_sync_jobs(id),
  FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

CREATE INDEX IF NOT EXISTS idx_sync_log_job 
  ON incident_sync_log(job_id, sync_timestamp);

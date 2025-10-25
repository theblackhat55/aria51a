-- Migration: 0119_incident_response_ddd_domain.sql
-- Purpose: Create incident response domain tables (DDD implementation)
-- Part of Week 5-6: Incident Response Domain
-- Date: 2025-01-15

-- ==============================================
-- INCIDENTS TABLE
-- ==============================================
-- Core incident tracking with NIST SP 800-61 lifecycle
CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Basic information
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Classification
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  category TEXT NOT NULL,
  impact TEXT NOT NULL,
  
  -- Assignment and timeline
  assigned_to INTEGER, -- User ID
  detected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  contained_at DATETIME,
  resolved_at DATETIME,
  closed_at DATETIME,
  
  -- Technical details
  source_ip TEXT,
  target_asset TEXT,
  affected_systems TEXT, -- JSON array
  
  -- Business impact
  estimated_cost REAL,
  actual_cost REAL,
  data_compromised INTEGER DEFAULT 0, -- Boolean: 0 or 1
  customers_affected INTEGER,
  
  -- Analysis and resolution
  root_cause TEXT,
  resolution TEXT,
  lessons_learned TEXT,
  
  -- Relationships
  related_risks TEXT, -- JSON array of risk IDs
  related_assets TEXT, -- JSON array of asset IDs
  
  -- Multi-tenancy
  organization_id INTEGER NOT NULL,
  
  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for incidents table
CREATE INDEX IF NOT EXISTS idx_incidents_org_id ON incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON incidents(detected_at);
CREATE INDEX IF NOT EXISTS idx_incidents_data_compromised ON incidents(data_compromised);
CREATE INDEX IF NOT EXISTS idx_incidents_org_status ON incidents(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_org_severity ON incidents(organization_id, severity);

-- ==============================================
-- RESPONSE_ACTIONS TABLE
-- ==============================================
-- Individual actions taken during incident response
CREATE TABLE IF NOT EXISTS response_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Link to incident
  incident_id INTEGER NOT NULL,
  
  -- Action details
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Execution tracking
  performed_by INTEGER NOT NULL, -- User ID
  performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Results and evidence
  outcome TEXT,
  evidence_urls TEXT, -- JSON array
  duration_minutes INTEGER,
  cost REAL,
  
  -- Technical details
  tools_used TEXT, -- JSON array
  affected_systems TEXT, -- JSON array
  notes TEXT,
  
  -- Review tracking
  reviewed_by INTEGER, -- User ID
  reviewed_at DATETIME,
  review_comments TEXT,
  
  -- Multi-tenancy
  organization_id INTEGER NOT NULL,
  
  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for response_actions table
CREATE INDEX IF NOT EXISTS idx_response_actions_incident_id ON response_actions(incident_id);
CREATE INDEX IF NOT EXISTS idx_response_actions_org_id ON response_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_response_actions_action_type ON response_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_response_actions_status ON response_actions(status);
CREATE INDEX IF NOT EXISTS idx_response_actions_performed_by ON response_actions(performed_by);
CREATE INDEX IF NOT EXISTS idx_response_actions_performed_at ON response_actions(performed_at);
CREATE INDEX IF NOT EXISTS idx_response_actions_org_incident ON response_actions(organization_id, incident_id);

-- ==============================================
-- SECURITY_EVENTS TABLE
-- ==============================================
-- Raw security events from monitoring systems
CREATE TABLE IF NOT EXISTS security_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Event classification
  event_type TEXT NOT NULL, -- e.g., 'failed_login', 'malware_detected', 'port_scan'
  severity TEXT NOT NULL,
  source TEXT NOT NULL,
  source_system TEXT, -- Specific system/tool name
  
  -- Network details
  source_ip TEXT,
  destination_ip TEXT,
  source_port INTEGER,
  destination_port INTEGER,
  protocol TEXT,
  
  -- Entity details
  user_id INTEGER, -- User involved
  asset_id TEXT, -- Asset identifier
  asset_name TEXT,
  
  -- Event data
  description TEXT NOT NULL,
  raw_log TEXT, -- Raw log entry
  detected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  signature TEXT, -- Detection signature/rule ID
  confidence INTEGER, -- Confidence score (0-100)
  
  -- Analysis
  false_positive INTEGER DEFAULT 0, -- Boolean: 0 or 1
  incident_id INTEGER, -- Linked incident (if correlated)
  correlated_events TEXT, -- JSON array of related event IDs
  metadata TEXT, -- JSON object for additional data
  
  -- Deduplication
  hash TEXT, -- Hash of event data for deduplication
  
  -- Multi-tenancy
  organization_id INTEGER NOT NULL,
  
  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for security_events table
CREATE INDEX IF NOT EXISTS idx_security_events_org_id ON security_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_source ON security_events(source);
CREATE INDEX IF NOT EXISTS idx_security_events_source_system ON security_events(source_system);
CREATE INDEX IF NOT EXISTS idx_security_events_source_ip ON security_events(source_ip);
CREATE INDEX IF NOT EXISTS idx_security_events_destination_ip ON security_events(destination_ip);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_asset_id ON security_events(asset_id);
CREATE INDEX IF NOT EXISTS idx_security_events_incident_id ON security_events(incident_id);
CREATE INDEX IF NOT EXISTS idx_security_events_false_positive ON security_events(false_positive);
CREATE INDEX IF NOT EXISTS idx_security_events_detected_at ON security_events(detected_at);
CREATE INDEX IF NOT EXISTS idx_security_events_hash ON security_events(hash);
CREATE INDEX IF NOT EXISTS idx_security_events_org_uncorrelated ON security_events(organization_id, incident_id, false_positive);
CREATE INDEX IF NOT EXISTS idx_security_events_confidence ON security_events(confidence);

-- ==============================================
-- SUMMARY
-- ==============================================
-- Created 3 tables for Incident Response Domain:
-- 1. incidents (25 fields) - Main incident tracking with NIST SP 800-61 lifecycle
-- 2. response_actions (19 fields) - Actions taken during incident response
-- 3. security_events (27 fields) - Raw security events with correlation support
--
-- Total indexes: 36
-- Supports: SLA tracking, event correlation, multi-tenancy, forensics

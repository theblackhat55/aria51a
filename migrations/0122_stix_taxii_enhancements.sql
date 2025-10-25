-- Migration: 0122_stix_taxii_enhancements.sql
-- Week 7 - STIX 2.1 and TAXII 2.1 Support for Threat Intelligence
-- Purpose: Enhance existing threat intelligence with industry-standard formats

-- First, ensure default organization and user exist (for foreign key constraints)
INSERT OR IGNORE INTO organizations (id, name, type, industry, is_active, created_at) 
VALUES (1, 'Default Organization', 'enterprise', 'technology', 1, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO users (id, username, email, password_hash, first_name, last_name, role, organization_id, is_active)
VALUES (1, 'system', 'system@aria5.local', '$2a$10$dummy.hash.for.system.user', 'System', 'User', 'admin', 1, 1);

-- =============================================================================
-- 1. TAXII SERVERS (External TAXII 2.1 servers)
-- =============================================================================
CREATE TABLE IF NOT EXISTS taxii_servers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  api_root_url TEXT NOT NULL, -- e.g., https://example.com/taxii2/
  discovery_url TEXT, -- Optional discovery endpoint
  username TEXT, -- Optional basic auth
  password_hash TEXT, -- Encrypted password
  api_key TEXT, -- Alternative authentication
  
  -- Connection Settings
  verify_ssl INTEGER DEFAULT 1,
  timeout_seconds INTEGER DEFAULT 30,
  max_content_length INTEGER DEFAULT 10485760, -- 10MB default
  
  -- Status
  is_active INTEGER DEFAULT 1,
  last_connection_test DATETIME,
  last_error TEXT,
  
  -- Collections
  collections_cache TEXT, -- JSON: Cached list of available collections
  collections_updated_at DATETIME,
  
  -- Metadata
  organization_id INTEGER DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_taxii_servers_org ON taxii_servers(organization_id);
CREATE INDEX IF NOT EXISTS idx_taxii_servers_active ON taxii_servers(is_active);

-- =============================================================================
-- 2. TAXII COLLECTIONS (Collections within TAXII servers)
-- =============================================================================
CREATE TABLE IF NOT EXISTS taxii_collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  taxii_server_id INTEGER NOT NULL,
  collection_id TEXT NOT NULL, -- TAXII collection UUID
  title TEXT NOT NULL,
  description TEXT,
  
  -- Collection capabilities
  can_read INTEGER DEFAULT 1,
  can_write INTEGER DEFAULT 0,
  media_types TEXT, -- JSON array of supported media types
  
  -- Polling configuration
  poll_enabled INTEGER DEFAULT 1,
  poll_interval_minutes INTEGER DEFAULT 60, -- Poll every hour
  last_poll_at DATETIME,
  next_poll_at DATETIME,
  added_after DATETIME, -- Only fetch objects after this timestamp
  
  -- Sync statistics
  objects_synced INTEGER DEFAULT 0,
  last_sync_count INTEGER DEFAULT 0,
  last_error TEXT,
  
  -- Metadata
  organization_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (taxii_server_id) REFERENCES taxii_servers(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_taxii_collections_server ON taxii_collections(taxii_server_id);
CREATE INDEX IF NOT EXISTS idx_taxii_collections_poll ON taxii_collections(poll_enabled, next_poll_at);
CREATE INDEX IF NOT EXISTS idx_taxii_collections_org ON taxii_collections(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_taxii_collections_unique 
  ON taxii_collections(taxii_server_id, collection_id);

-- =============================================================================
-- 3. STIX OBJECTS (STIX 2.1 Objects)
-- =============================================================================
CREATE TABLE IF NOT EXISTS stix_objects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stix_id TEXT NOT NULL UNIQUE, -- STIX 2.1 ID (e.g., indicator--uuid)
  stix_type TEXT NOT NULL, -- indicator, malware, threat-actor, campaign, etc.
  stix_version TEXT NOT NULL, -- STIX version (e.g., 2.1)
  
  -- STIX Object Data
  name TEXT,
  description TEXT,
  spec_version TEXT DEFAULT '2.1',
  created DATETIME NOT NULL,
  modified DATETIME NOT NULL,
  
  -- Full STIX object (JSON)
  stix_object TEXT NOT NULL, -- Complete STIX JSON object
  
  -- Parsed key fields for quick searching
  labels TEXT, -- JSON array of labels
  confidence INTEGER, -- 0-100 confidence score
  valid_from DATETIME,
  valid_until DATETIME,
  pattern TEXT, -- For indicators: the pattern
  pattern_type TEXT, -- stix, snort, yara, etc.
  
  -- Intelligence value
  tlp_marking TEXT, -- TLP:WHITE, TLP:GREEN, TLP:AMBER, TLP:RED
  severity TEXT CHECK(severity IN ('info', 'low', 'medium', 'high', 'critical')),
  kill_chain_phases TEXT, -- JSON array
  
  -- Source tracking
  taxii_collection_id INTEGER,
  threat_intelligence_feed_id INTEGER, -- Link to existing TI feeds
  source_url TEXT,
  
  -- GRC Integration
  linked_to_risk INTEGER DEFAULT 0,
  risk_id INTEGER,
  reviewed INTEGER DEFAULT 0,
  reviewed_by INTEGER,
  reviewed_at DATETIME,
  
  -- Metadata
  organization_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (taxii_collection_id) REFERENCES taxii_collections(id) ON DELETE SET NULL,
  FOREIGN KEY (threat_intelligence_feed_id) REFERENCES threat_intelligence_feeds(id) ON DELETE SET NULL,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stix_objects_type ON stix_objects(stix_type);
CREATE INDEX IF NOT EXISTS idx_stix_objects_created ON stix_objects(created DESC);
CREATE INDEX IF NOT EXISTS idx_stix_objects_severity ON stix_objects(severity);
CREATE INDEX IF NOT EXISTS idx_stix_objects_collection ON stix_objects(taxii_collection_id);
CREATE INDEX IF NOT EXISTS idx_stix_objects_feed ON stix_objects(threat_intelligence_feed_id);
CREATE INDEX IF NOT EXISTS idx_stix_objects_risk ON stix_objects(risk_id);
CREATE INDEX IF NOT EXISTS idx_stix_objects_org ON stix_objects(organization_id);
CREATE INDEX IF NOT EXISTS idx_stix_objects_reviewed ON stix_objects(reviewed, severity);

-- Full-text search on STIX object content
CREATE VIRTUAL TABLE IF NOT EXISTS stix_objects_fts USING fts5(
  stix_id, name, description, pattern, content=stix_objects, content_rowid=id
);

-- =============================================================================
-- 4. STIX RELATIONSHIPS (STIX 2.1 Relationships)
-- =============================================================================
CREATE TABLE IF NOT EXISTS stix_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stix_id TEXT NOT NULL UNIQUE, -- relationship--uuid
  relationship_type TEXT NOT NULL, -- uses, indicates, targets, attributed-to, etc.
  
  -- Source and Target
  source_ref TEXT NOT NULL, -- STIX ID of source object
  target_ref TEXT NOT NULL, -- STIX ID of target object
  source_object_id INTEGER, -- Internal ID (for joins)
  target_object_id INTEGER, -- Internal ID (for joins)
  
  -- Relationship data
  description TEXT,
  created DATETIME NOT NULL,
  modified DATETIME NOT NULL,
  
  -- Full STIX relationship (JSON)
  stix_relationship TEXT NOT NULL,
  
  -- Metadata
  organization_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (source_object_id) REFERENCES stix_objects(id) ON DELETE CASCADE,
  FOREIGN KEY (target_object_id) REFERENCES stix_objects(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stix_rel_type ON stix_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_stix_rel_source ON stix_relationships(source_ref);
CREATE INDEX IF NOT EXISTS idx_stix_rel_target ON stix_relationships(target_ref);
CREATE INDEX IF NOT EXISTS idx_stix_rel_objects ON stix_relationships(source_object_id, target_object_id);
CREATE INDEX IF NOT EXISTS idx_stix_rel_org ON stix_relationships(organization_id);

-- =============================================================================
-- 5. IOC (Indicators of Compromise) - Extracted from STIX
-- =============================================================================
CREATE TABLE IF NOT EXISTS iocs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ioc_type TEXT NOT NULL CHECK(ioc_type IN ('ip', 'domain', 'url', 'file_hash', 'email', 'registry_key', 'mutex', 'process', 'certificate')),
  ioc_value TEXT NOT NULL,
  
  -- Context
  description TEXT,
  threat_type TEXT, -- malware, phishing, c2, exploit, etc.
  confidence INTEGER DEFAULT 50 CHECK(confidence >= 0 AND confidence <= 100),
  severity TEXT DEFAULT 'medium' CHECK(severity IN ('info', 'low', 'medium', 'high', 'critical')),
  
  -- Temporal
  first_seen DATETIME NOT NULL,
  last_seen DATETIME NOT NULL,
  valid_until DATETIME,
  
  -- Source
  stix_object_id INTEGER, -- Link to STIX indicator
  source TEXT, -- osint, commercial, internal, community
  source_url TEXT,
  tags TEXT, -- JSON array
  
  -- Status
  is_active INTEGER DEFAULT 1,
  false_positive INTEGER DEFAULT 0,
  whitelisted INTEGER DEFAULT 0,
  whitelist_reason TEXT,
  
  -- Detection
  detection_count INTEGER DEFAULT 0,
  last_detection_at DATETIME,
  
  -- Metadata
  organization_id INTEGER DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (stix_object_id) REFERENCES stix_objects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_iocs_type ON iocs(ioc_type);
CREATE INDEX IF NOT EXISTS idx_iocs_value ON iocs(ioc_value);
CREATE INDEX IF NOT EXISTS idx_iocs_severity ON iocs(severity);
CREATE INDEX IF NOT EXISTS idx_iocs_active ON iocs(is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_iocs_stix ON iocs(stix_object_id);
CREATE INDEX IF NOT EXISTS idx_iocs_org ON iocs(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_iocs_unique ON iocs(ioc_type, ioc_value) WHERE is_active = 1;

-- =============================================================================
-- 6. STIX BUNDLES (Collections of STIX objects)
-- =============================================================================
CREATE TABLE IF NOT EXISTS stix_bundles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stix_id TEXT NOT NULL UNIQUE, -- bundle--uuid
  bundle_type TEXT DEFAULT 'bundle',
  
  -- Bundle metadata
  name TEXT,
  description TEXT,
  created DATETIME NOT NULL,
  
  -- Full bundle (JSON)
  stix_bundle TEXT NOT NULL, -- Complete STIX bundle JSON
  
  -- Statistics
  object_count INTEGER DEFAULT 0,
  relationship_count INTEGER DEFAULT 0,
  
  -- Source
  taxii_collection_id INTEGER,
  source_url TEXT,
  
  -- Processing
  processed INTEGER DEFAULT 0,
  processed_at DATETIME,
  processing_errors TEXT, -- JSON array
  
  -- Metadata
  organization_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (taxii_collection_id) REFERENCES taxii_collections(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stix_bundles_processed ON stix_bundles(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_stix_bundles_collection ON stix_bundles(taxii_collection_id);
CREATE INDEX IF NOT EXISTS idx_stix_bundles_org ON stix_bundles(organization_id);

-- =============================================================================
-- SEED DATA - Sample TAXII server and STIX objects
-- =============================================================================

-- Sample public TAXII server (MISP)
INSERT OR IGNORE INTO taxii_servers (
  id, name, api_root_url, is_active, organization_id, created_by
) VALUES (
  1,
  'MISP Public TAXII Server',
  'https://misp-project.org/taxii2/',
  1,
  1,
  1
);

-- Sample STIX Indicator
INSERT OR IGNORE INTO stix_objects (
  stix_id, stix_type, stix_version, name, description,
  created, modified, stix_object, pattern, pattern_type,
  severity, tlp_marking, organization_id
) VALUES (
  'indicator--demo-2024-001',
  'indicator',
  '2.1',
  'Malicious IP - Command and Control',
  'Known C2 server IP address associated with APT campaign',
  '2024-10-20 00:00:00',
  '2024-10-20 00:00:00',
  '{"type":"indicator","spec_version":"2.1","id":"indicator--demo-2024-001","created":"2024-10-20T00:00:00.000Z","modified":"2024-10-20T00:00:00.000Z","name":"Malicious IP - Command and Control","description":"Known C2 server IP address","pattern":"[ipv4-addr:value = ''192.0.2.1'']","pattern_type":"stix","valid_from":"2024-10-20T00:00:00.000Z"}',
  '[ipv4-addr:value = ''192.0.2.1'']',
  'stix',
  'high',
  'TLP:AMBER',
  1
);

-- Sample IOC extracted from STIX
INSERT OR IGNORE INTO iocs (
  ioc_type, ioc_value, description, threat_type,
  confidence, severity, first_seen, last_seen,
  source, stix_object_id, organization_id, created_by
) VALUES (
  'ip',
  '192.0.2.1',
  'Known C2 server IP address associated with APT campaign',
  'c2',
  95,
  'high',
  '2024-10-20 00:00:00',
  '2024-10-25 00:00:00',
  'stix',
  1,
  1,
  1
);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Active High-Confidence IOCs
CREATE VIEW IF NOT EXISTS v_active_high_confidence_iocs AS
SELECT 
  ioc_type,
  ioc_value,
  description,
  threat_type,
  confidence,
  severity,
  source,
  first_seen,
  last_seen,
  detection_count
FROM iocs
WHERE is_active = 1
  AND false_positive = 0
  AND whitelisted = 0
  AND confidence >= 70
  AND (valid_until IS NULL OR valid_until > datetime('now'))
ORDER BY severity DESC, confidence DESC, last_seen DESC;

-- STIX Objects by Type
CREATE VIEW IF NOT EXISTS v_stix_objects_summary AS
SELECT 
  stix_type,
  COUNT(*) as count,
  COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
  COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_count,
  MAX(created) as latest_created,
  COUNT(CASE WHEN reviewed = 1 THEN 1 END) as reviewed_count
FROM stix_objects
GROUP BY stix_type
ORDER BY count DESC;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

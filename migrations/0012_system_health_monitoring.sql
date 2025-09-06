-- System Health Monitoring Tables
-- Creates infrastructure for real-time system health monitoring

-- System Health Metrics Table - Real-time monitoring data
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT NOT NULL, -- 'api_services', 'database', 'security_scan', 'backups'
  metric_type TEXT NOT NULL, -- 'uptime', 'response_time', 'status', 'last_run'
  metric_value TEXT NOT NULL,
  numeric_value REAL DEFAULT 0, -- For calculations (uptime %, response time ms)
  status TEXT DEFAULT 'unknown', -- 'healthy', 'warning', 'critical', 'unknown'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System Health Status Table - Current service status
CREATE TABLE IF NOT EXISTS system_health_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT NOT NULL UNIQUE, -- 'api_services', 'database', 'security_scan', 'backups'
  display_name TEXT NOT NULL, -- 'API Services', 'Database', 'Security Scan', 'Backups'
  status TEXT NOT NULL DEFAULT 'unknown', -- 'operational', 'degraded', 'maintenance', 'offline'
  uptime_percentage REAL DEFAULT 99.9,
  last_check DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_incident DATETIME NULL,
  response_time_ms INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API Performance Metrics - Track actual API response times
CREATE TABLE IF NOT EXISTS api_performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL, -- GET, POST, PUT, DELETE
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  user_id INTEGER NULL,
  ip_address TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Security Scan Results - Track actual security scanning
CREATE TABLE IF NOT EXISTS security_scan_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_type TEXT NOT NULL, -- 'vulnerability', 'malware', 'compliance', 'penetration'
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  findings_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  scan_duration_seconds INTEGER NULL,
  details TEXT NULL -- JSON details of findings
);

-- Backup Operations - Track actual backup operations
CREATE TABLE IF NOT EXISTS backup_operations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_type TEXT NOT NULL, -- 'database', 'files', 'logs', 'full_system'
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  size_bytes INTEGER DEFAULT 0,
  backup_location TEXT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  duration_seconds INTEGER NULL,
  error_message TEXT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_service ON system_health_metrics(service_name, created_at);
CREATE INDEX IF NOT EXISTS idx_system_health_status_service ON system_health_status(service_name);
CREATE INDEX IF NOT EXISTS idx_api_performance_endpoint ON api_performance_metrics(endpoint, created_at);
CREATE INDEX IF NOT EXISTS idx_security_scan_status ON security_scan_results(scan_type, status, completed_at);
CREATE INDEX IF NOT EXISTS idx_backup_operations_type ON backup_operations(backup_type, status, completed_at);

-- Insert initial system health status records
INSERT OR REPLACE INTO system_health_status (service_name, display_name, status, uptime_percentage)
VALUES 
  ('api_services', 'API Services', 'operational', 99.9),
  ('database', 'Database', 'operational', 100.0),
  ('security_scan', 'Security Scan', 'operational', 95.0),
  ('backups', 'Backups', 'operational', 98.5);

-- Insert initial system configuration for health monitoring
INSERT OR REPLACE INTO system_configuration (key, value, description, is_public)
VALUES 
  ('health_check_enabled', 'true', 'Enable system health monitoring', 1),
  ('health_check_interval_minutes', '5', 'Health check interval in minutes', 1),
  ('api_response_threshold_ms', '1000', 'API response time threshold in milliseconds', 1),
  ('backup_frequency_hours', '6', 'Backup frequency in hours', 1),
  ('security_scan_frequency_hours', '24', 'Security scan frequency in hours', 1);

-- Insert sample API performance metrics (last 24 hours)
INSERT INTO api_performance_metrics (endpoint, method, response_time_ms, status_code, created_at)
VALUES 
  ('/api/dashboard/stats', 'GET', 150, 200, datetime('now', '-1 hour')),
  ('/api/risks', 'GET', 200, 200, datetime('now', '-2 hours')),
  ('/api/compliance/score', 'GET', 95, 200, datetime('now', '-3 hours')),
  ('/api/incidents', 'GET', 180, 200, datetime('now', '-4 hours')),
  ('/api/login', 'POST', 300, 200, datetime('now', '-5 hours'));

-- Insert sample security scan results
INSERT INTO security_scan_results (scan_type, status, findings_count, critical_count, high_count, medium_count, low_count, started_at, completed_at, scan_duration_seconds)
VALUES 
  ('vulnerability', 'completed', 12, 0, 2, 5, 5, datetime('now', '-2 hours'), datetime('now', '-1 hour 45 minutes'), 900),
  ('compliance', 'running', 0, 0, 0, 0, 0, datetime('now', '-30 minutes'), NULL, NULL);

-- Insert sample backup operations
INSERT INTO backup_operations (backup_type, status, size_bytes, started_at, completed_at, duration_seconds)
VALUES 
  ('database', 'completed', 52428800, datetime('now', '-6 hours'), datetime('now', '-5 hours 55 minutes'), 300),
  ('files', 'completed', 104857600, datetime('now', '-6 hours 5 minutes'), datetime('now', '-5 hours 50 minutes'), 900);
-- API Management System
-- Comprehensive table to track and manage all backend API endpoints

CREATE TABLE IF NOT EXISTS api_endpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Basic Information
  endpoint_path TEXT NOT NULL UNIQUE,
  http_method TEXT NOT NULL CHECK (http_method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD')),
  route_category TEXT NOT NULL, -- e.g., 'Admin', 'Operations', 'Risk Management', 'Compliance', 'Threats', 'AI Assistant'
  
  -- Description & Documentation
  endpoint_name TEXT NOT NULL,
  description TEXT,
  request_body_schema TEXT, -- JSON schema or description
  response_schema TEXT, -- JSON schema or description
  example_request TEXT,
  example_response TEXT,
  
  -- Status & Configuration
  is_active BOOLEAN DEFAULT 1,
  is_public BOOLEAN DEFAULT 0, -- Public APIs don't require authentication
  requires_auth BOOLEAN DEFAULT 1,
  requires_admin BOOLEAN DEFAULT 0,
  
  -- Rate Limiting & Throttling
  rate_limit_requests INTEGER DEFAULT 100, -- Max requests per minute
  rate_limit_window INTEGER DEFAULT 60, -- Time window in seconds
  
  -- Monitoring & Analytics
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  avg_response_time_ms REAL DEFAULT 0.0,
  last_called_at DATETIME,
  
  -- Performance & Health
  health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'degraded', 'down', 'unknown')),
  health_check_url TEXT,
  last_health_check DATETIME,
  uptime_percentage REAL DEFAULT 100.0,
  
  -- Deprecation & Versioning
  api_version TEXT DEFAULT 'v1',
  is_deprecated BOOLEAN DEFAULT 0,
  deprecation_date DATE,
  replacement_endpoint TEXT,
  
  -- Security & Permissions
  required_permissions TEXT, -- JSON array of permission strings
  allowed_roles TEXT, -- JSON array: ['admin', 'user', 'auditor']
  requires_csrf BOOLEAN DEFAULT 1,
  requires_api_key BOOLEAN DEFAULT 0,
  
  -- Dependencies & Integration
  depends_on_services TEXT, -- JSON array of dependent services/APIs
  integration_type TEXT, -- 'internal', 'external', 'third-party'
  external_service_name TEXT,
  
  -- Metadata & Tracking
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  tags TEXT, -- JSON array for filtering/searching
  notes TEXT,
  
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- API Request Logs (for monitoring and debugging)
CREATE TABLE IF NOT EXISTS api_request_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint_id INTEGER,
  
  -- Request Details
  request_method TEXT NOT NULL,
  request_path TEXT NOT NULL,
  request_headers TEXT, -- JSON
  request_body TEXT,
  query_params TEXT, -- JSON
  
  -- Response Details
  response_status INTEGER,
  response_time_ms REAL,
  response_size_bytes INTEGER,
  error_message TEXT,
  
  -- User & Session
  user_id INTEGER,
  user_ip TEXT,
  user_agent TEXT,
  session_id TEXT,
  
  -- Timestamp
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (endpoint_id) REFERENCES api_endpoints(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- API Health Checks (scheduled health monitoring)
CREATE TABLE IF NOT EXISTS api_health_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint_id INTEGER NOT NULL,
  
  -- Health Check Results
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'timeout', 'error')),
  response_time_ms REAL,
  status_code INTEGER,
  error_message TEXT,
  
  -- Check Details
  check_type TEXT DEFAULT 'automatic', -- 'automatic', 'manual', 'scheduled'
  checked_by INTEGER, -- User who triggered manual check
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (endpoint_id) REFERENCES api_endpoints(id) ON DELETE CASCADE,
  FOREIGN KEY (checked_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_endpoints_path ON api_endpoints(endpoint_path);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_category ON api_endpoints(route_category);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_status ON api_endpoints(is_active, health_status);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_deprecated ON api_endpoints(is_deprecated);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_endpoint ON api_request_logs(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_timestamp ON api_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_health_checks_endpoint ON api_health_checks(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_api_health_checks_timestamp ON api_health_checks(checked_at);

-- Seed data with existing API endpoints (examples)
INSERT OR IGNORE INTO api_endpoints (endpoint_path, http_method, route_category, endpoint_name, description, requires_auth, requires_admin) VALUES
-- Admin APIs
('/admin/api/users/list', 'GET', 'Admin', 'List All Users', 'Retrieve list of all system users with filtering and pagination', 1, 1),
('/admin/api/users/create', 'POST', 'Admin', 'Create User', 'Create a new user account', 1, 1),
('/admin/api/users/update', 'PUT', 'Admin', 'Update User', 'Update user account details', 1, 1),
('/admin/api/users/delete', 'DELETE', 'Admin', 'Delete User', 'Delete user account from system', 1, 1),

-- Risk Management APIs
('/risks/api/list', 'GET', 'Risk Management', 'List Risks', 'Retrieve all risk assessments', 1, 0),
('/risks/api/create', 'POST', 'Risk Management', 'Create Risk', 'Create new risk assessment', 1, 0),
('/risks/api/update', 'PUT', 'Risk Management', 'Update Risk', 'Update existing risk assessment', 1, 0),
('/risks/api/delete', 'DELETE', 'Risk Management', 'Delete Risk', 'Delete risk assessment', 1, 0),

-- Operations APIs
('/operations/api/services/list', 'GET', 'Operations', 'List Services', 'Retrieve all operational services', 1, 0),
('/operations/api/services/list-for-risk', 'GET', 'Operations', 'List Services for Risk', 'Retrieve active services for risk association', 1, 0),
('/operations/api/business-units/list', 'GET', 'Operations', 'List Business Units', 'Retrieve all business units', 1, 0),

-- Compliance APIs
('/compliance/api/frameworks', 'GET', 'Compliance', 'List Frameworks', 'Retrieve compliance frameworks', 1, 0),
('/compliance/api/controls', 'GET', 'Compliance', 'List Controls', 'Retrieve compliance controls', 1, 0),

-- Threat Intelligence APIs
('/threats/api/feeds', 'GET', 'Threat Intelligence', 'List Threat Feeds', 'Retrieve threat intelligence feeds', 1, 0),
('/threats/api/incidents', 'GET', 'Threat Intelligence', 'List Incidents', 'Retrieve security incidents', 1, 0),

-- AI Assistant APIs
('/ai/chat', 'POST', 'AI Assistant', 'AI Chat', 'Send message to AI assistant', 1, 0),
('/ai/analyze', 'POST', 'AI Assistant', 'AI Analysis', 'Request AI analysis of data', 1, 0);

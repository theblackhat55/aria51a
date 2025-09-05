// DMT Risk Assessment System v2.0 - TypeScript Types
// Comprehensive type definitions for GRC platform

export interface CloudflareBindings {
  DB: D1Database;
  AI: Ai;
  R2: R2Bucket;
  // Secure AI API keys (server-side only)
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;  
  GEMINI_API_KEY?: string;
}

// User Management
export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  department?: string;
  job_title?: string;
  phone?: string;
  role: 'admin' | 'risk_manager' | 'compliance_officer' | 'auditor' | 'user';
  is_active: boolean;
  last_login?: string;
  mfa_enabled: boolean;
  mfa_secret?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  department?: string;
  job_title?: string;
  phone?: string;
  role?: string;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash' | 'mfa_secret'>;
  token: string;
  expires_at: string;
}

// Organization Management
export interface Organization {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  org_type: 'division' | 'department' | 'subsidiary' | 'business_unit';
  contact_email?: string;
  risk_tolerance: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

// Risk Management
export interface RiskCategory {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  category_type: 'strategic' | 'operational' | 'financial' | 'compliance' | 'technology' | 'esg';
  risk_appetite: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface Risk {
  id: number;
  risk_id: string;
  title: string;
  description: string;
  category_id: number;
  organization_id: number;
  owner_id: number;
  status: 'active' | 'mitigated' | 'closed' | 'monitoring';
  risk_type: 'inherent' | 'residual';
  
  // Risk Scoring
  probability: number; // 1-5
  impact: number; // 1-5
  risk_score: number; // calculated
  ai_risk_score?: number;
  
  // Risk Details
  root_cause?: string;
  potential_impact?: string;
  existing_controls?: string;
  
  // Risk Treatment
  treatment_strategy: 'accept' | 'avoid' | 'mitigate' | 'transfer';
  mitigation_plan?: string;
  target_probability?: number;
  target_impact?: number;
  target_risk_score?: number;
  
  // Dates
  identified_date?: string;
  last_reviewed?: string;
  next_review_date?: string;
  escalated_at?: string;
  resolved_at?: string;
  
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRiskRequest {
  title: string;
  description: string;
  category_id: number;
  organization_id: number;
  owner_id: number;
  probability: number;
  impact: number;
  root_cause?: string;
  potential_impact?: string;
  treatment_strategy: string;
  mitigation_plan?: string;
  identified_date?: string;
  next_review_date?: string;
}

// Control Management
export interface Control {
  id: number;
  control_id: string;
  name: string;
  description: string;
  control_type: 'preventive' | 'detective' | 'corrective' | 'compensating';
  control_category: 'manual' | 'automated' | 'hybrid';
  framework: string;
  control_family: string;
  control_objective?: string;
  control_procedure?: string;
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  automation_level: 'manual' | 'semi_automated' | 'fully_automated';
  owner_id: number;
  organization_id: number;
  design_effectiveness: 'effective' | 'partially_effective' | 'ineffective';
  operating_effectiveness: 'effective' | 'partially_effective' | 'ineffective' | 'not_tested';
  status: 'active' | 'inactive' | 'retired';
  implementation_date?: string;
  last_tested?: string;
  next_test_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateControlRequest {
  name: string;
  description: string;
  control_type: string;
  control_category: string;
  framework: string;
  control_family: string;
  control_objective?: string;
  frequency: string;
  automation_level: string;
  owner_id: number;
  organization_id: number;
}

// Compliance Management
export interface ComplianceRequirement {
  id: number;
  requirement_id: string;
  title: string;
  description: string;
  framework: string;
  regulation_reference?: string;
  requirement_type: 'mandatory' | 'recommended' | 'best_practice';
  applicable_to: string;
  jurisdiction: string;
  implementation_guidance?: string;
  due_date?: string;
  compliance_status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_assessed';
  created_at: string;
  updated_at: string;
}

export interface ComplianceAssessment {
  id: number;
  assessment_id: string;
  title: string;
  description?: string;
  framework: string;
  assessment_type: 'self_assessment' | 'external_audit' | 'regulatory_exam';
  scope?: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'archived';
  overall_rating?: string;
  lead_assessor_id?: number;
  organization_id: number;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface AssessmentFinding {
  id: number;
  finding_id: string;
  assessment_id: number;
  requirement_id?: number;
  control_id?: number;
  title: string;
  description: string;
  finding_type: 'gap' | 'deficiency' | 'observation' | 'best_practice';
  severity: 'critical' | 'high' | 'medium' | 'low';
  likelihood?: string;
  impact?: string;
  risk_rating?: string;
  recommendation?: string;
  management_response?: string;
  agreed_action?: string;
  responsible_party_id?: number;
  target_completion_date?: string;
  actual_completion_date?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

// Incident Management
export interface Incident {
  id: number;
  incident_id: string;
  title: string;
  description: string;
  incident_type: 'security' | 'operational' | 'compliance' | 'data_breach';
  severity: 'critical' | 'high' | 'medium' | 'low';
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  affected_systems?: string;
  affected_data?: string;
  business_impact?: string;
  financial_impact?: number;
  status: 'new' | 'investigating' | 'containment' | 'eradication' | 'recovery' | 'closed';
  assigned_to?: number;
  response_team?: string;
  detected_at?: string;
  reported_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  closed_at?: string;
  root_cause?: string;
  contributing_factors?: string;
  lessons_learned?: string;
  requires_notification: boolean;
  notification_deadline?: string;
  notification_status?: 'not_required' | 'pending' | 'submitted' | 'acknowledged';
  created_by: number;
  created_at: string;
  updated_at: string;
}

// ESG Management removed as per user request

// Workflow Management
export interface Workflow {
  id: number;
  workflow_id: string;
  name: string;
  description?: string;
  trigger_type: 'manual' | 'scheduled' | 'event_driven';
  trigger_config?: string; // JSON
  workflow_steps?: string; // JSON
  is_active: boolean;
  version: number;
  created_by: number;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

// AI Insights
export interface AIInsight {
  id: number;
  insight_type: 'risk_prediction' | 'anomaly_detection' | 'trend_analysis';
  entity_type: 'risk' | 'control' | 'compliance';
  resource_id?: number;
  confidence_score: number;
  insight_data?: string; // JSON
  recommendation?: string;
  model_version?: string;
  algorithm_used?: string;
  created_at: string;
  expires_at?: string;
}

// Dashboard and Analytics
export interface DashboardData {
  total_risks: number;
  high_risks: number;
  open_findings: number;
  compliance_score: number;
  risk_trend: { date: string; score: number }[];
  top_risks: Risk[];
  recent_incidents: Incident[];
  control_effectiveness: { framework: string; effective: number; total: number }[];
  esg_summary: { type: string; score: number }[];
}

export interface RiskHeatmapData {
  category: string;
  probability: number;
  impact: number;
  count: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filter?: string;
}

// Document Management
export interface Document {
  id: number;
  document_id: string;
  file_name: string;
  original_file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_hash: string;
  uploaded_by: number;
  title?: string;
  description?: string;
  document_type: 'policy' | 'procedure' | 'evidence' | 'report' | 'other';
  tags?: string; // JSON array
  version: string;
  visibility: 'public' | 'private' | 'restricted';
  access_permissions?: string; // JSON array
  related_entity_type?: 'risk' | 'control' | 'assessment' | 'incident';
  related_entity_id?: number;
  upload_date: string;
  last_accessed?: string;
  download_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentRequest {
  title?: string;
  description?: string;
  document_type: string;
  tags?: string[];
  version?: string;
  visibility?: string;
  access_permissions?: string[];
  related_entity_type?: string;
  related_entity_id?: number;
}

export interface DocumentUploadResponse {
  document_id: string;
  file_name: string;
  file_size: number;
  upload_url?: string;
  download_url?: string;
}

// Utility Types
export type WithId<T> = T & { id: number };
export type CreateType<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
export type UpdateType<T> = Partial<CreateType<T>>;
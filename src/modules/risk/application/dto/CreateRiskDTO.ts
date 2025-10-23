/**
 * CreateRiskDTO - Data Transfer Object for creating a new risk
 * Used in the application layer to pass data between layers
 */

export interface CreateRiskDTO {
  // Required fields
  riskId: string; // Business identifier (e.g., "RISK-001")
  title: string;
  description: string;
  category: string; // Category name or type
  probability: number; // 1-5
  impact: number; // 1-5
  
  // Ownership & organization
  organizationId: number;
  ownerId: number;
  createdBy: number;
  
  // Optional fields
  riskType?: string; // 'business', 'technical', 'strategic', etc.
  status?: string; // Defaults to 'active' if not provided
  mitigationPlan?: string;
  contingencyPlan?: string;
  reviewDate?: string; // ISO date string
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Validation rules for CreateRiskDTO
 */
export const CreateRiskDTOValidation = {
  riskId: {
    required: true,
    pattern: /^[A-Z]+-\d+$/, // e.g., RISK-001
    message: 'Risk ID must be in format: PREFIX-NUMBER (e.g., RISK-001)'
  },
  title: {
    required: true,
    minLength: 1,
    maxLength: 200,
    message: 'Title is required and must be 200 characters or less'
  },
  description: {
    required: true,
    minLength: 1,
    maxLength: 2000,
    message: 'Description is required and must be 2000 characters or less'
  },
  category: {
    required: true,
    enum: [
      'strategic', 'operational', 'financial', 'compliance', 'reputational',
      'technology', 'cybersecurity', 'environmental', 'legal', 'human_resources',
      'supply_chain', 'market', 'credit', 'liquidity', 'other'
    ],
    message: 'Category must be a valid risk category'
  },
  probability: {
    required: true,
    min: 1,
    max: 5,
    type: 'number',
    message: 'Probability must be a number between 1 and 5'
  },
  impact: {
    required: true,
    min: 1,
    max: 5,
    type: 'number',
    message: 'Impact must be a number between 1 and 5'
  },
  organizationId: {
    required: true,
    type: 'number',
    min: 1,
    message: 'Organization ID is required and must be a positive number'
  },
  ownerId: {
    required: true,
    type: 'number',
    min: 1,
    message: 'Owner ID is required and must be a positive number'
  },
  createdBy: {
    required: true,
    type: 'number',
    min: 1,
    message: 'Created By is required and must be a positive number'
  },
  riskType: {
    required: false,
    enum: ['business', 'technical', 'strategic', 'operational', 'compliance'],
    message: 'Risk type must be one of: business, technical, strategic, operational, compliance'
  },
  status: {
    required: false,
    enum: ['active', 'mitigated', 'accepted', 'transferred', 'avoided', 'closed', 'monitoring'],
    message: 'Status must be a valid risk status'
  },
  mitigationPlan: {
    required: false,
    maxLength: 5000,
    message: 'Mitigation plan must be 5000 characters or less'
  },
  contingencyPlan: {
    required: false,
    maxLength: 5000,
    message: 'Contingency plan must be 5000 characters or less'
  },
  reviewDate: {
    required: false,
    type: 'date',
    message: 'Review date must be a valid ISO date string'
  },
  tags: {
    required: false,
    type: 'array',
    message: 'Tags must be an array of strings'
  }
};

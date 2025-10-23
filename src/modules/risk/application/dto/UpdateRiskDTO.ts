/**
 * UpdateRiskDTO - Data Transfer Object for updating an existing risk
 * All fields are optional (partial update)
 */

export interface UpdateRiskDTO {
  // Identification (required for routing, not for update)
  id?: number; // Database ID
  riskId?: string; // Business identifier
  
  // Fields that can be updated
  title?: string;
  description?: string;
  category?: string;
  probability?: number; // 1-5
  impact?: number; // 1-5
  status?: string;
  
  // Ownership
  ownerId?: number;
  
  // Risk type
  riskType?: string;
  
  // Plans
  mitigationPlan?: string;
  contingencyPlan?: string;
  
  // Review
  reviewDate?: string; // ISO date string
  
  // Tags & metadata
  tags?: string[];
  metadata?: Record<string, any>;
  
  // Update tracking
  updatedBy?: number;
  updateReason?: string;
}

/**
 * Validation rules for UpdateRiskDTO
 */
export const UpdateRiskDTOValidation = {
  title: {
    required: false,
    minLength: 1,
    maxLength: 200,
    message: 'Title must be 200 characters or less'
  },
  description: {
    required: false,
    minLength: 1,
    maxLength: 2000,
    message: 'Description must be 2000 characters or less'
  },
  category: {
    required: false,
    enum: [
      'strategic', 'operational', 'financial', 'compliance', 'reputational',
      'technology', 'cybersecurity', 'environmental', 'legal', 'human_resources',
      'supply_chain', 'market', 'credit', 'liquidity', 'other'
    ],
    message: 'Category must be a valid risk category'
  },
  probability: {
    required: false,
    min: 1,
    max: 5,
    type: 'number',
    message: 'Probability must be a number between 1 and 5'
  },
  impact: {
    required: false,
    min: 1,
    max: 5,
    type: 'number',
    message: 'Impact must be a number between 1 and 5'
  },
  status: {
    required: false,
    enum: ['active', 'mitigated', 'accepted', 'transferred', 'avoided', 'closed', 'monitoring'],
    message: 'Status must be a valid risk status'
  },
  ownerId: {
    required: false,
    type: 'number',
    min: 1,
    message: 'Owner ID must be a positive number'
  },
  riskType: {
    required: false,
    enum: ['business', 'technical', 'strategic', 'operational', 'compliance'],
    message: 'Risk type must be one of: business, technical, strategic, operational, compliance'
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
  },
  updatedBy: {
    required: false,
    type: 'number',
    min: 1,
    message: 'Updated By must be a positive number'
  }
};

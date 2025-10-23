/**
 * NIST Cybersecurity Framework (CSF) Resource
 * 
 * Provides comprehensive reference data for NIST CSF 2.0 framework
 * including functions, categories, and subcategories
 */

import type { MCPResource, MCPEnvironment } from '../types/mcp-types';

export const nistCsfResource: MCPResource = {
  uri: 'compliance://nist-csf',
  name: 'NIST Cybersecurity Framework',
  description: 'Complete NIST CSF 2.0 framework reference with functions, categories, and subcategories',
  mimeType: 'application/json',
  
  async fetch(env: MCPEnvironment): Promise<any> {
    return {
      framework: {
        name: 'NIST Cybersecurity Framework',
        version: '2.0',
        published: '2024-02-26',
        description: 'A framework for improving critical infrastructure cybersecurity',
        organization: 'National Institute of Standards and Technology (NIST)',
        scope: 'Cybersecurity risk management across all sectors'
      },
      
      functions: [
        {
          id: 'GV',
          name: 'Govern',
          description: 'Establish and monitor the organization\'s cybersecurity risk management strategy, expectations, and policy',
          purpose: 'Organizational context, risk management strategy, roles & responsibilities, policies, oversight',
          categories: [
            {
              id: 'GV.OC',
              name: 'Organizational Context',
              description: 'Understanding organizational mission, stakeholder expectations, and legal/regulatory requirements'
            },
            {
              id: 'GV.RM',
              name: 'Risk Management Strategy',
              description: 'Organization\'s priorities, constraints, risk tolerance, and assumptions'
            },
            {
              id: 'GV.RR',
              name: 'Roles, Responsibilities, and Authorities',
              description: 'Cybersecurity roles, responsibilities, and authorities are coordinated'
            },
            {
              id: 'GV.PO',
              name: 'Policy',
              description: 'Organizational cybersecurity policy is established, communicated, and enforced'
            },
            {
              id: 'GV.OV',
              name: 'Oversight',
              description: 'Results of risk management activities are used to inform decisions'
            },
            {
              id: 'GV.SC',
              name: 'Cybersecurity Supply Chain Risk Management',
              description: 'Cyber supply chain risk management processes are identified, established, and managed'
            }
          ]
        },
        {
          id: 'ID',
          name: 'Identify',
          description: 'Understand the organization\'s current cybersecurity risks',
          purpose: 'Asset management, risk assessment, improvement',
          categories: [
            {
              id: 'ID.AM',
              name: 'Asset Management',
              description: 'Assets (devices, data, personnel, systems, facilities) are identified and managed'
            },
            {
              id: 'ID.RA',
              name: 'Risk Assessment',
              description: 'Organization understands cybersecurity risk to operations, assets, and individuals'
            },
            {
              id: 'ID.IM',
              name: 'Improvement',
              description: 'Improvements to organizational cybersecurity risk management are identified'
            }
          ]
        },
        {
          id: 'PR',
          name: 'Protect',
          description: 'Use safeguards to manage cybersecurity risks',
          purpose: 'Identity management, awareness training, data security, platform security, technology infrastructure',
          categories: [
            {
              id: 'PR.AA',
              name: 'Identity Management, Authentication and Access Control',
              description: 'Access to physical and logical assets is limited to authorized users, services, and hardware'
            },
            {
              id: 'PR.AT',
              name: 'Awareness and Training',
              description: 'Organization\'s personnel are provided with cybersecurity awareness and training'
            },
            {
              id: 'PR.DS',
              name: 'Data Security',
              description: 'Data are managed consistent with organizational risk strategy'
            },
            {
              id: 'PR.PS',
              name: 'Platform Security',
              description: 'Organization\'s technology infrastructure is managed to protect against cybersecurity events'
            },
            {
              id: 'PR.IR',
              name: 'Technology Infrastructure Resilience',
              description: 'Security architectures are managed to ensure resilience requirements'
            }
          ]
        },
        {
          id: 'DE',
          name: 'Detect',
          description: 'Find and analyze possible cybersecurity events',
          purpose: 'Continuous monitoring, adverse event analysis',
          categories: [
            {
              id: 'DE.CM',
              name: 'Continuous Monitoring',
              description: 'Assets are monitored to find anomalies and indicators of cybersecurity events'
            },
            {
              id: 'DE.AE',
              name: 'Adverse Event Analysis',
              description: 'Anomalies and events are analyzed to understand attack patterns and impacts'
            }
          ]
        },
        {
          id: 'RS',
          name: 'Respond',
          description: 'Take action regarding a detected cybersecurity incident',
          purpose: 'Incident management, analysis, mitigation, reporting, communication',
          categories: [
            {
              id: 'RS.MA',
              name: 'Incident Management',
              description: 'Responses to detected cybersecurity incidents are managed'
            },
            {
              id: 'RS.AN',
              name: 'Incident Analysis',
              description: 'Investigations are conducted to ensure effective response and recovery'
            },
            {
              id: 'RS.MI',
              name: 'Incident Mitigation',
              description: 'Activities are performed to prevent expansion of events and mitigate impacts'
            },
            {
              id: 'RS.RP',
              name: 'Incident Reporting',
              description: 'Response activities are coordinated with internal and external stakeholders'
            },
            {
              id: 'RS.CO',
              name: 'Incident Communication',
              description: 'Response activities are coordinated with internal and external stakeholders'
            }
          ]
        },
        {
          id: 'RC',
          name: 'Recover',
          description: 'Restore assets and operations that were affected by a cybersecurity incident',
          purpose: 'Incident recovery planning, improvements, communications',
          categories: [
            {
              id: 'RC.RP',
              name: 'Incident Recovery Plan Execution',
              description: 'Restoration activities are performed to ensure operational availability'
            },
            {
              id: 'RC.CO',
              name: 'Incident Recovery Communication',
              description: 'Recovery activities are coordinated with internal and external parties'
            },
            {
              id: 'RC.IM',
              name: 'Incident Recovery Improvements',
              description: 'Recovery planning and processes are improved by incorporating lessons learned'
            }
          ]
        }
      ],
      
      implementationTiers: [
        {
          tier: 1,
          name: 'Partial',
          description: 'Limited awareness, ad hoc risk management, irregular collaboration'
        },
        {
          tier: 2,
          name: 'Risk Informed',
          description: 'Risk management practices approved but not organization-wide'
        },
        {
          tier: 3,
          name: 'Repeatable',
          description: 'Formal policies, regular updates, organization-wide approach'
        },
        {
          tier: 4,
          name: 'Adaptive',
          description: 'Adapts cybersecurity practices based on continuous learning'
        }
      ],
      
      profiles: {
        description: 'Organizations can create Current and Target Profiles to compare their cybersecurity posture',
        currentProfile: 'Represents the current state of cybersecurity activities',
        targetProfile: 'Represents the desired state of cybersecurity activities',
        gapAnalysis: 'Comparison of Current vs Target profiles to identify improvement opportunities'
      },
      
      usage: {
        assessment: 'Evaluate current cybersecurity practices against framework categories',
        prioritization: 'Identify high-priority improvements based on risk tolerance and business needs',
        communication: 'Facilitate communication about cybersecurity with stakeholders',
        procurement: 'Inform vendor risk management and supply chain security'
      },
      
      metadata: {
        source: 'https://www.nist.gov/cyberframework',
        lastUpdated: '2024-02-26',
        applicableSectors: 'All critical infrastructure sectors',
        relatedStandards: ['ISO 27001', 'CIS Controls', 'COBIT', 'PCI DSS']
      }
    };
  }
};

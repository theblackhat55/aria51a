/**
 * ISO/IEC 27001:2022 Resource
 * 
 * Provides comprehensive reference data for ISO 27001:2022 standard
 * including Annex A controls organized by themes
 */

import type { MCPResource, MCPEnvironment } from '../types/mcp-types';

export const iso27001Resource: MCPResource = {
  uri: 'compliance://iso-27001',
  name: 'ISO/IEC 27001:2022',
  description: 'Complete ISO 27001:2022 standard reference with Annex A controls organized by themes',
  mimeType: 'application/json',
  
  async fetch(env: MCPEnvironment): Promise<any> {
    return {
      framework: {
        name: 'ISO/IEC 27001:2022',
        version: '2022',
        published: '2022-10-25',
        description: 'Information Security Management System (ISMS) Requirements',
        organization: 'International Organization for Standardization (ISO)',
        scope: 'Requirements for establishing, implementing, maintaining and continually improving an ISMS'
      },
      
      clauses: [
        {
          id: 'Clause 4',
          name: 'Context of the Organization',
          description: 'Understanding the organization and its context, stakeholders, and ISMS scope'
        },
        {
          id: 'Clause 5',
          name: 'Leadership',
          description: 'Leadership and commitment, policy, organizational roles, responsibilities and authorities'
        },
        {
          id: 'Clause 6',
          name: 'Planning',
          description: 'Actions to address risks and opportunities, information security objectives and planning'
        },
        {
          id: 'Clause 7',
          name: 'Support',
          description: 'Resources, competence, awareness, communication, and documented information'
        },
        {
          id: 'Clause 8',
          name: 'Operation',
          description: 'Operational planning and control, information security risk assessment and treatment'
        },
        {
          id: 'Clause 9',
          name: 'Performance Evaluation',
          description: 'Monitoring, measurement, analysis, evaluation, internal audit, and management review'
        },
        {
          id: 'Clause 10',
          name: 'Improvement',
          description: 'Nonconformity, corrective action, and continual improvement'
        }
      ],
      
      annexAControls: {
        totalControls: 93,
        themes: [
          {
            id: 'A.5',
            name: 'Organizational Controls',
            controlCount: 37,
            description: 'Controls related to organizational policies, responsibilities, and procedures',
            controls: [
              { id: 'A.5.1', name: 'Policies for information security', type: 'Organizational' },
              { id: 'A.5.2', name: 'Information security roles and responsibilities', type: 'Organizational' },
              { id: 'A.5.3', name: 'Segregation of duties', type: 'Organizational' },
              { id: 'A.5.4', name: 'Management responsibilities', type: 'Organizational' },
              { id: 'A.5.5', name: 'Contact with authorities', type: 'Organizational' },
              { id: 'A.5.6', name: 'Contact with special interest groups', type: 'Organizational' },
              { id: 'A.5.7', name: 'Threat intelligence', type: 'Organizational' },
              { id: 'A.5.8', name: 'Information security in project management', type: 'Organizational' },
              { id: 'A.5.9', name: 'Inventory of information and other associated assets', type: 'Organizational' },
              { id: 'A.5.10', name: 'Acceptable use of information and other associated assets', type: 'Organizational' },
              { id: 'A.5.11', name: 'Return of assets', type: 'Organizational' },
              { id: 'A.5.12', name: 'Classification of information', type: 'Organizational' },
              { id: 'A.5.13', name: 'Labelling of information', type: 'Organizational' },
              { id: 'A.5.14', name: 'Information transfer', type: 'Organizational' },
              { id: 'A.5.15', name: 'Access control', type: 'Organizational' },
              { id: 'A.5.16', name: 'Identity management', type: 'Organizational' },
              { id: 'A.5.17', name: 'Authentication information', type: 'Organizational' },
              { id: 'A.5.18', name: 'Access rights', type: 'Organizational' },
              { id: 'A.5.19', name: 'Information security in supplier relationships', type: 'Organizational' },
              { id: 'A.5.20', name: 'Addressing information security within supplier agreements', type: 'Organizational' },
              { id: 'A.5.21', name: 'Managing information security in the ICT supply chain', type: 'Organizational' },
              { id: 'A.5.22', name: 'Monitoring, review and change management of supplier services', type: 'Organizational' },
              { id: 'A.5.23', name: 'Information security for use of cloud services', type: 'Organizational' },
              { id: 'A.5.24', name: 'Information security incident management planning and preparation', type: 'Organizational' },
              { id: 'A.5.25', name: 'Assessment and decision on information security events', type: 'Organizational' },
              { id: 'A.5.26', name: 'Response to information security incidents', type: 'Organizational' },
              { id: 'A.5.27', name: 'Learning from information security incidents', type: 'Organizational' },
              { id: 'A.5.28', name: 'Collection of evidence', type: 'Organizational' },
              { id: 'A.5.29', name: 'Information security during disruption', type: 'Organizational' },
              { id: 'A.5.30', name: 'ICT readiness for business continuity', type: 'Organizational' },
              { id: 'A.5.31', name: 'Legal, statutory, regulatory and contractual requirements', type: 'Organizational' },
              { id: 'A.5.32', name: 'Intellectual property rights', type: 'Organizational' },
              { id: 'A.5.33', name: 'Protection of records', type: 'Organizational' },
              { id: 'A.5.34', name: 'Privacy and protection of PII', type: 'Organizational' },
              { id: 'A.5.35', name: 'Independent review of information security', type: 'Organizational' },
              { id: 'A.5.36', name: 'Compliance with policies, rules and standards for information security', type: 'Organizational' },
              { id: 'A.5.37', name: 'Documented operating procedures', type: 'Organizational' }
            ]
          },
          {
            id: 'A.6',
            name: 'People Controls',
            controlCount: 8,
            description: 'Controls related to personnel security and human resources',
            controls: [
              { id: 'A.6.1', name: 'Screening', type: 'People' },
              { id: 'A.6.2', name: 'Terms and conditions of employment', type: 'People' },
              { id: 'A.6.3', name: 'Information security awareness, education and training', type: 'People' },
              { id: 'A.6.4', name: 'Disciplinary process', type: 'People' },
              { id: 'A.6.5', name: 'Responsibilities after termination or change of employment', type: 'People' },
              { id: 'A.6.6', name: 'Confidentiality or non-disclosure agreements', type: 'People' },
              { id: 'A.6.7', name: 'Remote working', type: 'People' },
              { id: 'A.6.8', name: 'Information security event reporting', type: 'People' }
            ]
          },
          {
            id: 'A.7',
            name: 'Physical Controls',
            controlCount: 14,
            description: 'Controls related to physical and environmental security',
            controls: [
              { id: 'A.7.1', name: 'Physical security perimeters', type: 'Physical' },
              { id: 'A.7.2', name: 'Physical entry', type: 'Physical' },
              { id: 'A.7.3', name: 'Securing offices, rooms and facilities', type: 'Physical' },
              { id: 'A.7.4', name: 'Physical security monitoring', type: 'Physical' },
              { id: 'A.7.5', name: 'Protecting against physical and environmental threats', type: 'Physical' },
              { id: 'A.7.6', name: 'Working in secure areas', type: 'Physical' },
              { id: 'A.7.7', name: 'Clear desk and clear screen', type: 'Physical' },
              { id: 'A.7.8', name: 'Equipment siting and protection', type: 'Physical' },
              { id: 'A.7.9', name: 'Security of assets off-premises', type: 'Physical' },
              { id: 'A.7.10', name: 'Storage media', type: 'Physical' },
              { id: 'A.7.11', name: 'Supporting utilities', type: 'Physical' },
              { id: 'A.7.12', name: 'Cabling security', type: 'Physical' },
              { id: 'A.7.13', name: 'Equipment maintenance', type: 'Physical' },
              { id: 'A.7.14', name: 'Secure disposal or re-use of equipment', type: 'Physical' }
            ]
          },
          {
            id: 'A.8',
            name: 'Technological Controls',
            controlCount: 34,
            description: 'Controls related to technical security measures and IT systems',
            controls: [
              { id: 'A.8.1', name: 'User endpoint devices', type: 'Technological' },
              { id: 'A.8.2', name: 'Privileged access rights', type: 'Technological' },
              { id: 'A.8.3', name: 'Information access restriction', type: 'Technological' },
              { id: 'A.8.4', name: 'Access to source code', type: 'Technological' },
              { id: 'A.8.5', name: 'Secure authentication', type: 'Technological' },
              { id: 'A.8.6', name: 'Capacity management', type: 'Technological' },
              { id: 'A.8.7', name: 'Protection against malware', type: 'Technological' },
              { id: 'A.8.8', name: 'Management of technical vulnerabilities', type: 'Technological' },
              { id: 'A.8.9', name: 'Configuration management', type: 'Technological' },
              { id: 'A.8.10', name: 'Information deletion', type: 'Technological' },
              { id: 'A.8.11', name: 'Data masking', type: 'Technological' },
              { id: 'A.8.12', name: 'Data leakage prevention', type: 'Technological' },
              { id: 'A.8.13', name: 'Information backup', type: 'Technological' },
              { id: 'A.8.14', name: 'Redundancy of information processing facilities', type: 'Technological' },
              { id: 'A.8.15', name: 'Logging', type: 'Technological' },
              { id: 'A.8.16', name: 'Monitoring activities', type: 'Technological' },
              { id: 'A.8.17', name: 'Clock synchronization', type: 'Technological' },
              { id: 'A.8.18', name: 'Use of privileged utility programs', type: 'Technological' },
              { id: 'A.8.19', name: 'Installation of software on operational systems', type: 'Technological' },
              { id: 'A.8.20', name: 'Networks security', type: 'Technological' },
              { id: 'A.8.21', name: 'Security of network services', type: 'Technological' },
              { id: 'A.8.22', name: 'Segregation of networks', type: 'Technological' },
              { id: 'A.8.23', name: 'Web filtering', type: 'Technological' },
              { id: 'A.8.24', name: 'Use of cryptography', type: 'Technological' },
              { id: 'A.8.25', name: 'Secure development life cycle', type: 'Technological' },
              { id: 'A.8.26', name: 'Application security requirements', type: 'Technological' },
              { id: 'A.8.27', name: 'Secure system architecture and engineering principles', type: 'Technological' },
              { id: 'A.8.28', name: 'Secure coding', type: 'Technological' },
              { id: 'A.8.29', name: 'Security testing in development and acceptance', type: 'Technological' },
              { id: 'A.8.30', name: 'Outsourced development', type: 'Technological' },
              { id: 'A.8.31', name: 'Separation of development, test and production environments', type: 'Technological' },
              { id: 'A.8.32', name: 'Change management', type: 'Technological' },
              { id: 'A.8.33', name: 'Test information', type: 'Technological' },
              { id: 'A.8.34', name: 'Protection of information systems during audit testing', type: 'Technological' }
            ]
          }
        ]
      },
      
      certificationProcess: {
        stages: [
          { stage: 1, name: 'Gap Analysis', description: 'Assess current state vs ISO 27001 requirements' },
          { stage: 2, name: 'Risk Assessment', description: 'Identify information security risks' },
          { stage: 3, name: 'Risk Treatment', description: 'Select and implement controls' },
          { stage: 4, name: 'Statement of Applicability', description: 'Document which controls apply and why' },
          { stage: 5, name: 'ISMS Implementation', description: 'Implement policies, procedures, and controls' },
          { stage: 6, name: 'Internal Audit', description: 'Verify ISMS effectiveness' },
          { stage: 7, name: 'Management Review', description: 'Top management reviews ISMS performance' },
          { stage: 8, name: 'Stage 1 Audit', description: 'Certification body reviews documentation' },
          { stage: 9, name: 'Stage 2 Audit', description: 'Certification body audits implementation' },
          { stage: 10, name: 'Certification', description: 'Certificate issued for 3 years' }
        ],
        surveillance: 'Annual surveillance audits required to maintain certification',
        recertification: 'Full recertification audit every 3 years'
      },
      
      keyChangesFrom2013: [
        'Reduced from 114 to 93 controls',
        'Reorganized into 4 themes instead of 14 categories',
        'New controls for threat intelligence (A.5.7)',
        'Enhanced cloud security requirements (A.5.23)',
        'Stronger supply chain security controls',
        'Updated privacy and PII protection (A.5.34)',
        'Improved incident management controls',
        'Enhanced business continuity requirements'
      ],
      
      integrationWith: {
        'ISO 27002': 'Implementation guidance for ISO 27001 controls',
        'ISO 27017': 'Cloud security controls',
        'ISO 27018': 'PII protection in public clouds',
        'ISO 27701': 'Privacy information management',
        'ISO 22301': 'Business continuity management'
      },
      
      benefits: [
        'Systematic approach to managing sensitive information',
        'Protection of confidentiality, integrity, and availability',
        'Compliance with legal and regulatory requirements',
        'Improved customer and stakeholder confidence',
        'Competitive advantage through certification',
        'Risk-based approach to security',
        'Continual improvement framework',
        'International recognition'
      ],
      
      metadata: {
        source: 'https://www.iso.org/standard/82875.html',
        lastUpdated: '2022-10-25',
        applicableSectors: 'All organizations regardless of size or sector',
        relatedStandards: ['NIST CSF', 'CIS Controls', 'COBIT', 'SOC 2']
      }
    };
  }
};

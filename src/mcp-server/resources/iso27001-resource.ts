/**
 * ISO 27001:2022 Information Security Management System (ISMS) Resource
 * 
 * Provides comprehensive reference data for ISO 27001:2022 standard
 * including all controls from Annex A
 */

import type { MCPResource, MCPEnvironment } from '../types/mcp-types';

export const iso27001Resource: MCPResource = {
  uri: 'compliance://iso-27001',
  name: 'ISO 27001:2022 ISMS',
  description: 'Complete ISO 27001:2022 standard reference with all Annex A controls',
  mimeType: 'application/json',
  
  async fetch(env: MCPEnvironment): Promise<any> {
    return {
      standard: {
        name: 'ISO/IEC 27001:2022',
        fullName: 'Information Security, Cybersecurity and Privacy Protection - Information Security Management Systems - Requirements',
        version: '2022',
        published: '2022-10-25',
        organization: 'International Organization for Standardization (ISO)',
        description: 'International standard for information security management systems (ISMS)',
        scope: 'Applicable to all types and sizes of organizations'
      },
      
      clauses: [
        {
          id: '4',
          name: 'Context of the Organization',
          requirements: [
            'Understanding the organization and its context',
            'Understanding the needs and expectations of interested parties',
            'Determining the scope of the ISMS',
            'Information security management system'
          ]
        },
        {
          id: '5',
          name: 'Leadership',
          requirements: [
            'Leadership and commitment',
            'Information security policy',
            'Organizational roles, responsibilities and authorities'
          ]
        },
        {
          id: '6',
          name: 'Planning',
          requirements: [
            'Actions to address risks and opportunities',
            'Information security objectives and planning to achieve them'
          ]
        },
        {
          id: '7',
          name: 'Support',
          requirements: [
            'Resources',
            'Competence',
            'Awareness',
            'Communication',
            'Documented information'
          ]
        },
        {
          id: '8',
          name: 'Operation',
          requirements: [
            'Operational planning and control',
            'Information security risk assessment',
            'Information security risk treatment'
          ]
        },
        {
          id: '9',
          name: 'Performance Evaluation',
          requirements: [
            'Monitoring, measurement, analysis and evaluation',
            'Internal audit',
            'Management review'
          ]
        },
        {
          id: '10',
          name: 'Improvement',
          requirements: [
            'Continual improvement',
            'Nonconformity and corrective action'
          ]
        }
      ],
      
      annexAControls: [
        {
          category: 'A.5',
          name: 'Organizational Controls',
          controlCount: 37,
          controls: [
            { id: 'A.5.1', name: 'Policies for information security', purpose: 'Management direction and support' },
            { id: 'A.5.2', name: 'Information security roles and responsibilities', purpose: 'Define and allocate responsibilities' },
            { id: 'A.5.3', name: 'Segregation of duties', purpose: 'Reduce unauthorized or unintentional modification' },
            { id: 'A.5.4', name: 'Management responsibilities', purpose: 'Support information security policy' },
            { id: 'A.5.5', name: 'Contact with authorities', purpose: 'Maintain appropriate contacts' },
            { id: 'A.5.6', name: 'Contact with special interest groups', purpose: 'Exchange security information' },
            { id: 'A.5.7', name: 'Threat intelligence', purpose: 'Collect and analyze threat information' },
            { id: 'A.5.8', name: 'Information security in project management', purpose: 'Integrate security into projects' },
            { id: 'A.5.9', name: 'Inventory of information and other associated assets', purpose: 'Identify and document assets' },
            { id: 'A.5.10', name: 'Acceptable use of information and other associated assets', purpose: 'Define acceptable usage' },
            { id: 'A.5.11', name: 'Return of assets', purpose: 'Return all organizational assets' },
            { id: 'A.5.12', name: 'Classification of information', purpose: 'Classify according to business needs' },
            { id: 'A.5.13', name: 'Labelling of information', purpose: 'Label information per classification' },
            { id: 'A.5.14', name: 'Information transfer', purpose: 'Maintain security during transfer' },
            { id: 'A.5.15', name: 'Access control', purpose: 'Control access based on business requirements' },
            { id: 'A.5.16', name: 'Identity management', purpose: 'Manage full lifecycle of identities' },
            { id: 'A.5.17', name: 'Authentication information', purpose: 'Manage authentication information' },
            { id: 'A.5.18', name: 'Access rights', purpose: 'Provision and deprovision access' },
            { id: 'A.5.19', name: 'Information security in supplier relationships', purpose: 'Protect information accessible by suppliers' },
            { id: 'A.5.20', name: 'Addressing information security within supplier agreements', purpose: 'Include security requirements in agreements' },
            { id: 'A.5.21', name: 'Managing information security in the ICT supply chain', purpose: 'Manage ICT supply chain risks' },
            { id: 'A.5.22', name: 'Monitoring, review and change management of supplier services', purpose: 'Monitor supplier performance' },
            { id: 'A.5.23', name: 'Information security for use of cloud services', purpose: 'Manage cloud security' },
            { id: 'A.5.24', name: 'Information security incident management planning and preparation', purpose: 'Plan incident management' },
            { id: 'A.5.25', name: 'Assessment and decision on information security events', purpose: 'Assess and categorize events' },
            { id: 'A.5.26', name: 'Response to information security incidents', purpose: 'Respond per documented procedures' },
            { id: 'A.5.27', name: 'Learning from information security incidents', purpose: 'Learn and improve from incidents' },
            { id: 'A.5.28', name: 'Collection of evidence', purpose: 'Collect evidence per legal requirements' },
            { id: 'A.5.29', name: 'Information security during disruption', purpose: 'Plan for business continuity' },
            { id: 'A.5.30', name: 'ICT readiness for business continuity', purpose: 'Ensure ICT availability' },
            { id: 'A.5.31', name: 'Legal, statutory, regulatory and contractual requirements', purpose: 'Identify and document requirements' },
            { id: 'A.5.32', name: 'Intellectual property rights', purpose: 'Protect intellectual property' },
            { id: 'A.5.33', name: 'Protection of records', purpose: 'Protect important records' },
            { id: 'A.5.34', name: 'Privacy and protection of PII', purpose: 'Protect personal identifiable information' },
            { id: 'A.5.35', name: 'Independent review of information security', purpose: 'Conduct independent reviews' },
            { id: 'A.5.36', name: 'Compliance with policies, rules and standards for information security', purpose: 'Review compliance regularly' },
            { id: 'A.5.37', name: 'Documented operating procedures', purpose: 'Document procedures and make available' }
          ]
        },
        {
          category: 'A.6',
          name: 'People Controls',
          controlCount: 8,
          controls: [
            { id: 'A.6.1', name: 'Screening', purpose: 'Background verification checks' },
            { id: 'A.6.2', name: 'Terms and conditions of employment', purpose: 'Security responsibilities in contracts' },
            { id: 'A.6.3', name: 'Information security awareness, education and training', purpose: 'Ensure personnel receive training' },
            { id: 'A.6.4', name: 'Disciplinary process', purpose: 'Formal disciplinary process for violations' },
            { id: 'A.6.5', name: 'Responsibilities after termination or change of employment', purpose: 'Remain valid after termination' },
            { id: 'A.6.6', name: 'Confidentiality or non-disclosure agreements', purpose: 'Reflect organization needs' },
            { id: 'A.6.7', name: 'Remote working', purpose: 'Protect information accessed remotely' },
            { id: 'A.6.8', name: 'Information security event reporting', purpose: 'Provide reporting mechanism' }
          ]
        },
        {
          category: 'A.7',
          name: 'Physical Controls',
          controlCount: 14,
          controls: [
            { id: 'A.7.1', name: 'Physical security perimeters', purpose: 'Define and use security perimeters' },
            { id: 'A.7.2', name: 'Physical entry', purpose: 'Control entry to secure areas' },
            { id: 'A.7.3', name: 'Securing offices, rooms and facilities', purpose: 'Design and apply physical security' },
            { id: 'A.7.4', name: 'Physical security monitoring', purpose: 'Monitor premises for unauthorized access' },
            { id: 'A.7.5', name: 'Protecting against physical and environmental threats', purpose: 'Protect against natural disasters' },
            { id: 'A.7.6', name: 'Working in secure areas', purpose: 'Apply security measures for secure areas' },
            { id: 'A.7.7', name: 'Clear desk and clear screen', purpose: 'Clear desk and screen policies' },
            { id: 'A.7.8', name: 'Equipment siting and protection', purpose: 'Protect equipment appropriately' },
            { id: 'A.7.9', name: 'Security of assets off-premises', purpose: 'Protect off-site assets' },
            { id: 'A.7.10', name: 'Storage media', purpose: 'Manage storage media securely' },
            { id: 'A.7.11', name: 'Supporting utilities', purpose: 'Protect information processing facilities' },
            { id: 'A.7.12', name: 'Cabling security', purpose: 'Protect cables from damage' },
            { id: 'A.7.13', name: 'Equipment maintenance', purpose: 'Maintain equipment correctly' },
            { id: 'A.7.14', name: 'Secure disposal or re-use of equipment', purpose: 'Verify data is erased' }
          ]
        },
        {
          category: 'A.8',
          name: 'Technological Controls',
          controlCount: 34,
          controls: [
            { id: 'A.8.1', name: 'User endpoint devices', purpose: 'Protect user endpoint devices' },
            { id: 'A.8.2', name: 'Privileged access rights', purpose: 'Restrict privileged access' },
            { id: 'A.8.3', name: 'Information access restriction', purpose: 'Restrict access per policy' },
            { id: 'A.8.4', name: 'Access to source code', purpose: 'Control access to source code' },
            { id: 'A.8.5', name: 'Secure authentication', purpose: 'Implement secure authentication' },
            { id: 'A.8.6', name: 'Capacity management', purpose: 'Monitor and project capacity' },
            { id: 'A.8.7', name: 'Protection against malware', purpose: 'Protect against malware' },
            { id: 'A.8.8', name: 'Management of technical vulnerabilities', purpose: 'Prevent vulnerability exploitation' },
            { id: 'A.8.9', name: 'Configuration management', purpose: 'Document and secure configurations' },
            { id: 'A.8.10', name: 'Information deletion', purpose: 'Delete information when no longer required' },
            { id: 'A.8.11', name: 'Data masking', purpose: 'Mask data per policy' },
            { id: 'A.8.12', name: 'Data leakage prevention', purpose: 'Prevent unauthorized disclosure' },
            { id: 'A.8.13', name: 'Information backup', purpose: 'Maintain backup copies' },
            { id: 'A.8.14', name: 'Redundancy of information processing facilities', purpose: 'Implement sufficient redundancy' },
            { id: 'A.8.15', name: 'Logging', purpose: 'Record events per policy' },
            { id: 'A.8.16', name: 'Monitoring activities', purpose: 'Monitor for anomalies' },
            { id: 'A.8.17', name: 'Clock synchronization', purpose: 'Synchronize clocks across systems' },
            { id: 'A.8.18', name: 'Use of privileged utility programs', purpose: 'Control privileged utilities' },
            { id: 'A.8.19', name: 'Installation of software on operational systems', purpose: 'Control software installation' },
            { id: 'A.8.20', name: 'Networks security', purpose: 'Secure networks and protect information' },
            { id: 'A.8.21', name: 'Security of network services', purpose: 'Identify and document security' },
            { id: 'A.8.22', name: 'Segregation of networks', purpose: 'Segregate network groups' },
            { id: 'A.8.23', name: 'Web filtering', purpose: 'Manage access to external websites' },
            { id: 'A.8.24', name: 'Use of cryptography', purpose: 'Define and implement cryptography' },
            { id: 'A.8.25', name: 'Secure development life cycle', purpose: 'Establish secure development rules' },
            { id: 'A.8.26', name: 'Application security requirements', purpose: 'Identify security requirements' },
            { id: 'A.8.27', name: 'Secure system architecture and engineering principles', purpose: 'Apply secure engineering principles' },
            { id: 'A.8.28', name: 'Secure coding', purpose: 'Apply secure coding principles' },
            { id: 'A.8.29', name: 'Security testing in development and acceptance', purpose: 'Define and implement testing' },
            { id: 'A.8.30', name: 'Outsourced development', purpose: 'Direct and monitor outsourced development' },
            { id: 'A.8.31', name: 'Separation of development, test and production environments', purpose: 'Separate environments' },
            { id: 'A.8.32', name: 'Change management', purpose: 'Manage changes through formal process' },
            { id: 'A.8.33', name: 'Test information', purpose: 'Select and protect test information' },
            { id: 'A.8.34', name: 'Protection of information systems during audit testing', purpose: 'Plan and agree audit activities' }
          ]
        }
      ],
      
      totalControls: 93,
      
      certificationProcess: {
        stages: [
          { stage: 1, name: 'Stage 1 Audit', description: 'Documentation review and readiness assessment' },
          { stage: 2, name: 'Stage 2 Audit', description: 'On-site implementation verification' },
          { stage: 3, name: 'Certification Decision', description: 'Award ISO 27001 certificate' },
          { stage: 4, name: 'Surveillance Audits', description: 'Annual surveillance audits (typically 2 per 3-year cycle)' },
          { stage: 5, name: 'Recertification', description: 'Full recertification every 3 years' }
        ],
        duration: 'Typically 6-12 months from start to certification',
        validity: '3 years with annual surveillance audits'
      },
      
      benefits: [
        'Demonstrates commitment to information security',
        'Competitive advantage in marketplace',
        'Meets customer and regulatory requirements',
        'Systematic approach to managing sensitive information',
        'Protects brand and reputation',
        'Reduces risk of fines and penalties',
        'Improves organizational resilience'
      ],
      
      relatedStandards: [
        { standard: 'ISO 27002', description: 'Information security controls - Implementation guidance' },
        { standard: 'ISO 27017', description: 'Cloud security controls' },
        { standard: 'ISO 27018', description: 'Protection of PII in cloud' },
        { standard: 'ISO 27701', description: 'Privacy information management' },
        { standard: 'ISO 22301', description: 'Business continuity management' }
      ],
      
      metadata: {
        source: 'https://www.iso.org/standard/27001',
        lastUpdated: '2022-10-25',
        previousVersion: 'ISO 27001:2013',
        applicableRegions: 'Worldwide',
        certificationBodies: 'Accredited certification bodies worldwide'
      }
    };
  }
};

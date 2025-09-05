-- Upload Access Control Policy (ACP-001) to RAG System
-- This script uploads the comprehensive Access Control Policy

INSERT INTO rag_documents (
  title, content, document_type, metadata, embedding_status, 
  organization_id, uploaded_by, created_at, updated_at
) VALUES (
  'Access Control Policy (ACP-001)',
  '# Access Control Policy

**Document ID**: ACP-001  
**Version**: 2.0  
**Effective Date**: January 1, 2024  
**Review Date**: December 31, 2024  
**Owner**: Chief Information Security Officer (CISO)  
**Classification**: Internal  

## 1. PURPOSE AND SCOPE

### 1.1 Purpose
This Access Control Policy establishes requirements for managing user access to organizational information systems, applications, and data. This policy ensures appropriate access controls are implemented in accordance with ISO 27001:2022 controls A.9 (Access Management), NIST CSF Identity and Access Management, and SOC 2 CC6.1 requirements.

### 1.2 Scope
This policy covers:
- All user accounts and access rights management
- System and application access controls
- Privileged access management
- Remote and third-party access
- Access monitoring and review processes

## 2. ACCESS CONTROL PRINCIPLES

### 2.1 Fundamental Principles

#### 2.1.1 Principle of Least Privilege
- Users granted minimum access necessary to perform job functions
- Default deny approach - access explicitly granted, not assumed
- Regular validation of access requirements and usage
- Time-limited access for temporary assignments

#### 2.1.2 Segregation of Duties
- Separation of conflicting responsibilities
- No single individual has complete control over critical processes
- System-enforced controls where possible
- Documented exceptions with compensating controls

#### 2.1.3 Need-to-Know Basis
- Access granted based on business justification
- Information shared only with authorized individuals
- Regular review of access appropriateness
- Prompt removal when no longer required

## 3. USER ACCESS MANAGEMENT

### 3.1 User Registration and De-registration

#### 3.1.1 Account Provisioning Process
1. **Access Request**: Formal request with business justification
2. **Manager Approval**: Line manager authorization required
3. **Data Owner Approval**: Resource owner approval for sensitive systems
4. **Identity Verification**: HR confirmation of employment status
5. **Account Creation**: IT provisioning with standard access template
6. **Access Notification**: Confirmation to requestor and approvers

#### 3.1.2 Account Types
- **Standard User Account**: Regular business user access
- **Service Account**: System-to-system authentication
- **Administrative Account**: Elevated privileges for system management
- **Emergency Account**: Break-glass access for critical incidents
- **Contractor Account**: Time-limited access for external personnel

#### 3.1.3 Account Deprovisioning
- **Immediate Suspension**: Upon termination or resignation
- **Access Review**: 24-hour review of account status changes
- **Data Retention**: Account data preserved per retention policy
- **Asset Recovery**: Return of organizational devices and credentials

### 3.2 User Access Provisioning

#### 3.2.1 Role-Based Access Control (RBAC)
- **Job-Function Roles**: Predefined access based on job categories
- **Data Classification**: Access aligned with information sensitivity
- **System Roles**: Technical roles for application and system access
- **Business Roles**: Functional roles for business process access

#### 3.2.2 Access Templates
- **New Hire Templates**: Standard access packages by department
- **Role Change Templates**: Access modification for job changes
- **Temporary Access**: Time-limited access with automatic expiration
- **Project Access**: Team-based access for specific initiatives

### 3.3 Management of Special Privileges

#### 3.3.1 Privileged Account Management
- **Separate Accounts**: Administrative access via dedicated accounts
- **Multi-Factor Authentication**: MFA required for all privileged access
- **Just-in-Time Access**: Temporary elevation for specific tasks
- **Session Recording**: All privileged sessions logged and monitored
- **Regular Recertification**: Monthly review of privileged account holders

#### 3.3.2 System Administrator Access
- **Dedicated Admin Accounts**: Separate from standard user accounts
- **Workstation Separation**: Administrative tasks on dedicated systems
- **Activity Monitoring**: Real-time monitoring of administrative actions
- **Change Control**: All administrative changes through formal process
- **Emergency Access**: Break-glass procedures with full audit trail

## 4. USER RESPONSIBILITIES

### 4.1 Password Management

#### 4.1.1 Password Requirements
- **Minimum Length**: 12 characters minimum, 16+ recommended
- **Complexity**: Mix of uppercase, lowercase, numbers, special characters
- **Uniqueness**: No reuse of last 12 passwords
- **Aging**: Maximum 90 days for privileged accounts, 365 days for standard
- **Dictionary Check**: Prevention of common and compromised passwords

#### 4.1.2 Password Storage and Protection
- **Password Managers**: Approved enterprise password management tools
- **Encryption**: Passwords encrypted in transit and at rest
- **Sharing Prohibition**: No sharing of personal account credentials
- **Documentation**: No written passwords in unsecured locations
- **Secure Transmission**: Passwords communicated through secure channels

### 4.2 Multi-Factor Authentication (MFA)

#### 4.2.1 MFA Requirements
- **Privileged Accounts**: MFA mandatory for all administrative access
- **Sensitive Systems**: MFA required for systems processing restricted data
- **Remote Access**: MFA mandatory for all external network access
- **Cloud Services**: MFA for all Software-as-a-Service applications
- **High-Risk Users**: MFA for executives and high-privilege users

#### 4.2.2 Authentication Factors
- **Knowledge Factor**: Password, PIN, security questions
- **Possession Factor**: Hardware tokens, smart cards, mobile applications  
- **Inherence Factor**: Biometrics, behavioral patterns
- **Location Factor**: Geographic and network location verification
- **Time Factor**: Time-based one-time passwords (TOTP)

## 5. NETWORK ACCESS CONTROL

### 5.1 Network Authentication

#### 5.1.1 Network Segmentation
- **User Network**: Standard user access with appropriate filtering
- **Admin Network**: Isolated network for administrative functions
- **Guest Network**: Limited access for visitors with internet only
- **IoT Network**: Isolated network for Internet of Things devices
- **DMZ**: Demilitarized zone for public-facing services

#### 5.1.2 Wireless Network Security
- **Enterprise Authentication**: WPA3-Enterprise with 802.1X
- **Certificate-Based**: Digital certificates for device authentication
- **Guest Access**: Isolated guest network with captive portal
- **Monitoring**: Wireless intrusion detection and rogue AP detection
- **Encryption**: Strong encryption for all wireless communications

### 5.2 Remote Access

#### 5.2.1 VPN Requirements
- **Approved VPN Solutions**: Enterprise-grade VPN with strong encryption
- **Device Compliance**: Health checks for connecting devices
- **Split Tunneling**: Prohibited for corporate device connections
- **Activity Logging**: All VPN connections logged and monitored
- **Idle Timeout**: Automatic disconnection after inactivity period

#### 5.2.2 Remote Desktop Access
- **Gateway Solutions**: Centralized remote desktop gateways
- **Session Recording**: Recording of remote administrative sessions
- **Multi-Factor Authentication**: MFA required for remote desktop access
- **Network Restriction**: Limited to specific source networks where possible
- **Time Restrictions**: Access limited to business hours unless justified

## 6. APPLICATION AND INFORMATION ACCESS CONTROL

### 6.1 Application Access Management

#### 6.1.1 Single Sign-On (SSO)
- **Centralized Authentication**: SAML or OAuth-based SSO implementation
- **Account Linking**: Proper mapping between identity and application accounts
- **Session Management**: Coordinated session timeout across applications
- **Audit Logging**: Centralized logging of authentication events
- **Failure Handling**: Graceful degradation when SSO unavailable

#### 6.1.2 Application Security
- **Input Validation**: Server-side validation of all user inputs
- **Session Management**: Secure session handling and timeout
- **Error Handling**: No sensitive information in error messages
- **Audit Logging**: Logging of security-relevant application events
- **Security Headers**: Implementation of appropriate security headers

### 6.2 Information Access Controls

#### 6.2.1 Data Classification Enforcement
- **Automated Classification**: System-enforced access based on data labels
- **Dynamic Access Control**: Real-time access decisions based on context
- **Data Loss Prevention**: Monitoring and prevention of unauthorized access
- **Encryption**: Strong encryption for data at rest and in transit
- **Audit Trail**: Complete audit trail for all data access

#### 6.2.2 Database Access Control
- **Database User Accounts**: Individual accounts for database access
- **Privilege Management**: Granular privileges based on job requirements
- **Query Monitoring**: Monitoring of database queries and results
- **Data Masking**: Masking of sensitive data in non-production environments
- **Backup Security**: Secure storage and access controls for database backups

## 7. MOBILE DEVICE ACCESS CONTROL

### 7.1 Mobile Device Management (MDM)

#### 7.1.1 Device Registration
- **Corporate Devices**: Full MDM control and monitoring
- **BYOD Devices**: Containerization for corporate data access
- **Device Encryption**: Full device encryption mandatory
- **Remote Wipe**: Capability to remotely wipe corporate data
- **Compliance Monitoring**: Regular compliance checking and reporting

#### 7.1.2 Application Management
- **Approved Applications**: Whitelist of approved business applications
- **Application Wrapping**: Security controls around corporate applications
- **Data Segregation**: Separation of personal and corporate data
- **Update Management**: Mandatory security updates for corporate apps
- **Usage Monitoring**: Monitoring of corporate application usage

## 8. ACCESS MONITORING AND REVIEW

### 8.1 Continuous Monitoring

#### 8.1.1 Real-Time Monitoring
- **Authentication Monitoring**: Failed login attempts and account lockouts
- **Privileged Activity**: Real-time monitoring of administrative actions
- **Anomaly Detection**: Behavioral analytics for unusual access patterns
- **Geo-Location Tracking**: Monitoring access from unusual locations
- **Concurrent Sessions**: Detection of simultaneous login attempts

#### 8.1.2 Security Information and Event Management (SIEM)
- **Log Aggregation**: Centralized collection of authentication logs
- **Correlation Rules**: Automated detection of security events
- **Alerting**: Real-time alerts for suspicious activities
- **Reporting**: Regular reports on access patterns and violations
- **Investigation**: Tools for security incident investigation

### 8.2 Access Reviews and Recertification

#### 8.2.1 Periodic Access Reviews
- **Quarterly Reviews**: Manager certification of direct report access
- **Annual Recertification**: Comprehensive review of all user access
- **Data Owner Reviews**: Resource owners validate access appropriateness
- **Privileged Account Reviews**: Monthly review of administrative access
- **Exception Reviews**: Regular review of approved access exceptions

#### 8.2.2 Automated Access Governance
- **Identity Analytics**: Risk scoring based on access patterns
- **Access Intelligence**: Recommendations for access optimization
- **Orphaned Account Detection**: Identification of unused accounts
- **Segregation of Duties Analysis**: Automated SoD conflict detection
- **Compliance Reporting**: Automated generation of compliance reports

## 9. THIRD-PARTY ACCESS

### 9.1 External User Access

#### 9.1.1 Vendor and Partner Access
- **Formal Agreements**: Signed agreements defining access terms
- **Limited Access**: Minimum access necessary for services
- **Time-Limited**: Defined start and end dates for access
- **Monitoring**: Enhanced monitoring of external user activities  
- **Termination**: Immediate access removal upon contract completion

#### 9.1.2 Customer Access
- **Self-Service Portals**: Secure customer portals for routine transactions
- **Multi-Tenancy**: Proper isolation between customer environments
- **Data Segregation**: Logical separation of customer data
- **Access Logging**: Comprehensive logging of customer access
- **Privacy Controls**: Respect for customer privacy and consent

### 9.2 Cloud and SaaS Access Management

#### 9.2.1 Cloud Identity Federation
- **Identity Provider**: Centralized identity provider for cloud services
- **SAML/OAuth**: Standards-based federation protocols
- **Just-in-Time Provisioning**: Automatic user provisioning upon first access
- **Attribute Mapping**: Proper mapping of user attributes and roles
- **Session Management**: Coordinated session management across services

#### 9.2.2 Cloud Access Security Broker (CASB)
- **Visibility**: Visibility into cloud service usage and access
- **Data Loss Prevention**: Prevention of unauthorized data sharing
- **Threat Protection**: Advanced threat protection for cloud services
- **Compliance**: Enforcement of corporate policies in cloud environments
- **Risk Assessment**: Continuous assessment of cloud service risks

## 10. INCIDENT RESPONSE

### 10.1 Access-Related Incidents

#### 10.1.1 Incident Types
- **Unauthorized Access**: Access by unauthorized individuals
- **Privilege Escalation**: Unauthorized elevation of access privileges
- **Account Compromise**: Compromise of user or system accounts
- **Data Breach**: Unauthorized access to sensitive information
- **System Abuse**: Misuse of authorized access privileges

#### 10.1.2 Response Procedures
- **Immediate Containment**: Disable compromised accounts immediately
- **Impact Assessment**: Determine scope and impact of incident
- **Evidence Preservation**: Preserve logs and evidence for investigation
- **Stakeholder Notification**: Notify appropriate stakeholders per policy
- **Recovery Actions**: Restore normal operations with enhanced controls

## 11. COMPLIANCE AND AUDIT

### 11.1 Regulatory Compliance

#### 11.1.1 ISO 27001:2022 Alignment
- **A.9.1**: Access control policy and procedures
- **A.9.2**: User access management lifecycle
- **A.9.3**: User responsibilities and accountability
- **A.9.4**: System and application access control

#### 11.1.2 SOC 2 Controls
- **CC6.1**: Logical access security measures
- **CC6.2**: Authentication and authorization
- **CC6.3**: Network security and segregation
- **CC6.6**: Vulnerability management process

### 11.2 Internal Audit

#### 11.2.1 Access Control Testing
- **User Access Reviews**: Testing of access review processes
- **Privileged Access**: Testing of administrative access controls
- **Segregation of Duties**: Testing for SoD conflicts
- **Technical Controls**: Testing of system-enforced controls
- **Documentation**: Review of access control documentation

#### 11.2.2 Continuous Auditing
- **Automated Testing**: Continuous testing of access controls
- **Exception Reporting**: Automated identification of control failures
- **Risk Scoring**: Risk-based prioritization of audit findings
- **Trend Analysis**: Analysis of access control trends and patterns
- **Remediation Tracking**: Tracking of audit finding remediation

## 12. POLICY ENFORCEMENT

### 12.1 Violations and Disciplinary Actions

#### 12.1.1 Policy Violations
- **Sharing Credentials**: Disciplinary action for credential sharing
- **Unauthorized Access**: Investigation and potential termination
- **Privilege Abuse**: Removal of privileges and disciplinary action
- **Social Engineering**: Additional training and monitoring
- **Repeated Violations**: Progressive discipline up to termination

#### 12.1.2 Legal and Regulatory Actions
- **Criminal Activity**: Referral to law enforcement agencies
- **Regulatory Violations**: Reporting to appropriate regulatory bodies
- **Civil Liability**: Recovery of damages through civil proceedings
- **Professional Standards**: Reporting to professional licensing bodies
- **Contract Violations**: Enforcement of contractual obligations

---

**Document Approval:**

CISO Signature: _________________________ Date: _____________

IT Director Signature: _________________________ Date: _____________

**Next Review Date**: December 31, 2024

**Related Documents**: Information Security Policy (ISP-001), Incident Response Plan (IRP-001), Acceptable Use Policy (AUP-001)',
  'policy',
  '{"policy_id": "ACP-001", "version": "2.0", "compliance_frameworks": ["ISO 27001:2022", "NIST CSF", "SOC 2"], "classification": "Internal", "owner": "CISO"}',
  'pending',
  1,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
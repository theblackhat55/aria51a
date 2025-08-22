/**
 * Enhanced Incident Management System
 * Provides comprehensive incident lifecycle management with workflows, escalation rules, and SLA tracking
 */

// Enhanced incident management configuration
const INCIDENT_CONFIG = {
    severityLevels: {
        'critical': { 
            label: 'Critical', 
            color: '#dc2626', 
            sla: 30, // minutes
            escalationTime: 15, // minutes
            autoAssign: true
        },
        'high': { 
            label: 'High', 
            color: '#ea580c', 
            sla: 120, // minutes
            escalationTime: 60, // minutes
            autoAssign: true
        },
        'medium': { 
            label: 'Medium', 
            color: '#d97706', 
            sla: 480, // minutes (8 hours)
            escalationTime: 240, // minutes (4 hours)
            autoAssign: false
        },
        'low': { 
            label: 'Low', 
            color: '#16a34a', 
            sla: 1440, // minutes (24 hours)
            escalationTime: 720, // minutes (12 hours)
            autoAssign: false
        }
    },
    
    statusWorkflow: {
        'open': ['investigating', 'assigned', 'closed'],
        'assigned': ['investigating', 'in-progress', 'escalated', 'closed'],
        'investigating': ['in-progress', 'waiting-for-info', 'escalated', 'closed'],
        'in-progress': ['waiting-for-info', 'resolved', 'escalated'],
        'waiting-for-info': ['investigating', 'in-progress', 'escalated'],
        'escalated': ['investigating', 'in-progress', 'resolved'],
        'resolved': ['closed', 'reopened'],
        'closed': ['reopened'],
        'reopened': ['assigned', 'investigating', 'in-progress']
    },
    
    escalationRules: [
        {
            id: 'severity-based',
            name: 'Severity-Based Escalation',
            condition: (incident) => {
                const config = INCIDENT_CONFIG.severityLevels[incident.severity];
                const createdTime = new Date(incident.createdAt);
                const now = new Date();
                const minutesElapsed = (now - createdTime) / (1000 * 60);
                return minutesElapsed > config.escalationTime;
            },
            action: 'escalate-to-manager'
        },
        {
            id: 'sla-breach',
            name: 'SLA Breach Escalation',
            condition: (incident) => {
                const config = INCIDENT_CONFIG.severityLevels[incident.severity];
                const createdTime = new Date(incident.createdAt);
                const now = new Date();
                const minutesElapsed = (now - createdTime) / (1000 * 60);
                return minutesElapsed > config.sla;
            },
            action: 'escalate-to-senior-management'
        },
        {
            id: 'critical-unassigned',
            name: 'Critical Incident Unassigned',
            condition: (incident) => {
                return incident.severity === 'critical' && !incident.assignedTo;
            },
            action: 'auto-assign-critical'
        }
    ],
    
    notificationTemplates: {
        'incident-created': {
            subject: 'New Incident Created: {title}',
            body: 'A new {severity} severity incident has been created.\n\nTitle: {title}\nDescription: {description}\nAffected Service: {affectedService}\nReporter: {reporter}'
        },
        'incident-assigned': {
            subject: 'Incident Assigned: {title}',
            body: 'You have been assigned to incident {incidentId}.\n\nTitle: {title}\nSeverity: {severity}\nSLA: {sla} minutes'
        },
        'incident-escalated': {
            subject: 'ESCALATED: {title}',
            body: 'Incident {incidentId} has been escalated due to {reason}.\n\nTitle: {title}\nSeverity: {severity}\nTime Elapsed: {timeElapsed} minutes'
        },
        'sla-warning': {
            subject: 'SLA WARNING: {title}',
            body: 'Incident {incidentId} is approaching SLA breach.\n\nTitle: {title}\nSeverity: {severity}\nTime Remaining: {timeRemaining} minutes'
        }
    }
};

// Enhanced incident management functions
function getIncidentFormHTML(incident = null) {
    const isEdit = incident !== null;
    const title = isEdit ? 'Edit Incident' : 'Create New Incident';
    
    return `
        <div class="incident-form-container">
            <div class="form-header">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">${title}</h3>
                ${isEdit ? `<div class="incident-status-badge status-${incident.status}">${incident.status.replace('-', ' ').toUpperCase()}</div>` : ''}
            </div>
            
            <form id="incidentForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input type="text" id="incidentTitle" 
                            value="${isEdit ? incident.title : ''}" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
                        <select id="incidentSeverity" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            ${Object.entries(INCIDENT_CONFIG.severityLevels).map(([key, config]) => 
                                `<option value="${key}" ${isEdit && incident.severity === key ? 'selected' : ''}>${config.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Affected Service</label>
                        <select id="affectedService" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Select Service</option>
                            <option value="web-application" ${isEdit && incident.affectedService === 'web-application' ? 'selected' : ''}>Web Application</option>
                            <option value="database" ${isEdit && incident.affectedService === 'database' ? 'selected' : ''}>Database</option>
                            <option value="api-gateway" ${isEdit && incident.affectedService === 'api-gateway' ? 'selected' : ''}>API Gateway</option>
                            <option value="authentication" ${isEdit && incident.affectedService === 'authentication' ? 'selected' : ''}>Authentication Service</option>
                            <option value="payment-processing" ${isEdit && incident.affectedService === 'payment-processing' ? 'selected' : ''}>Payment Processing</option>
                            <option value="notification-service" ${isEdit && incident.affectedService === 'notification-service' ? 'selected' : ''}>Notification Service</option>
                            <option value="infrastructure" ${isEdit && incident.affectedService === 'infrastructure' ? 'selected' : ''}>Infrastructure</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select id="incidentCategory" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Select Category</option>
                            <option value="security-incident" ${isEdit && incident.category === 'security-incident' ? 'selected' : ''}>Security Incident</option>
                            <option value="service-outage" ${isEdit && incident.category === 'service-outage' ? 'selected' : ''}>Service Outage</option>
                            <option value="performance-issue" ${isEdit && incident.category === 'performance-issue' ? 'selected' : ''}>Performance Issue</option>
                            <option value="data-breach" ${isEdit && incident.category === 'data-breach' ? 'selected' : ''}>Data Breach</option>
                            <option value="compliance-violation" ${isEdit && incident.category === 'compliance-violation' ? 'selected' : ''}>Compliance Violation</option>
                            <option value="system-failure" ${isEdit && incident.category === 'system-failure' ? 'selected' : ''}>System Failure</option>
                            <option value="user-access-issue" ${isEdit && incident.category === 'user-access-issue' ? 'selected' : ''}>User Access Issue</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea id="incidentDescription" rows="4" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Describe the incident, impact, and any relevant details..." required>${isEdit ? incident.description : ''}</textarea>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                        <select id="assignedTo" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Unassigned</option>
                            <option value="john.doe@company.com" ${isEdit && incident.assignedTo === 'john.doe@company.com' ? 'selected' : ''}>John Doe (Security Analyst)</option>
                            <option value="jane.smith@company.com" ${isEdit && incident.assignedTo === 'jane.smith@company.com' ? 'selected' : ''}>Jane Smith (DevOps Engineer)</option>
                            <option value="mike.johnson@company.com" ${isEdit && incident.assignedTo === 'mike.johnson@company.com' ? 'selected' : ''}>Mike Johnson (System Administrator)</option>
                            <option value="sarah.wilson@company.com" ${isEdit && incident.assignedTo === 'sarah.wilson@company.com' ? 'selected' : ''}>Sarah Wilson (Security Manager)</option>
                            <option value="team-security@company.com" ${isEdit && incident.assignedTo === 'team-security@company.com' ? 'selected' : ''}>Security Team</option>
                            <option value="team-devops@company.com" ${isEdit && incident.assignedTo === 'team-devops@company.com' ? 'selected' : ''}>DevOps Team</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select id="incidentPriority" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="low" ${isEdit && incident.priority === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${isEdit && incident.priority === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${isEdit && incident.priority === 'high' ? 'selected' : ''}>High</option>
                            <option value="critical" ${isEdit && incident.priority === 'critical' ? 'selected' : ''}>Critical</option>
                        </select>
                    </div>
                </div>
                
                ${isEdit ? `
                    <div class="incident-status-section">
                        <h4 class="text-md font-medium text-gray-800 mb-2">Status Management</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                                <div class="px-3 py-2 bg-gray-100 rounded-md">
                                    <span class="incident-status-badge status-${incident.status}">${incident.status.replace('-', ' ').toUpperCase()}</span>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Change Status</label>
                                <select id="newStatus" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Keep Current Status</option>
                                    ${INCIDENT_CONFIG.statusWorkflow[incident.status] ? 
                                        INCIDENT_CONFIG.statusWorkflow[incident.status].map(status => 
                                            `<option value="${status}">${status.replace('-', ' ').toUpperCase()}</option>`
                                        ).join('') : ''
                                    }
                                </select>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status Change Notes</label>
                            <textarea id="statusNotes" rows="2" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                placeholder="Add notes about the status change..."></textarea>
                        </div>
                    </div>
                ` : ''}
                
                <div class="incident-metadata">
                    <h4 class="text-md font-medium text-gray-800 mb-2">Additional Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Impact Assessment</label>
                            <select id="impactLevel" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="low" ${isEdit && incident.impactLevel === 'low' ? 'selected' : ''}>Low</option>
                                <option value="medium" ${isEdit && incident.impactLevel === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="high" ${isEdit && incident.impactLevel === 'high' ? 'selected' : ''}>High</option>
                                <option value="critical" ${isEdit && incident.impactLevel === 'critical' ? 'selected' : ''}>Critical</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Affected Users (estimated)</label>
                            <input type="number" id="affectedUsers" 
                                value="${isEdit ? incident.affectedUsers || 0 : 0}" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                min="0">
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">External References</label>
                        <input type="text" id="externalRefs" 
                            value="${isEdit ? incident.externalRefs || '' : ''}" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="Ticket IDs, links, or reference numbers...">
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onclick="closeModal()" 
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type="submit" 
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        ${isEdit ? 'Update Incident' : 'Create Incident'}
                    </button>
                </div>
            </form>
        </div>
        
        <style>
        .incident-status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-open { background-color: #fef3c7; color: #92400e; }
        .status-assigned { background-color: #dbeafe; color: #1e40af; }
        .status-investigating { background-color: #e0e7ff; color: #3730a3; }
        .status-in-progress { background-color: #fef2f2; color: #991b1b; }
        .status-waiting-for-info { background-color: #f3f4f6; color: #374151; }
        .status-escalated { background-color: #fee2e2; color: #991b1b; }
        .status-resolved { background-color: #d1fae5; color: #065f46; }
        .status-closed { background-color: #f9fafb; color: #6b7280; }
        .status-reopened { background-color: #fef3c7; color: #92400e; }
        
        .incident-form-container .form-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .incident-status-section {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            background-color: #f9fafb;
        }
        
        .incident-metadata {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            background-color: #f9fafb;
        }
        </style>
    `;
}

async function handleIncidentSubmit(incidentId = null) {
    const form = document.getElementById('incidentForm');
    if (!form) return;

    const formData = {
        title: document.getElementById('incidentTitle').value,
        severity: document.getElementById('incidentSeverity').value,
        affectedService: document.getElementById('affectedService').value,
        category: document.getElementById('incidentCategory').value,
        description: document.getElementById('incidentDescription').value,
        assignedTo: document.getElementById('assignedTo').value,
        priority: document.getElementById('incidentPriority').value,
        impactLevel: document.getElementById('impactLevel').value,
        affectedUsers: parseInt(document.getElementById('affectedUsers').value) || 0,
        externalRefs: document.getElementById('externalRefs').value
    };

    // Validation
    if (!formData.title.trim() || !formData.severity || !formData.description.trim()) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    let incidents = getIncidents();
    const now = new Date().toISOString();

    if (incidentId) {
        // Update existing incident
        const incidentIndex = incidents.findIndex(i => i.id === incidentId);
        if (incidentIndex !== -1) {
            const existingIncident = incidents[incidentIndex];
            const newStatus = document.getElementById('newStatus')?.value;
            const statusNotes = document.getElementById('statusNotes')?.value;

            // Update incident data
            incidents[incidentIndex] = {
                ...existingIncident,
                ...formData,
                updatedAt: now
            };

            // Handle status change
            if (newStatus && newStatus !== existingIncident.status) {
                incidents[incidentIndex].status = newStatus;
                incidents[incidentIndex].statusHistory = incidents[incidentIndex].statusHistory || [];
                incidents[incidentIndex].statusHistory.push({
                    status: newStatus,
                    changedBy: 'current-user@company.com', // In real app, get from auth
                    changedAt: now,
                    notes: statusNotes
                });

                // Log status change activity
                const activity = {
                    id: Date.now().toString(),
                    incidentId: incidentId,
                    type: 'status-change',
                    description: `Status changed from ${existingIncident.status} to ${newStatus}`,
                    user: 'current-user@company.com',
                    timestamp: now,
                    metadata: { notes: statusNotes }
                };
                logIncidentActivity(activity);
            }

            showNotification('Incident updated successfully', 'success');
        }
    } else {
        // Create new incident
        const newIncident = {
            id: Date.now().toString(),
            ...formData,
            status: 'open',
            createdAt: now,
            updatedAt: now,
            createdBy: 'current-user@company.com', // In real app, get from auth
            statusHistory: [{
                status: 'open',
                changedBy: 'current-user@company.com',
                changedAt: now,
                notes: 'Incident created'
            }]
        };

        // Auto-assign critical incidents if configured
        if (INCIDENT_CONFIG.severityLevels[newIncident.severity].autoAssign && !newIncident.assignedTo) {
            newIncident.assignedTo = 'team-security@company.com';
            newIncident.status = 'assigned';
            newIncident.statusHistory.push({
                status: 'assigned',
                changedBy: 'system',
                changedAt: now,
                notes: 'Auto-assigned due to severity level'
            });
        }

        incidents.push(newIncident);

        // Log creation activity
        const activity = {
            id: Date.now().toString(),
            incidentId: newIncident.id,
            type: 'created',
            description: `Incident created with ${newIncident.severity} severity`,
            user: 'current-user@company.com',
            timestamp: now,
            metadata: {}
        };
        logIncidentActivity(activity);

        showNotification('Incident created successfully', 'success');
    }

    localStorage.setItem('incidents', JSON.stringify(incidents));
    closeModal();
    showIncidents(); // Refresh the display
    
    // Check for immediate escalation conditions
    checkEscalationRules();
}

function showIncidentDetails(incidentId) {
    const incidents = getIncidents();
    const incident = incidents.find(i => i.id === incidentId);
    
    if (!incident) {
        showNotification('Incident not found', 'error');
        return;
    }

    const severityConfig = INCIDENT_CONFIG.severityLevels[incident.severity];
    const createdTime = new Date(incident.createdAt);
    const now = new Date();
    const minutesElapsed = Math.floor((now - createdTime) / (1000 * 60));
    const slaRemaining = severityConfig.sla - minutesElapsed;
    const slaStatus = slaRemaining > 0 ? 'within-sla' : 'sla-breached';

    const content = `
        <div class="incident-details">
            <div class="incident-header">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">${incident.title}</h3>
                        <p class="text-sm text-gray-600">ID: ${incident.id}</p>
                    </div>
                    <div class="flex space-x-2">
                        <span class="incident-status-badge status-${incident.status}">${incident.status.replace('-', ' ').toUpperCase()}</span>
                        <span class="severity-badge severity-${incident.severity}" style="background-color: ${severityConfig.color}20; color: ${severityConfig.color};">
                            ${severityConfig.label}
                        </span>
                    </div>
                </div>
            </div>

            <div class="incident-metrics grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="metric-card">
                    <h4 class="text-sm font-medium text-gray-500">Time Elapsed</h4>
                    <p class="text-lg font-semibold">${Math.floor(minutesElapsed / 60)}h ${minutesElapsed % 60}m</p>
                </div>
                <div class="metric-card">
                    <h4 class="text-sm font-medium text-gray-500">SLA Status</h4>
                    <p class="text-lg font-semibold ${slaStatus === 'within-sla' ? 'text-green-600' : 'text-red-600'}">
                        ${slaStatus === 'within-sla' ? `${Math.floor(slaRemaining / 60)}h ${slaRemaining % 60}m remaining` : `Breached by ${Math.abs(Math.floor(slaRemaining / 60))}h ${Math.abs(slaRemaining % 60)}m`}
                    </p>
                </div>
                <div class="metric-card">
                    <h4 class="text-sm font-medium text-gray-500">Affected Users</h4>
                    <p class="text-lg font-semibold">${incident.affectedUsers || 0}</p>
                </div>
            </div>

            <div class="incident-info grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <h4 class="text-md font-medium text-gray-800 mb-2">Incident Information</h4>
                    <div class="space-y-2">
                        <div><strong>Category:</strong> ${incident.category || 'Not specified'}</div>
                        <div><strong>Affected Service:</strong> ${incident.affectedService || 'Not specified'}</div>
                        <div><strong>Priority:</strong> ${incident.priority || 'Not specified'}</div>
                        <div><strong>Impact Level:</strong> ${incident.impactLevel || 'Not specified'}</div>
                        <div><strong>Assigned To:</strong> ${incident.assignedTo || 'Unassigned'}</div>
                        <div><strong>External References:</strong> ${incident.externalRefs || 'None'}</div>
                    </div>
                </div>
                
                <div>
                    <h4 class="text-md font-medium text-gray-800 mb-2">Timeline</h4>
                    <div class="space-y-2">
                        <div><strong>Created:</strong> ${formatDateTime(incident.createdAt)}</div>
                        <div><strong>Created By:</strong> ${incident.createdBy}</div>
                        <div><strong>Last Updated:</strong> ${formatDateTime(incident.updatedAt)}</div>
                        ${incident.resolvedAt ? `<div><strong>Resolved:</strong> ${formatDateTime(incident.resolvedAt)}</div>` : ''}
                        ${incident.closedAt ? `<div><strong>Closed:</strong> ${formatDateTime(incident.closedAt)}</div>` : ''}
                    </div>
                </div>
            </div>

            <div class="incident-description mb-6">
                <h4 class="text-md font-medium text-gray-800 mb-2">Description</h4>
                <div class="bg-gray-50 p-3 rounded-lg">
                    <p class="text-sm text-gray-700">${incident.description}</p>
                </div>
            </div>

            ${incident.statusHistory && incident.statusHistory.length > 0 ? `
                <div class="status-history mb-6">
                    <h4 class="text-md font-medium text-gray-800 mb-2">Status History</h4>
                    <div class="timeline">
                        ${incident.statusHistory.reverse().map(history => `
                            <div class="timeline-item">
                                <div class="timeline-marker"></div>
                                <div class="timeline-content">
                                    <div class="flex justify-between items-center">
                                        <span class="incident-status-badge status-${history.status}">${history.status.replace('-', ' ').toUpperCase()}</span>
                                        <span class="text-sm text-gray-500">${formatDateTime(history.changedAt)}</span>
                                    </div>
                                    <p class="text-sm text-gray-600 mt-1">Changed by: ${history.changedBy}</p>
                                    ${history.notes ? `<p class="text-sm text-gray-700 mt-1">${history.notes}</p>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="incident-actions mt-6 flex justify-between">
                <div class="space-x-2">
                    <button onclick="editIncident('${incident.id}')" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        Edit Incident
                    </button>
                    <button onclick="changeIncidentStatus('${incident.id}')" class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                        Change Status
                    </button>
                    <button onclick="escalateIncident('${incident.id}')" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                        Escalate
                    </button>
                </div>
                <button onclick="closeModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                    Close
                </button>
            </div>
        </div>

        <style>
        .incident-details .metric-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
        }
        
        .severity-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .timeline {
            position: relative;
            padding-left: 1.5rem;
        }
        
        .timeline-item {
            position: relative;
            margin-bottom: 1rem;
        }
        
        .timeline-marker {
            position: absolute;
            left: -1.5rem;
            top: 0.25rem;
            width: 0.75rem;
            height: 0.75rem;
            background: #3b82f6;
            border-radius: 50%;
        }
        
        .timeline-item:not(:last-child)::before {
            content: '';
            position: absolute;
            left: -1.125rem;
            top: 1rem;
            width: 2px;
            height: calc(100% + 0.5rem);
            background: #e5e7eb;
        }
        
        .timeline-content {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 0.75rem;
        }
        </style>
    `;

    createModal(`Incident Details`, content, []);
}

async function changeIncidentStatus(incidentId) {
    const incidents = getIncidents();
    const incident = incidents.find(i => i.id === incidentId);
    
    if (!incident) {
        showNotification('Incident not found', 'error');
        return;
    }

    const availableStatuses = INCIDENT_CONFIG.statusWorkflow[incident.status] || [];
    
    const content = `
        <div class="status-change-form">
            <p class="text-sm text-gray-600 mb-4">Current status: <span class="incident-status-badge status-${incident.status}">${incident.status.replace('-', ' ').toUpperCase()}</span></p>
            
            <form id="statusChangeForm">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">New Status *</label>
                    <select id="newStatusSelect" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="">Select new status</option>
                        ${availableStatuses.map(status => 
                            `<option value="${status}">${status.replace('-', ' ').toUpperCase()}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea id="statusChangeNotes" rows="3" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Add notes about this status change..."></textarea>
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button type="button" onclick="closeModal()" 
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type="submit" 
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        Update Status
                    </button>
                </div>
            </form>
        </div>
    `;

    createModal('Change Incident Status', content, []);

    // Handle form submission
    document.getElementById('statusChangeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newStatus = document.getElementById('newStatusSelect').value;
        const notes = document.getElementById('statusChangeNotes').value;
        
        if (!newStatus) {
            showNotification('Please select a new status', 'error');
            return;
        }

        // Update incident
        const incidentIndex = incidents.findIndex(i => i.id === incidentId);
        const now = new Date().toISOString();
        
        incidents[incidentIndex].status = newStatus;
        incidents[incidentIndex].updatedAt = now;
        
        // Add to status history
        if (!incidents[incidentIndex].statusHistory) {
            incidents[incidentIndex].statusHistory = [];
        }
        
        incidents[incidentIndex].statusHistory.push({
            status: newStatus,
            changedBy: 'current-user@company.com',
            changedAt: now,
            notes: notes
        });

        // Set resolved/closed timestamps
        if (newStatus === 'resolved' && !incidents[incidentIndex].resolvedAt) {
            incidents[incidentIndex].resolvedAt = now;
        }
        if (newStatus === 'closed' && !incidents[incidentIndex].closedAt) {
            incidents[incidentIndex].closedAt = now;
        }

        // Log activity
        const activity = {
            id: Date.now().toString(),
            incidentId: incidentId,
            type: 'status-change',
            description: `Status changed from ${incident.status} to ${newStatus}`,
            user: 'current-user@company.com',
            timestamp: now,
            metadata: { notes: notes }
        };
        logIncidentActivity(activity);

        localStorage.setItem('incidents', JSON.stringify(incidents));
        closeModal();
        showNotification('Incident status updated successfully', 'success');
        showIncidents(); // Refresh display
    });
}

async function escalateIncident(incidentId) {
    const incidents = getIncidents();
    const incident = incidents.find(i => i.id === incidentId);
    
    if (!incident) {
        showNotification('Incident not found', 'error');
        return;
    }

    const content = `
        <div class="escalation-form">
            <div class="mb-4">
                <h4 class="text-md font-medium text-gray-800 mb-2">Incident Information</h4>
                <div class="bg-gray-50 p-3 rounded-lg space-y-1">
                    <div><strong>Title:</strong> ${incident.title}</div>
                    <div><strong>Current Status:</strong> <span class="incident-status-badge status-${incident.status}">${incident.status.replace('-', ' ').toUpperCase()}</span></div>
                    <div><strong>Severity:</strong> ${INCIDENT_CONFIG.severityLevels[incident.severity].label}</div>
                    <div><strong>Assigned To:</strong> ${incident.assignedTo || 'Unassigned'}</div>
                </div>
            </div>
            
            <form id="escalationForm">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Escalation Reason *</label>
                    <select id="escalationReason" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="">Select reason</option>
                        <option value="sla-breach">SLA Breach</option>
                        <option value="severity-increase">Severity Increase</option>
                        <option value="complex-issue">Complex Issue Requiring Expertise</option>
                        <option value="resource-unavailable">Assigned Resource Unavailable</option>
                        <option value="management-request">Management Request</option>
                        <option value="customer-escalation">Customer Escalation</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Escalate To *</label>
                    <select id="escalateTo" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="">Select escalation target</option>
                        <option value="sarah.wilson@company.com">Sarah Wilson (Security Manager)</option>
                        <option value="team-leads@company.com">Team Leads</option>
                        <option value="senior-management@company.com">Senior Management</option>
                        <option value="external-vendor@company.com">External Vendor</option>
                        <option value="incident-commander@company.com">Incident Commander</option>
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Escalation Notes *</label>
                    <textarea id="escalationNotes" rows="4" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Explain why this incident needs to be escalated and any relevant context..." required></textarea>
                </div>
                
                <div class="mb-4">
                    <label class="flex items-center">
                        <input type="checkbox" id="urgentEscalation" class="mr-2">
                        <span class="text-sm text-gray-700">Mark as urgent escalation</span>
                    </label>
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button type="button" onclick="closeModal()" 
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type="submit" 
                        class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                        Escalate Incident
                    </button>
                </div>
            </form>
        </div>
    `;

    createModal('Escalate Incident', content, []);

    // Handle form submission
    document.getElementById('escalationForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const escalationData = {
            reason: document.getElementById('escalationReason').value,
            escalateTo: document.getElementById('escalateTo').value,
            notes: document.getElementById('escalationNotes').value,
            urgent: document.getElementById('urgentEscalation').checked
        };
        
        if (!escalationData.reason || !escalationData.escalateTo || !escalationData.notes) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Update incident
        const incidentIndex = incidents.findIndex(i => i.id === incidentId);
        const now = new Date().toISOString();
        
        incidents[incidentIndex].status = 'escalated';
        incidents[incidentIndex].escalatedTo = escalationData.escalateTo;
        incidents[incidentIndex].escalatedAt = now;
        incidents[incidentIndex].escalationReason = escalationData.reason;
        incidents[incidentIndex].updatedAt = now;
        
        // Add to status history
        if (!incidents[incidentIndex].statusHistory) {
            incidents[incidentIndex].statusHistory = [];
        }
        
        incidents[incidentIndex].statusHistory.push({
            status: 'escalated',
            changedBy: 'current-user@company.com',
            changedAt: now,
            notes: `Escalated to ${escalationData.escalateTo}. Reason: ${escalationData.reason}. ${escalationData.notes}`
        });

        // Log activity
        const activity = {
            id: Date.now().toString(),
            incidentId: incidentId,
            type: 'escalated',
            description: `Incident escalated to ${escalationData.escalateTo}`,
            user: 'current-user@company.com',
            timestamp: now,
            metadata: escalationData
        };
        logIncidentActivity(activity);

        localStorage.setItem('incidents', JSON.stringify(incidents));
        closeModal();
        showNotification(`Incident escalated to ${escalationData.escalateTo}`, 'success');
        showIncidents(); // Refresh display
    });
}

function checkEscalationRules() {
    const incidents = getIncidents();
    const now = new Date();
    
    incidents.forEach(incident => {
        if (incident.status === 'closed' || incident.status === 'resolved') {
            return; // Skip closed/resolved incidents
        }

        INCIDENT_CONFIG.escalationRules.forEach(rule => {
            if (rule.condition(incident)) {
                executeEscalationAction(incident, rule);
            }
        });
    });
}

function executeEscalationAction(incident, rule) {
    const now = new Date().toISOString();
    
    // Avoid duplicate escalations
    if (incident.lastEscalationCheck && 
        new Date(incident.lastEscalationCheck) > new Date(now - 15 * 60 * 1000)) {
        return; // Already checked in last 15 minutes
    }

    switch (rule.action) {
        case 'escalate-to-manager':
            if (incident.status !== 'escalated') {
                // Auto-escalate to manager
                incident.status = 'escalated';
                incident.escalatedTo = 'sarah.wilson@company.com';
                incident.escalatedAt = now;
                incident.escalationReason = rule.name;
                
                const activity = {
                    id: Date.now().toString(),
                    incidentId: incident.id,
                    type: 'auto-escalated',
                    description: `Auto-escalated due to: ${rule.name}`,
                    user: 'system',
                    timestamp: now,
                    metadata: { rule: rule.id }
                };
                logIncidentActivity(activity);
            }
            break;
            
        case 'escalate-to-senior-management':
            if (!incident.escalatedTo || incident.escalatedTo !== 'senior-management@company.com') {
                incident.escalatedTo = 'senior-management@company.com';
                incident.escalationReason = rule.name;
                
                const activity = {
                    id: Date.now().toString(),
                    incidentId: incident.id,
                    type: 'sla-breach-escalation',
                    description: `Escalated to senior management due to: ${rule.name}`,
                    user: 'system',
                    timestamp: now,
                    metadata: { rule: rule.id }
                };
                logIncidentActivity(activity);
            }
            break;
            
        case 'auto-assign-critical':
            if (!incident.assignedTo) {
                incident.assignedTo = 'team-security@company.com';
                incident.status = 'assigned';
                
                const activity = {
                    id: Date.now().toString(),
                    incidentId: incident.id,
                    type: 'auto-assigned',
                    description: 'Critical incident auto-assigned to security team',
                    user: 'system',
                    timestamp: now,
                    metadata: { rule: rule.id }
                };
                logIncidentActivity(activity);
            }
            break;
    }
    
    incident.lastEscalationCheck = now;
    incident.updatedAt = now;
    
    // Save updated incidents
    const incidents = getIncidents();
    const incidentIndex = incidents.findIndex(i => i.id === incident.id);
    if (incidentIndex !== -1) {
        incidents[incidentIndex] = incident;
        localStorage.setItem('incidents', JSON.stringify(incidents));
    }
}

function getIncidentMetrics() {
    const incidents = getIncidents();
    const activities = getIncidentActivities();
    const now = new Date();
    
    // Basic metrics
    const totalIncidents = incidents.length;
    const openIncidents = incidents.filter(i => ['open', 'assigned', 'investigating', 'in-progress', 'waiting-for-info', 'escalated'].includes(i.status)).length;
    const criticalIncidents = incidents.filter(i => i.severity === 'critical' && !['closed', 'resolved'].includes(i.status)).length;
    const slaBreaches = incidents.filter(i => {
        if (['closed', 'resolved'].includes(i.status)) return false;
        const config = INCIDENT_CONFIG.severityLevels[i.severity];
        const createdTime = new Date(i.createdAt);
        const minutesElapsed = (now - createdTime) / (1000 * 60);
        return minutesElapsed > config.sla;
    }).length;
    
    // Resolution metrics
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length;
    const avgResolutionTime = calculateAverageResolutionTime(incidents);
    
    // Trending data (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentIncidents = incidents.filter(i => new Date(i.createdAt) >= thirtyDaysAgo);
    const incidentTrend = calculateIncidentTrend(recentIncidents);
    
    return {
        totalIncidents,
        openIncidents,
        criticalIncidents,
        slaBreaches,
        resolvedIncidents,
        avgResolutionTime,
        recentIncidents: recentIncidents.length,
        incidentTrend,
        severityBreakdown: calculateSeverityBreakdown(incidents),
        statusBreakdown: calculateStatusBreakdown(incidents)
    };
}

function calculateAverageResolutionTime(incidents) {
    const resolvedIncidents = incidents.filter(i => i.resolvedAt || i.closedAt);
    if (resolvedIncidents.length === 0) return 0;
    
    const totalMinutes = resolvedIncidents.reduce((sum, incident) => {
        const endTime = new Date(incident.resolvedAt || incident.closedAt);
        const startTime = new Date(incident.createdAt);
        return sum + (endTime - startTime) / (1000 * 60);
    }, 0);
    
    return Math.round(totalMinutes / resolvedIncidents.length);
}

function calculateIncidentTrend(recentIncidents) {
    const now = new Date();
    const trend = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const dayIncidents = recentIncidents.filter(incident => {
            const createdDate = new Date(incident.createdAt);
            return createdDate >= dayStart && createdDate < dayEnd;
        });
        
        trend.push({
            date: dayStart.toISOString().split('T')[0],
            count: dayIncidents.length
        });
    }
    
    return trend;
}

function calculateSeverityBreakdown(incidents) {
    const breakdown = {};
    Object.keys(INCIDENT_CONFIG.severityLevels).forEach(severity => {
        breakdown[severity] = incidents.filter(i => i.severity === severity).length;
    });
    return breakdown;
}

function calculateStatusBreakdown(incidents) {
    const breakdown = {};
    const statuses = ['open', 'assigned', 'investigating', 'in-progress', 'waiting-for-info', 'escalated', 'resolved', 'closed'];
    statuses.forEach(status => {
        breakdown[status] = incidents.filter(i => i.status === status).length;
    });
    return breakdown;
}

function showIncidentMetrics() {
    const metrics = getIncidentMetrics();
    
    const content = `
        <div class="incident-metrics">
            <div class="metrics-header mb-6">
                <h3 class="text-lg font-semibold text-gray-900">Incident Management Metrics</h3>
                <p class="text-sm text-gray-600">Overview of incident management performance and trends</p>
            </div>
            
            <div class="metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="metric-card">
                    <div class="metric-value text-2xl font-bold text-blue-600">${metrics.totalIncidents}</div>
                    <div class="metric-label text-sm text-gray-600">Total Incidents</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-value text-2xl font-bold text-orange-600">${metrics.openIncidents}</div>
                    <div class="metric-label text-sm text-gray-600">Open Incidents</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-value text-2xl font-bold text-red-600">${metrics.criticalIncidents}</div>
                    <div class="metric-label text-sm text-gray-600">Critical Open</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-value text-2xl font-bold ${metrics.slaBreaches > 0 ? 'text-red-600' : 'text-green-600'}">${metrics.slaBreaches}</div>
                    <div class="metric-label text-sm text-gray-600">SLA Breaches</div>
                </div>
            </div>
            
            <div class="metrics-details grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="metrics-section">
                    <h4 class="text-md font-semibold text-gray-800 mb-3">Performance Metrics</h4>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-sm text-gray-600">Resolved Incidents:</span>
                            <span class="text-sm font-medium">${metrics.resolvedIncidents}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-gray-600">Avg Resolution Time:</span>
                            <span class="text-sm font-medium">${Math.floor(metrics.avgResolutionTime / 60)}h ${metrics.avgResolutionTime % 60}m</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-gray-600">Recent Incidents (30d):</span>
                            <span class="text-sm font-medium">${metrics.recentIncidents}</span>
                        </div>
                    </div>
                </div>
                
                <div class="metrics-section">
                    <h4 class="text-md font-semibold text-gray-800 mb-3">Severity Breakdown</h4>
                    <div class="space-y-2">
                        ${Object.entries(metrics.severityBreakdown).map(([severity, count]) => `
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600 capitalize">${severity}:</span>
                                <div class="flex items-center space-x-2">
                                    <div class="w-16 bg-gray-200 rounded-full h-2">
                                        <div class="h-2 rounded-full" style="width: ${metrics.totalIncidents > 0 ? (count / metrics.totalIncidents * 100) : 0}%; background-color: ${INCIDENT_CONFIG.severityLevels[severity].color};"></div>
                                    </div>
                                    <span class="text-sm font-medium w-8 text-right">${count}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="metrics-details grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="metrics-section">
                    <h4 class="text-md font-semibold text-gray-800 mb-3">Status Distribution</h4>
                    <div class="space-y-2">
                        ${Object.entries(metrics.statusBreakdown).filter(([status, count]) => count > 0).map(([status, count]) => `
                            <div class="flex justify-between items-center">
                                <span class="incident-status-badge status-${status}">${status.replace('-', ' ').toUpperCase()}</span>
                                <span class="text-sm font-medium">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="metrics-section">
                    <h4 class="text-md font-semibold text-gray-800 mb-3">7-Day Trend</h4>
                    <div class="trend-chart">
                        ${metrics.incidentTrend.map(day => `
                            <div class="trend-day">
                                <div class="trend-bar" style="height: ${day.count * 20 + 10}px;"></div>
                                <div class="trend-label">${new Date(day.date).getDate()}</div>
                                <div class="trend-count">${day.count}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
        
        <style>
        .incident-metrics .metric-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
            text-align: center;
        }
        
        .metrics-section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
        }
        
        .trend-chart {
            display: flex;
            justify-content: space-between;
            align-items: end;
            height: 100px;
            padding: 10px 0;
        }
        
        .trend-day {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
        }
        
        .trend-bar {
            background: #3b82f6;
            width: 20px;
            border-radius: 2px;
            margin-bottom: 5px;
        }
        
        .trend-label {
            font-size: 10px;
            color: #6b7280;
        }
        
        .trend-count {
            font-size: 10px;
            font-weight: 600;
            color: #374151;
        }
        </style>
    `;

    createModal('Incident Management Metrics', content, [
        {
            text: 'Close',
            class: 'px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300',
            onclick: 'closeModal()'
        }
    ]);
}

// Enhanced incident display functions
function showEnhancedIncidents() {
    const incidents = getIncidents();
    const metrics = getIncidentMetrics();
    
    // Use the main content element - check both possible IDs
    const mainContentEl = document.getElementById('mainContent') || document.getElementById('main-content');
    if (!mainContentEl) {
        console.error('Main content element not found - checked both mainContent and main-content');
        showNotification('Unable to load incidents page', 'error');
        return;
    }
    
    mainContentEl.innerHTML = `
        <div class="incidents-dashboard">
            <div class="dashboard-header flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Incident Management</h2>
                    <p class="text-gray-600">Manage and track security incidents with automated workflows</p>
                </div>
                <div class="flex space-x-3">
                    <button onclick="showIncidentMetrics()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                        <i class="fas fa-chart-bar mr-2"></i>View Metrics
                    </button>
                    <button onclick="checkEscalationRules()" class="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700">
                        <i class="fas fa-exclamation-triangle mr-2"></i>Check Escalations
                    </button>
                    <button onclick="createIncident()" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>Create Incident
                    </button>
                </div>
            </div>
            
            <!-- Quick Stats -->
            <div class="quick-stats grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="stat-card">
                    <div class="stat-value text-xl font-bold text-orange-600">${metrics.openIncidents}</div>
                    <div class="stat-label text-sm text-gray-600">Open Incidents</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value text-xl font-bold text-red-600">${metrics.criticalIncidents}</div>
                    <div class="stat-label text-sm text-gray-600">Critical</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value text-xl font-bold ${metrics.slaBreaches > 0 ? 'text-red-600' : 'text-green-600'}">${metrics.slaBreaches}</div>
                    <div class="stat-label text-sm text-gray-600">SLA Breaches</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value text-xl font-bold text-blue-600">${Math.floor(metrics.avgResolutionTime / 60)}h ${metrics.avgResolutionTime % 60}m</div>
                    <div class="stat-label text-sm text-gray-600">Avg Resolution</div>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="incident-filters mb-4">
                <div class="flex flex-wrap gap-3 items-center">
                    <select id="statusFilter" onchange="filterIncidents()" class="px-3 py-1 border border-gray-300 rounded text-sm">
                        <option value="">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="assigned">Assigned</option>
                        <option value="investigating">Investigating</option>
                        <option value="in-progress">In Progress</option>
                        <option value="escalated">Escalated</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                    
                    <select id="severityFilter" onchange="filterIncidents()" class="px-3 py-1 border border-gray-300 rounded text-sm">
                        <option value="">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    
                    <select id="assigneeFilter" onchange="filterIncidents()" class="px-3 py-1 border border-gray-300 rounded text-sm">
                        <option value="">All Assignees</option>
                        <option value="unassigned">Unassigned</option>
                        <option value="john.doe@company.com">John Doe</option>
                        <option value="jane.smith@company.com">Jane Smith</option>
                        <option value="mike.johnson@company.com">Mike Johnson</option>
                        <option value="team-security@company.com">Security Team</option>
                    </select>
                    
                    <input type="text" id="searchIncidents" placeholder="Search incidents..." 
                        onkeyup="filterIncidents()" 
                        class="px-3 py-1 border border-gray-300 rounded text-sm">
                </div>
            </div>
            
            <!-- Incidents Table -->
            <div class="incidents-table-container">
                <div class="overflow-x-auto">
                    <table class="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incident</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA Status</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="incidentsTableBody" class="bg-white divide-y divide-gray-200">
                            ${generateIncidentTableRows(incidents)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <style>
        .stat-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
        }
        
        .incidents-table-container {
            background: white;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        </style>
    `;
}

function generateIncidentTableRows(incidents) {
    if (incidents.length === 0) {
        return `
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-clipboard-list text-4xl mb-2 opacity-50"></i>
                    <p>No incidents found</p>
                </td>
            </tr>
        `;
    }

    return incidents.map(incident => {
        const severityConfig = INCIDENT_CONFIG.severityLevels[incident.severity];
        const createdTime = new Date(incident.createdAt);
        const now = new Date();
        const minutesElapsed = Math.floor((now - createdTime) / (1000 * 60));
        const slaRemaining = severityConfig.sla - minutesElapsed;
        const slaStatus = slaRemaining > 0 ? 'within-sla' : 'sla-breached';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                    <div>
                        <div class="text-sm font-medium text-gray-900">${incident.title}</div>
                        <div class="text-sm text-gray-500">ID: ${incident.id}</div>
                        ${incident.affectedService ? `<div class="text-xs text-gray-400">${incident.affectedService}</div>` : ''}
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="incident-status-badge status-${incident.status}">${incident.status.replace('-', ' ').toUpperCase()}</span>
                </td>
                <td class="px-4 py-3">
                    <span class="severity-badge severity-${incident.severity}" style="background-color: ${severityConfig.color}20; color: ${severityConfig.color};">
                        ${severityConfig.label}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm text-gray-900">${incident.assignedTo || 'Unassigned'}</div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm ${slaStatus === 'within-sla' ? 'text-green-600' : 'text-red-600'}">
                        ${slaStatus === 'within-sla' ? 
                            `${Math.floor(slaRemaining / 60)}h ${slaRemaining % 60}m` : 
                            `Breached by ${Math.abs(Math.floor(slaRemaining / 60))}h ${Math.abs(slaRemaining % 60)}m`
                        }
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm text-gray-900">${formatDateTime(incident.createdAt)}</div>
                </td>
                <td class="px-4 py-3">
                    <div class="flex space-x-2">
                        <button onclick="showIncidentDetails('${incident.id}')" 
                            class="text-blue-600 hover:text-blue-800 text-sm">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editIncident('${incident.id}')" 
                            class="text-green-600 hover:text-green-800 text-sm">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="changeIncidentStatus('${incident.id}')" 
                            class="text-orange-600 hover:text-orange-800 text-sm">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterIncidents() {
    const statusFilter = document.getElementById('statusFilter').value;
    const severityFilter = document.getElementById('severityFilter').value;
    const assigneeFilter = document.getElementById('assigneeFilter').value;
    const searchTerm = document.getElementById('searchIncidents').value.toLowerCase();
    
    let incidents = getIncidents();
    
    // Apply filters
    if (statusFilter) {
        incidents = incidents.filter(incident => incident.status === statusFilter);
    }
    
    if (severityFilter) {
        incidents = incidents.filter(incident => incident.severity === severityFilter);
    }
    
    if (assigneeFilter) {
        if (assigneeFilter === 'unassigned') {
            incidents = incidents.filter(incident => !incident.assignedTo);
        } else {
            incidents = incidents.filter(incident => incident.assignedTo === assigneeFilter);
        }
    }
    
    if (searchTerm) {
        incidents = incidents.filter(incident => 
            incident.title.toLowerCase().includes(searchTerm) ||
            incident.description.toLowerCase().includes(searchTerm) ||
            incident.id.toLowerCase().includes(searchTerm)
        );
    }
    
    // Update table
    document.getElementById('incidentsTableBody').innerHTML = generateIncidentTableRows(incidents);
}

// Helper functions
function createIncident() {
    const content = getIncidentFormHTML();
    createModal('Create New Incident', content, []);
    
    // Handle form submission with delay to ensure DOM is ready
    setTimeout(() => {
        const form = document.getElementById('incidentForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleIncidentSubmit();
            });
        } else {
            console.error('Incident form not found in modal');
        }
    }, 100);
}

function editIncident(incidentId) {
    const incidents = getIncidents();
    const incident = incidents.find(i => i.id === incidentId);
    
    if (!incident) {
        showNotification('Incident not found', 'error');
        return;
    }
    
    const content = getIncidentFormHTML(incident);
    createModal('Edit Incident', content, []);
    
    // Handle form submission with delay to ensure DOM is ready
    setTimeout(() => {
        const form = document.getElementById('incidentForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleIncidentSubmit(incidentId);
            });
        } else {
            console.error('Incident form not found in modal');
        }
    }, 100);
}

function getIncidents() {
    return JSON.parse(localStorage.getItem('incidents') || '[]');
}

function getIncidentActivities() {
    return JSON.parse(localStorage.getItem('incidentActivities') || '[]');
}

function logIncidentActivity(activity) {
    const activities = getIncidentActivities();
    activities.push(activity);
    localStorage.setItem('incidentActivities', JSON.stringify(activities));
}

// Removed duplicate simple formatDateTime; keeping the robust version below

// Auto-run escalation check every 10 minutes (reduced from 5 minutes to avoid rate limiting)
setInterval(checkEscalationRules, 10 * 60 * 1000);

// Initialize with sample data if no incidents exist
function initializeIncidentData() {
    const incidents = getIncidents();
    if (incidents.length === 0) {
        const sampleIncidents = [
            {
                id: '1',
                title: 'Database Connection Timeout',
                severity: 'high',
                status: 'investigating',
                affectedService: 'database',
                category: 'system-failure',
                description: 'Multiple users reporting inability to access the application due to database connection timeouts.',
                assignedTo: 'john.doe@company.com',
                priority: 'high',
                impactLevel: 'high',
                affectedUsers: 150,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
                createdBy: 'sarah.wilson@company.com',
                statusHistory: [
                    {
                        status: 'open',
                        changedBy: 'sarah.wilson@company.com',
                        changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                        notes: 'Incident created from monitoring alert'
                    },
                    {
                        status: 'assigned',
                        changedBy: 'system',
                        changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
                        notes: 'Auto-assigned to John Doe'
                    },
                    {
                        status: 'investigating',
                        changedBy: 'john.doe@company.com',
                        changedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                        notes: 'Started investigation - checking database logs'
                    }
                ]
            },
            {
                id: '2',
                title: 'Suspicious Login Activity Detected',
                severity: 'critical',
                status: 'escalated',
                affectedService: 'authentication',
                category: 'security-incident',
                description: 'Automated security monitoring detected multiple failed login attempts from unusual geographic locations.',
                assignedTo: 'team-security@company.com',
                escalatedTo: 'sarah.wilson@company.com',
                priority: 'critical',
                impactLevel: 'medium',
                affectedUsers: 5,
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
                updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
                escalatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                escalationReason: 'SLA Breach Escalation',
                createdBy: 'system',
                statusHistory: [
                    {
                        status: 'open',
                        changedBy: 'system',
                        changedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                        notes: 'Incident auto-created from security monitoring'
                    },
                    {
                        status: 'assigned',
                        changedBy: 'system',
                        changedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(),
                        notes: 'Auto-assigned to security team due to critical severity'
                    },
                    {
                        status: 'escalated',
                        changedBy: 'system',
                        changedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                        notes: 'Auto-escalated to Sarah Wilson due to SLA breach'
                    }
                ]
            }
        ];
        
        localStorage.setItem('incidents', JSON.stringify(sampleIncidents));
    }
}

// Make functions globally accessible
window.showEnhancedIncidents = showEnhancedIncidents;
window.createIncident = createIncident;
window.editIncident = editIncident;
window.showIncidentDetails = showIncidentDetails;
window.changeIncidentStatus = changeIncidentStatus;
window.escalateIncident = escalateIncident;
window.showIncidentMetrics = showIncidentMetrics;
window.checkEscalationRules = checkEscalationRules;
window.filterIncidents = filterIncidents;

// Utility functions for incident management
function formatDateTime(dateString) {
    if (!dateString) return 'Never';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
        return 'Invalid Date';
    }
}

function showNotification(message, type = 'info') {
    // Create or get notification container
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    const bgColor = {
        'success': 'bg-green-500',
        'error': 'bg-red-500',
        'warning': 'bg-yellow-500',
        'info': 'bg-blue-500'
    }[type] || 'bg-blue-500';
    
    notification.className = `${bgColor} text-white px-4 py-2 rounded-lg shadow-lg opacity-90 transition-opacity duration-300`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Use global modal helpers from modules.js to avoid duplicate identifiers
// function createModal(...) and function closeModal() are intentionally omitted here to prevent collisions.

function updateActiveNavigation(page) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to current page
    const currentNav = document.getElementById(`nav-${page}`);
    if (currentNav) {
        currentNav.classList.add('active');
    }
}

// Initialize sample data on load
document.addEventListener('DOMContentLoaded', function() {
    initializeIncidentData();
});
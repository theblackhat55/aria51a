/**
 * Enhanced Compliance Dashboard JavaScript
 * 
 * Provides interactive functionality for:
 * - AI-powered compliance assessments
 * - Real-time risk-compliance integration
 * - Automated workflow management
 * - Advanced analytics and visualizations
 * - Interactive compliance maturity scoring
 */

class EnhancedComplianceDashboard {
    constructor() {
        this.frameworkId = null;
        this.aiAssessmentInProgress = false;
        this.charts = {};
        this.websocket = null;
        this.autoRefreshInterval = null;
        
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.initializeCharts();
        this.setupWebSocketConnection();
        this.startAutoRefresh();
        
        // Get framework ID from URL or page data
        this.frameworkId = this.getFrameworkIdFromPage();
        
        if (this.frameworkId) {
            this.loadDashboardData();
        }
    }

    setupEventListeners() {
        // AI Assessment buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="ai-assess-control"]')) {
                const controlId = e.target.dataset.controlId;
                this.performAIControlAssessment(controlId);
            }
            
            if (e.target.matches('[data-action="bulk-ai-assessment"]')) {
                this.performBulkAIAssessment();
            }
            
            if (e.target.matches('[data-action="generate-gap-analysis"]')) {
                this.generateGapAnalysis();
            }
            
            if (e.target.matches('[data-action="generate-remediation-plan"]')) {
                this.generateRemediationPlan();
            }
            
            if (e.target.matches('[data-action="start-automation"]')) {
                const ruleId = e.target.dataset.ruleId;
                this.startAutomationRule(ruleId);
            }
            
            if (e.target.matches('[data-action="view-assessment-history"]')) {
                const controlId = e.target.dataset.controlId;
                this.viewAssessmentHistory(controlId);
            }
        });

        // Real-time updates
        document.addEventListener('htmx:afterRequest', (e) => {
            if (e.detail.xhr.status === 200) {
                this.updateDashboardMetrics();
            }
        });

        // Modal event handlers
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-close') || e.target.matches('.modal-backdrop')) {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.refreshDashboard();
            }
        });
    }

    initializeCharts() {
        // Initialize Chart.js charts for enhanced visualizations
        this.initializeComplianceOverviewChart();
        this.initializeMaturityRadarChart();
        this.initializeRiskComplianceMatrixChart();
        this.initializeTrendAnalysisChart();
    }

    setupWebSocketConnection() {
        // Setup WebSocket for real-time updates (if available)
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/compliance`;
            
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealtimeUpdate(data);
            };
            
            this.websocket.onerror = (error) => {
                console.log('WebSocket connection not available, using polling instead');
            };
        } catch (error) {
            console.log('WebSocket not supported, using polling for updates');
        }
    }

    startAutoRefresh() {
        // Auto-refresh dashboard every 30 seconds
        this.autoRefreshInterval = setInterval(() => {
            this.updateDashboardMetrics();
        }, 30000);
    }

    async performAIControlAssessment(controlId) {
        if (this.aiAssessmentInProgress) {
            this.showNotification('AI assessment already in progress', 'warning');
            return;
        }

        try {
            this.aiAssessmentInProgress = true;
            this.showLoadingIndicator(`Performing AI assessment for control ${controlId}...`);

            const response = await fetch('/api/ai-compliance/assess-control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    controlId: parseInt(controlId),
                    assessmentType: 'gap_analysis',
                    organizationContext: this.getOrganizationContext()
                })
            });

            const result = await response.json();

            if (result.success) {
                this.displayAIAssessmentResults(result.data);
                this.updateControlStatus(controlId, result.data);
                this.showNotification('AI assessment completed successfully', 'success');
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('AI Assessment Error:', error);
            this.showNotification(`AI assessment failed: ${error.message}`, 'error');
        } finally {
            this.aiAssessmentInProgress = false;
            this.hideLoadingIndicator();
        }
    }

    async performBulkAIAssessment() {
        try {
            this.showLoadingIndicator('Performing bulk AI assessment...');

            // Get all control IDs from the current framework
            const controlIds = this.getSelectedControlIds();
            
            if (controlIds.length === 0) {
                this.showNotification('No controls selected for assessment', 'warning');
                return;
            }

            const response = await fetch('/api/ai-compliance/bulk-assess', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    frameworkId: this.frameworkId,
                    controlIds: controlIds,
                    assessmentType: 'gap_analysis',
                    organizationContext: this.getOrganizationContext()
                })
            });

            const result = await response.json();

            if (result.success) {
                this.displayBulkAssessmentResults(result.data);
                this.refreshControlsList();
                this.showNotification(`Bulk assessment completed: ${result.data.successful}/${result.data.total} successful`, 'success');
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Bulk Assessment Error:', error);
            this.showNotification(`Bulk assessment failed: ${error.message}`, 'error');
        } finally {
            this.hideLoadingIndicator();
        }
    }

    async generateGapAnalysis() {
        try {
            this.showLoadingIndicator('Generating comprehensive gap analysis...');

            const response = await fetch('/api/ai-compliance/gap-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    frameworkId: this.frameworkId,
                    organizationContext: this.getOrganizationContext()
                })
            });

            const result = await response.json();

            if (result.success) {
                this.displayGapAnalysis(result.data);
                this.updateDashboardMetrics();
                this.showNotification('Gap analysis completed successfully', 'success');
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Gap Analysis Error:', error);
            this.showNotification(`Gap analysis failed: ${error.message}`, 'error');
        } finally {
            this.hideLoadingIndicator();
        }
    }

    async generateRemediationPlan() {
        try {
            this.showLoadingIndicator('Generating AI-powered remediation plan...');

            // First get the latest gap analysis
            const gapAnalysisResponse = await fetch('/api/ai-compliance/gap-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    frameworkId: this.frameworkId,
                    organizationContext: this.getOrganizationContext()
                })
            });

            const gapAnalysis = await gapAnalysisResponse.json();

            if (!gapAnalysis.success) {
                throw new Error('Failed to get gap analysis data');
            }

            // Generate remediation plan based on gap analysis
            const response = await fetch('/api/ai-compliance/remediation-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(gapAnalysis.data)
            });

            const result = await response.json();

            if (result.success) {
                this.displayRemediationPlan(result.data);
                this.showNotification('Remediation plan generated successfully', 'success');
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Remediation Plan Error:', error);
            this.showNotification(`Remediation plan generation failed: ${error.message}`, 'error');
        } finally {
            this.hideLoadingIndicator();
        }
    }

    async startAutomationRule(ruleId) {
        try {
            this.showLoadingIndicator(`Starting automation rule ${ruleId}...`);

            const response = await fetch(`/api/compliance/automation/execute/${ruleId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Automation rule started successfully', 'success');
                this.updateAutomationStatus(ruleId, 'running');
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Automation Start Error:', error);
            this.showNotification(`Failed to start automation: ${error.message}`, 'error');
        } finally {
            this.hideLoadingIndicator();
        }
    }

    async loadDashboardData() {
        try {
            const response = await fetch(`/api/ai-compliance/dashboard/${this.frameworkId}`);
            const result = await response.json();

            if (result.success) {
                this.updateDashboardWithData(result.data);
            }
        } catch (error) {
            console.error('Dashboard Load Error:', error);
        }
    }

    async updateDashboardMetrics() {
        try {
            // Update various dashboard sections
            await Promise.all([
                this.updateComplianceMetrics(),
                this.updateRiskMetrics(),
                this.updateAutomationMetrics(),
                this.updateRecentActivity()
            ]);
        } catch (error) {
            console.error('Dashboard Update Error:', error);
        }
    }

    async updateComplianceMetrics() {
        try {
            const response = await fetch(`/api/ai-compliance/maturity-score/${this.frameworkId}`);
            const result = await response.json();

            if (result.success) {
                this.updateMaturityDisplay(result.data);
            }
        } catch (error) {
            console.error('Compliance Metrics Update Error:', error);
        }
    }

    async updateRiskMetrics() {
        // Update risk-compliance integration metrics
        const riskMetrics = document.getElementById('risk-compliance-metrics');
        if (riskMetrics) {
            // Update risk metrics display
        }
    }

    async updateAutomationMetrics() {
        // Update automation status and metrics
        const automationMetrics = document.getElementById('automation-metrics');
        if (automationMetrics) {
            // Update automation metrics display
        }
    }

    async updateRecentActivity() {
        // Update recent activity feed
        const activityFeed = document.getElementById('recent-activity-feed');
        if (activityFeed) {
            // Update activity feed
        }
    }

    // Display and visualization methods
    displayAIAssessmentResults(assessment) {
        const modal = this.createModal('AI Assessment Results', this.generateAssessmentHTML(assessment));
        this.showModal(modal);
    }

    displayBulkAssessmentResults(results) {
        const modal = this.createModal('Bulk Assessment Results', this.generateBulkResultsHTML(results));
        this.showModal(modal);
    }

    displayGapAnalysis(analysis) {
        const modal = this.createModal('Gap Analysis Report', this.generateGapAnalysisHTML(analysis));
        this.showModal(modal);
    }

    displayRemediationPlan(plan) {
        const modal = this.createModal('Remediation Plan', this.generateRemediationPlanHTML(plan));
        this.showModal(modal);
    }

    generateAssessmentHTML(assessment) {
        return `
            <div class="ai-assessment-results">
                <div class="assessment-header mb-6">
                    <h3 class="text-lg font-semibold text-gray-900">Control Assessment</h3>
                    <div class="flex items-center mt-2">
                        <span class="text-sm text-gray-600">Confidence Score:</span>
                        <div class="ml-2 flex items-center">
                            <div class="w-20 bg-gray-200 rounded-full h-2">
                                <div class="bg-green-600 h-2 rounded-full" style="width: ${assessment.confidenceScore * 100}%"></div>
                            </div>
                            <span class="ml-2 text-sm font-medium">${Math.round(assessment.confidenceScore * 100)}%</span>
                        </div>
                    </div>
                </div>

                <div class="gap-analysis mb-6">
                    <h4 class="text-md font-medium text-gray-900 mb-3">Gap Analysis</h4>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm font-medium text-gray-700">Current State:</p>
                                <p class="text-sm text-gray-600 mt-1">${assessment.gapAnalysis.currentState}</p>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-700">Target State:</p>
                                <p class="text-sm text-gray-600 mt-1">${assessment.gapAnalysis.targetState}</p>
                            </div>
                        </div>
                        <div class="mt-4">
                            <p class="text-sm font-medium text-gray-700">Overall Gap Score:</p>
                            <div class="flex items-center mt-1">
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-blue-600 h-2 rounded-full" style="width: ${assessment.gapAnalysis.overallGapScore}%"></div>
                                </div>
                                <span class="ml-2 text-sm font-medium">${assessment.gapAnalysis.overallGapScore}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="recommendations mb-6">
                    <h4 class="text-md font-medium text-gray-900 mb-3">Recommendations</h4>
                    <div class="space-y-3">
                        ${assessment.recommendations.map(rec => `
                            <div class="border border-gray-200 rounded-lg p-3">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1">
                                        <h5 class="text-sm font-medium text-gray-900">${rec.title}</h5>
                                        <p class="text-sm text-gray-600 mt-1">${rec.description}</p>
                                        <div class="flex items-center mt-2 space-x-4">
                                            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${rec.category}</span>
                                            <span class="text-xs text-gray-500">Timeline: ${rec.timeline}</span>
                                        </div>
                                    </div>
                                    <div class="ml-4">
                                        <span class="text-xs font-medium text-gray-700">Priority</span>
                                        <div class="text-center">
                                            <span class="text-lg font-bold ${this.getPriorityColor(rec.priority)}">${rec.priority}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="effort-estimation">
                    <h4 class="text-md font-medium text-gray-900 mb-3">Effort Estimation</h4>
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p class="text-sm text-gray-600">Total Hours</p>
                                <p class="text-lg font-semibold text-blue-900">${assessment.estimatedEffort.totalHours}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Timeline</p>
                                <p class="text-lg font-semibold text-blue-900">${assessment.estimatedEffort.timelineWeeks}w</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Est. Cost</p>
                                <p class="text-lg font-semibold text-blue-900">$${assessment.estimatedEffort.totalCost.toLocaleString()}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Confidence</p>
                                <p class="text-lg font-semibold text-blue-900">${assessment.estimatedEffort.confidenceLevel}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateGapAnalysisHTML(analysis) {
        return `
            <div class="gap-analysis-report">
                <div class="analysis-overview mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <p class="text-sm text-gray-600">Total Controls</p>
                            <p class="text-2xl font-bold text-blue-900">${analysis.totalControls}</p>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <p class="text-sm text-gray-600">Assessed</p>
                            <p class="text-2xl font-bold text-green-900">${analysis.assessedControls}</p>
                        </div>
                        <div class="text-center p-4 bg-yellow-50 rounded-lg">
                            <p class="text-sm text-gray-600">Gap Score</p>
                            <p class="text-2xl font-bold text-yellow-900">${analysis.overallGapScore}%</p>
                        </div>
                        <div class="text-center p-4 bg-red-50 rounded-lg">
                            <p class="text-sm text-gray-600">Critical Gaps</p>
                            <p class="text-2xl font-bold text-red-900">${analysis.criticalGaps.length}</p>
                        </div>
                    </div>
                </div>

                <div class="critical-gaps mb-6">
                    <h4 class="text-md font-medium text-gray-900 mb-3">Critical Gaps</h4>
                    <div class="space-y-2">
                        ${analysis.criticalGaps.slice(0, 10).map(gap => `
                            <div class="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg">
                                <div>
                                    <p class="text-sm font-medium text-red-900">${gap.title}</p>
                                    <p class="text-xs text-red-700">${gap.description}</p>
                                </div>
                                <div class="text-right">
                                    <span class="text-xs font-medium text-red-800">${gap.severity}</span>
                                    <p class="text-xs text-red-600">Risk: ${gap.riskLevel}/10</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="implementation-roadmap">
                    <h4 class="text-md font-medium text-gray-900 mb-3">Implementation Roadmap</h4>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-sm font-medium text-gray-700">Timeline: ${analysis.implementationRoadmap?.totalTimelineWeeks || 'TBD'} weeks</span>
                            <span class="text-sm font-medium text-gray-700">Est. Cost: $${analysis.estimatedEffort?.totalCost?.toLocaleString() || 'TBD'}</span>
                        </div>
                        <div class="text-sm text-gray-600">
                            <p>Detailed roadmap will be available after remediation plan generation.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateRemediationPlanHTML(plan) {
        return `
            <div class="remediation-plan">
                <div class="plan-overview mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <p class="text-sm text-gray-600">Total Phases</p>
                            <p class="text-2xl font-bold text-blue-900">${plan.phases.length}</p>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <p class="text-sm text-gray-600">Timeline</p>
                            <p class="text-2xl font-bold text-green-900">${plan.totalTimelineWeeks}w</p>
                        </div>
                        <div class="text-center p-4 bg-yellow-50 rounded-lg">
                            <p class="text-sm text-gray-600">Est. Hours</p>
                            <p class="text-2xl font-bold text-yellow-900">${plan.totalEstimatedHours}</p>
                        </div>
                    </div>
                </div>

                <div class="implementation-phases">
                    <h4 class="text-md font-medium text-gray-900 mb-3">Implementation Phases</h4>
                    <div class="space-y-4">
                        ${plan.phases.map(phase => `
                            <div class="border border-gray-200 rounded-lg p-4">
                                <div class="flex items-center justify-between mb-3">
                                    <h5 class="text-sm font-medium text-gray-900">Phase ${phase.phaseNumber}: ${phase.title}</h5>
                                    <span class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">${phase.duration} weeks</span>
                                </div>
                                <p class="text-sm text-gray-600 mb-3">${phase.description}</p>
                                <div class="tasks">
                                    <p class="text-xs font-medium text-gray-700 mb-2">Key Tasks:</p>
                                    <div class="space-y-1">
                                        ${phase.tasks.slice(0, 3).map(task => `
                                            <div class="flex items-center justify-between text-xs">
                                                <span class="text-gray-600">${task.title}</span>
                                                <span class="text-gray-500">${task.estimatedHours}h</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Chart initialization methods
    initializeComplianceOverviewChart() {
        const ctx = document.getElementById('complianceOverviewChart');
        if (!ctx) return;

        this.charts.complianceOverview = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Implemented', 'In Progress', 'Not Started', 'Tested'],
                datasets: [{
                    data: [45, 25, 20, 10],
                    backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initializeMaturityRadarChart() {
        const ctx = document.getElementById('maturityRadarChart');
        if (!ctx) return;

        this.charts.maturityRadar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Governance', 'Processes', 'Technology', 'People', 'Culture'],
                datasets: [{
                    label: 'Current Maturity',
                    data: [3.2, 2.8, 3.5, 2.5, 2.9],
                    fill: true,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgb(59, 130, 246)',
                    pointBackgroundColor: 'rgb(59, 130, 246)'
                }, {
                    label: 'Target Maturity',
                    data: [4.5, 4.0, 4.5, 4.0, 4.0],
                    fill: true,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: 'rgb(16, 185, 129)',
                    pointBackgroundColor: 'rgb(16, 185, 129)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        min: 0,
                        max: 5,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    initializeRiskComplianceMatrixChart() {
        const ctx = document.getElementById('riskComplianceMatrix');
        if (!ctx) return;

        this.charts.riskComplianceMatrix = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Controls',
                    data: [
                        {x: 7, y: 85}, {x: 5, y: 92}, {x: 8, y: 78},
                        {x: 6, y: 88}, {x: 9, y: 65}, {x: 4, y: 95}
                    ],
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    borderColor: 'rgb(239, 68, 68)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Risk Level (1-10)'
                        },
                        min: 0,
                        max: 10
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Compliance Score (%)'
                        },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }

    initializeTrendAnalysisChart() {
        const ctx = document.getElementById('trendAnalysisChart');
        if (!ctx) return;

        this.charts.trendAnalysis = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Compliance Score',
                    data: [75, 78, 82, 85, 88, 91],
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Risk Score',
                    data: [65, 62, 58, 55, 52, 48],
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Utility methods
    getFrameworkIdFromPage() {
        const urlParts = window.location.pathname.split('/');
        const frameworkIndex = urlParts.indexOf('frameworks');
        return frameworkIndex !== -1 && urlParts[frameworkIndex + 1] 
            ? parseInt(urlParts[frameworkIndex + 1]) 
            : null;
    }

    getOrganizationContext() {
        return {
            industry: 'Technology',
            size: 'Medium',
            riskProfile: 'Moderate'
        };
    }

    getSelectedControlIds() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-control-id]:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.dataset.controlId));
    }

    getPriorityColor(priority) {
        if (priority >= 8) return 'text-red-600';
        if (priority >= 6) return 'text-orange-600';
        if (priority >= 4) return 'text-yellow-600';
        return 'text-green-600';
    }

    // UI helper methods
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${this.getNotificationStyles(type)}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button class="ml-4 text-lg" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    getNotificationStyles(type) {
        switch (type) {
            case 'success': return 'bg-green-100 text-green-800 border border-green-200';
            case 'warning': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'error': return 'bg-red-100 text-red-800 border border-red-200';
            default: return 'bg-blue-100 text-blue-800 border border-blue-200';
        }
    }

    showLoadingIndicator(message = 'Loading...') {
        const loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
        loader.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-xl">
                <div class="flex items-center space-x-3">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span class="text-gray-700">${message}</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(loader);
    }

    hideLoadingIndicator() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.remove();
        }
    }

    createModal(title, content) {
        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                        <button class="modal-close text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="p-6">
                        ${content}
                    </div>
                    <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
                        <button class="modal-close px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    showModal(modalHTML) {
        const modalContainer = document.getElementById('modal-container') || document.body;
        modalContainer.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeModal() {
        const modals = document.querySelectorAll('.fixed.inset-0.z-50');
        modals.forEach(modal => modal.remove());
    }

    refreshDashboard() {
        window.location.reload();
    }

    // Event handlers for real-time updates
    handleRealtimeUpdate(data) {
        switch (data.type) {
            case 'assessment_completed':
                this.updateControlStatus(data.controlId, data.assessment);
                this.showNotification('AI assessment completed', 'success');
                break;
            case 'automation_completed':
                this.updateAutomationStatus(data.ruleId, 'completed');
                this.showNotification('Automation task completed', 'success');
                break;
            case 'compliance_score_updated':
                this.updateComplianceMetrics();
                break;
        }
    }

    updateControlStatus(controlId, assessment) {
        const controlRow = document.querySelector(`[data-control-id="${controlId}"]`);
        if (controlRow) {
            // Update control display with new assessment data
            const scoreElement = controlRow.querySelector('.compliance-score');
            if (scoreElement) {
                scoreElement.textContent = `${Math.round(assessment.gapAnalysis.overallGapScore)}%`;
            }
        }
    }

    updateAutomationStatus(ruleId, status) {
        const automationElement = document.querySelector(`[data-rule-id="${ruleId}"]`);
        if (automationElement) {
            // Update automation status display
            const statusElement = automationElement.querySelector('.automation-status');
            if (statusElement) {
                statusElement.textContent = status;
                statusElement.className = `automation-status ${this.getStatusColor(status)}`;
            }
        }
    }

    updateMaturityDisplay(maturityData) {
        // Update maturity radar chart
        if (this.charts.maturityRadar) {
            this.charts.maturityRadar.data.datasets[0].data = [
                maturityData.dimensions.governance,
                maturityData.dimensions.processes,
                maturityData.dimensions.technology,
                maturityData.dimensions.people,
                maturityData.dimensions.culture
            ];
            this.charts.maturityRadar.update();
        }

        // Update maturity score display
        const maturityScoreElement = document.getElementById('maturity-score');
        if (maturityScoreElement) {
            maturityScoreElement.textContent = maturityData.currentLevel.toFixed(1);
        }
    }

    getStatusColor(status) {
        switch (status) {
            case 'completed': return 'text-green-600';
            case 'running': return 'text-blue-600';
            case 'failed': return 'text-red-600';
            default: return 'text-gray-600';
        }
    }

    // Cleanup
    destroy() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        if (this.websocket) {
            this.websocket.close();
        }
        
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.complianceDashboard = new EnhancedComplianceDashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.complianceDashboard) {
        window.complianceDashboard.destroy();
    }
});
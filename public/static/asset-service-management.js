/**
 * Enterprise Asset & Service Management System
 * Compliant with NIST 800-37, ISO 27001:2022, and NIST CSF standards
 * 
 * Features:
 * - Comprehensive asset inventory with CIA ratings
 * - Service dependency mapping with dynamic risk calculation
 * - Automated risk propagation from assets to services to risks
 * - NIST 800-37 RMF integration
 * - ISO 27001:2022 asset management compliance
 */

// NIST 800-37 RMF and ISO 27001:2022 compliant asset classification
const ASSET_CONFIG = {
    // Asset types based on ISO 27001:2022 Annex A.8.1
    types: {
        'information': { 
            label: 'Information Assets', 
            color: '#3b82f6',
            description: 'Data, databases, documentation, intellectual property',
            controls: ['A.8.2.1', 'A.8.2.2', 'A.8.2.3']
        },
        'software': { 
            label: 'Software Assets', 
            color: '#10b981',
            description: 'Applications, systems software, development tools',
            controls: ['A.8.1.1', 'A.8.1.2', 'A.14.2.1']
        },
        'physical': { 
            label: 'Physical Assets', 
            color: '#f59e0b',
            description: 'Hardware, equipment, facilities, media',
            controls: ['A.7.1.1', 'A.7.1.2', 'A.11.1.1']
        },
        'personnel': { 
            label: 'Personnel Assets', 
            color: '#8b5cf6',
            description: 'People, qualifications, skills, experience',
            controls: ['A.6.1.1', 'A.6.2.1', 'A.6.3.1']
        },
        'service': { 
            label: 'Service Assets', 
            color: '#ef4444',
            description: 'Computing services, communication services',
            controls: ['A.13.1.1', 'A.13.1.2', 'A.13.2.1']
        },
        'intangible': { 
            label: 'Intangible Assets', 
            color: '#06b6d4',
            description: 'Reputation, image, intellectual property rights',
            controls: ['A.8.3.1', 'A.8.3.2', 'A.18.1.1']
        }
    },
    
    // CIA (Confidentiality, Integrity, Availability) impact levels per NIST 800-60
    ciaLevels: {
        'low': { 
            value: 1, 
            label: 'Low', 
            color: '#10b981',
            description: 'Limited adverse effect on operations, assets, or individuals'
        },
        'moderate': { 
            value: 2, 
            label: 'Moderate', 
            color: '#f59e0b',
            description: 'Serious adverse effect on operations, assets, or individuals'
        },
        'high': { 
            value: 3, 
            label: 'High', 
            color: '#ef4444',
            description: 'Severe or catastrophic adverse effect'
        }
    },
    
    // Asset criticality based on business impact
    criticality: {
        'critical': { 
            value: 4, 
            label: 'Mission Critical', 
            color: '#dc2626',
            rto: 1, // Recovery Time Objective (hours)
            rpo: 0.25 // Recovery Point Objective (hours)
        },
        'high': { 
            value: 3, 
            label: 'Business Critical', 
            color: '#ea580c',
            rto: 4,
            rpo: 1
        },
        'medium': { 
            value: 2, 
            label: 'Important', 
            color: '#d97706',
            rto: 24,
            rpo: 4
        },
        'low': { 
            value: 1, 
            label: 'Non-Critical', 
            color: '#16a34a',
            rto: 72,
            rpo: 24
        }
    },
    
    // NIST CSF functions for asset context
    nistFunctions: {
        'identify': 'Asset Management, Business Environment, Governance',
        'protect': 'Access Control, Awareness Training, Data Security',
        'detect': 'Anomalies and Events, Security Monitoring',
        'respond': 'Response Planning, Communications, Analysis',
        'recover': 'Recovery Planning, Improvements, Communications'
    }
};

// Service configuration with dependency modeling
const SERVICE_CONFIG = {
    tiers: {
        'presentation': { 
            label: 'Presentation Tier', 
            color: '#3b82f6',
            description: 'User interfaces, web applications, mobile apps'
        },
        'application': { 
            label: 'Application Tier', 
            color: '#10b981',
            description: 'Business logic, application services, APIs'
        },
        'data': { 
            label: 'Data Tier', 
            color: '#f59e0b',
            description: 'Databases, data warehouses, storage systems'
        },
        'infrastructure': { 
            label: 'Infrastructure Tier', 
            color: '#8b5cf6',
            description: 'Network, compute, storage infrastructure'
        },
        'security': { 
            label: 'Security Tier', 
            color: '#ef4444',
            description: 'Security controls, identity management, monitoring'
        }
    },
    
    // Service types based on business function
    types: {
        'business_critical': { 
            label: 'Business Critical Service', 
            sla: 99.9,
            maxDowntime: 8.77 // hours per year
        },
        'business_important': { 
            label: 'Business Important Service', 
            sla: 99.5,
            maxDowntime: 43.83
        },
        'business_support': { 
            label: 'Business Support Service', 
            sla: 99.0,
            maxDowntime: 87.66
        },
        'development': { 
            label: 'Development Service', 
            sla: 95.0,
            maxDowntime: 438.3
        }
    }
};

// Risk calculation engine based on NIST 800-30
class RiskCalculationEngine {
    
    // Calculate asset risk score using CIA triad
    static calculateAssetRiskScore(asset) {
        if (!asset) return 0;
        
        const confidentiality = ASSET_CONFIG.ciaLevels[asset.confidentialityImpact]?.value || 1;
        const integrity = ASSET_CONFIG.ciaLevels[asset.integrityImpact]?.value || 1;
        const availability = ASSET_CONFIG.ciaLevels[asset.availabilityImpact]?.value || 1;
        const criticality = ASSET_CONFIG.criticality[asset.criticality]?.value || 1;
        
        // NIST 800-30 approach: Risk = Threat x Vulnerability x Impact
        // Here we use CIA + Criticality as impact components
        const maxCIA = Math.max(confidentiality, integrity, availability);
        const avgCIA = (confidentiality + integrity + availability) / 3;
        
        // Weighted calculation considering both max and average CIA
        const impactScore = (maxCIA * 0.6) + (avgCIA * 0.4);
        const riskScore = impactScore * criticality;
        
        return Math.round(riskScore * 100) / 100; // Round to 2 decimal places
    }
    
    // Calculate service risk score based on dependent assets
    static calculateServiceRiskScore(service, assets) {
        if (!service || !service.dependentAssets || service.dependentAssets.length === 0) {
            return 1; // Minimum risk for services with no assets
        }
        
        let totalRisk = 0;
        let assetCount = 0;
        
        service.dependentAssets.forEach(assetId => {
            const asset = assets.find(a => a.id === assetId);
            if (asset) {
                const assetRisk = this.calculateAssetRiskScore(asset);
                totalRisk += assetRisk;
                assetCount++;
            }
        });
        
        if (assetCount === 0) return 1;
        
        // Calculate weighted average with service-specific multipliers
        const baseRisk = totalRisk / assetCount;
        const serviceTypeMultiplier = this.getServiceTypeMultiplier(service.serviceType);
        const dependencyMultiplier = this.getDependencyMultiplier(service.dependencies?.length || 0);
        
        const serviceRisk = baseRisk * serviceTypeMultiplier * dependencyMultiplier;
        return Math.round(serviceRisk * 100) / 100;
    }
    
    // Calculate risk score based on affected services
    static calculateRiskScoreFromServices(risk, services) {
        if (!risk || !risk.affectedServices || risk.affectedServices.length === 0) {
            // Fallback to traditional probability x impact calculation
            return (risk.probability || 1) * (risk.impact || 1);
        }
        
        let totalServiceRisk = 0;
        let serviceCount = 0;
        
        risk.affectedServices.forEach(serviceId => {
            const service = services.find(s => s.id === serviceId);
            if (service && service.riskScore) {
                totalServiceRisk += service.riskScore;
                serviceCount++;
            }
        });
        
        if (serviceCount === 0) {
            return (risk.probability || 1) * (risk.impact || 1);
        }
        
        const avgServiceRisk = totalServiceRisk / serviceCount;
        const probability = risk.probability || 1;
        
        // Risk Score = Probability * Service Risk Impact
        const riskScore = probability * avgServiceRisk;
        return Math.round(riskScore * 100) / 100;
    }
    
    static getServiceTypeMultiplier(serviceType) {
        const multipliers = {
            'business_critical': 1.5,
            'business_important': 1.2,
            'business_support': 1.0,
            'development': 0.8
        };
        return multipliers[serviceType] || 1.0;
    }
    
    static getDependencyMultiplier(dependencyCount) {
        if (dependencyCount === 0) return 1.0;
        if (dependencyCount <= 2) return 1.1;
        if (dependencyCount <= 5) return 1.25;
        return 1.4; // High complexity penalty
    }
}

// Asset Management Functions
function showAssets() {
    updateActiveNavigation('assets');
    currentModule = 'assets';
    
    // Check for both possible main content IDs
    const mainContent = document.getElementById('mainContent') || document.getElementById('main-content');
    
    if (!mainContent) {
        console.error('Main content element not found - checked both mainContent and main-content');
        showNotification('Unable to load assets page', 'error');
        return;
    }
    
    mainContent.innerHTML = `
        <div class="asset-management-dashboard">
            <div class="dashboard-header flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Asset Management</h2>
                    <p class="text-gray-600">ISO 27001:2022 & NIST 800-37 compliant asset inventory and risk assessment</p>
                </div>
                <div class="flex space-x-3">
                    <button onclick="showAssetMetrics()" class="btn-secondary">
                        <i class="fas fa-chart-bar mr-2"></i>Asset Metrics
                    </button>
                    <button onclick="exportAssets()" class="btn-secondary">
                        <i class="fas fa-download mr-2"></i>Export
                    </button>
                    <button onclick="createAsset()" class="btn-primary">
                        <i class="fas fa-plus mr-2"></i>Add Asset
                    </button>
                </div>
            </div>
            
            <!-- Asset Statistics -->
            <div class="asset-stats grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                <div class="stat-card">
                    <div class="stat-value text-xl font-bold text-blue-600" id="total-assets">-</div>
                    <div class="stat-label text-sm text-gray-600">Total Assets</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value text-xl font-bold text-red-600" id="critical-assets">-</div>
                    <div class="stat-label text-sm text-gray-600">Mission Critical</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value text-xl font-bold text-orange-600" id="high-risk-assets">-</div>
                    <div class="stat-label text-sm text-gray-600">High Risk</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value text-xl font-bold text-green-600" id="compliant-assets">-</div>
                    <div class="stat-label text-sm text-gray-600">Compliant</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value text-xl font-bold text-purple-600" id="avg-risk-score">-</div>
                    <div class="stat-label text-sm text-gray-600">Avg Risk Score</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value text-xl font-bold text-indigo-600" id="unassigned-assets">-</div>
                    <div class="stat-label text-sm text-gray-600">Unassigned</div>
                </div>
            </div>
            
            <!-- Asset Type Distribution -->
            <div class="asset-types mb-6">
                <div class="bg-white rounded-lg shadow p-4">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Asset Type Distribution</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" id="asset-type-distribution">
                        <!-- Asset type cards will be inserted here -->
                    </div>
                </div>
            </div>
            
            <!-- Asset Filters -->
            <div class="asset-filters mb-4">
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex flex-wrap gap-3 items-center">
                        <input type="text" id="searchAssets" placeholder="Search assets..." 
                            onkeyup="filterAssets()" 
                            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        
                        <select id="assetTypeFilter" onchange="filterAssets()" class="px-3 py-2 border border-gray-300 rounded-md text-sm">
                            <option value="">All Types</option>
                            ${Object.entries(ASSET_CONFIG.types).map(([key, config]) => 
                                `<option value="${key}">${config.label}</option>`
                            ).join('')}
                        </select>
                        
                        <select id="criticalityFilter" onchange="filterAssets()" class="px-3 py-2 border border-gray-300 rounded-md text-sm">
                            <option value="">All Criticality</option>
                            ${Object.entries(ASSET_CONFIG.criticality).map(([key, config]) => 
                                `<option value="${key}">${config.label}</option>`
                            ).join('')}
                        </select>
                        
                        <select id="ownerFilter" onchange="filterAssets()" class="px-3 py-2 border border-gray-300 rounded-md text-sm">
                            <option value="">All Owners</option>
                            <option value="it-department">IT Department</option>
                            <option value="security-team">Security Team</option>
                            <option value="business-unit">Business Unit</option>
                            <option value="external-vendor">External Vendor</option>
                        </select>
                        
                        <select id="riskLevelFilter" onchange="filterAssets()" class="px-3 py-2 border border-gray-300 rounded-md text-sm">
                            <option value="">All Risk Levels</option>
                            <option value="low">Low Risk (1-3)</option>
                            <option value="medium">Medium Risk (3-6)</option>
                            <option value="high">High Risk (6-9)</option>
                            <option value="critical">Critical Risk (9+)</option>
                        </select>
                        
                        <button onclick="refreshAssetData()" class="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                            <i class="fas fa-sync-alt mr-1"></i>Refresh
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Assets Table -->
            <div class="assets-table-container">
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white border-collapse">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criticality</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CIA Rating</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Review</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="assetsTableBody" class="bg-white divide-y divide-gray-200">
                                <!-- Asset rows will be inserted here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
        .asset-management-dashboard .stat-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
        }
        
        .asset-type-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 0.75rem;
            text-align: center;
            transition: all 0.2s;
        }
        
        .asset-type-card:hover {
            border-color: #3b82f6;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .cia-rating {
            display: flex;
            gap: 4px;
            justify-content: center;
        }
        
        .cia-badge {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .risk-score-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            color: white;
        }
        
        .compliance-badge {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 500;
        }
        </style>
    `;
    
    // Load and display assets
    loadAssets();
}

function loadAssets() {
    const assets = getAssets();
    updateAssetStatistics(assets);
    updateAssetTypeDistribution(assets);
    renderAssetsTable(assets);
}

function getAssets() {
    const assets = JSON.parse(localStorage.getItem('assets') || '[]');
    
    // Calculate risk scores for all assets
    return assets.map(asset => ({
        ...asset,
        riskScore: RiskCalculationEngine.calculateAssetRiskScore(asset)
    }));
}

function updateAssetStatistics(assets) {
    const totalAssets = assets.length;
    const criticalAssets = assets.filter(a => a.criticality === 'critical').length;
    const highRiskAssets = assets.filter(a => (a.riskScore || 0) > 6).length;
    const compliantAssets = assets.filter(a => a.complianceStatus === 'compliant').length;
    const unassignedAssets = assets.filter(a => !a.owner).length;
    
    const avgRiskScore = totalAssets > 0 ? 
        assets.reduce((sum, a) => sum + (a.riskScore || 0), 0) / totalAssets : 0;
    
    document.getElementById('total-assets').textContent = totalAssets;
    document.getElementById('critical-assets').textContent = criticalAssets;
    document.getElementById('high-risk-assets').textContent = highRiskAssets;
    document.getElementById('compliant-assets').textContent = compliantAssets;
    document.getElementById('avg-risk-score').textContent = avgRiskScore.toFixed(2);
    document.getElementById('unassigned-assets').textContent = unassignedAssets;
}

function updateAssetTypeDistribution(assets) {
    const distribution = {};
    Object.keys(ASSET_CONFIG.types).forEach(type => {
        distribution[type] = assets.filter(a => a.assetType === type).length;
    });
    
    const container = document.getElementById('asset-type-distribution');
    container.innerHTML = Object.entries(ASSET_CONFIG.types).map(([key, config]) => `
        <div class="asset-type-card">
            <div class="text-2xl font-bold" style="color: ${config.color};">${distribution[key] || 0}</div>
            <div class="text-xs text-gray-600">${config.label}</div>
        </div>
    `).join('');
}

function renderAssetsTable(assets) {
    const tbody = document.getElementById('assetsTableBody');
    
    if (assets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-server text-4xl mb-2 opacity-50"></i>
                    <p>No assets found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = assets.map(asset => {
        const typeConfig = ASSET_CONFIG.types[asset.assetType] || {};
        const criticalityConfig = ASSET_CONFIG.criticality[asset.criticality] || {};
        const riskScore = asset.riskScore || 0;
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                    <div>
                        <div class="text-sm font-medium text-gray-900">${asset.name}</div>
                        <div class="text-sm text-gray-500">${asset.description || 'No description'}</div>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                        style="background-color: ${typeConfig.color}20; color: ${typeConfig.color};">
                        ${typeConfig.label || asset.assetType}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                        style="background-color: ${criticalityConfig.color}20; color: ${criticalityConfig.color};">
                        ${criticalityConfig.label || asset.criticality}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="cia-rating">
                        <span class="cia-badge" style="background-color: ${getCIAColor(asset.confidentialityImpact)};">
                            C:${asset.confidentialityImpact?.toUpperCase().charAt(0) || 'U'}
                        </span>
                        <span class="cia-badge" style="background-color: ${getCIAColor(asset.integrityImpact)};">
                            I:${asset.integrityImpact?.toUpperCase().charAt(0) || 'U'}
                        </span>
                        <span class="cia-badge" style="background-color: ${getCIAColor(asset.availabilityImpact)};">
                            A:${asset.availabilityImpact?.toUpperCase().charAt(0) || 'U'}
                        </span>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="risk-score-badge" style="background-color: ${getRiskScoreColor(riskScore)};">
                        ${riskScore.toFixed(2)}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm text-gray-900">${asset.owner || 'Unassigned'}</div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm text-gray-900">${formatDate(asset.lastReview) || 'Never'}</div>
                </td>
                <td class="px-4 py-3">
                    <span class="compliance-badge ${getComplianceClass(asset.complianceStatus)}">
                        ${asset.complianceStatus || 'Unknown'}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex space-x-2">
                        <button onclick="viewAsset('${asset.id}')" class="text-blue-600 hover:text-blue-800 text-sm">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editAsset('${asset.id}')" class="text-green-600 hover:text-green-800 text-sm">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="assessAssetRisk('${asset.id}')" class="text-purple-600 hover:text-purple-800 text-sm">
                            <i class="fas fa-shield-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getCIAColor(impact) {
    const colors = {
        'low': '#10b981',
        'moderate': '#f59e0b', 
        'high': '#ef4444'
    };
    return colors[impact] || '#6b7280';
}

function getRiskScoreColor(score) {
    if (score >= 9) return '#dc2626';
    if (score >= 6) return '#ea580c';
    if (score >= 3) return '#d97706';
    return '#16a34a';
}

function getComplianceClass(status) {
    const classes = {
        'compliant': 'bg-green-100 text-green-800',
        'non-compliant': 'bg-red-100 text-red-800',
        'partial': 'bg-yellow-100 text-yellow-800',
        'unknown': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
}

function filterAssets() {
    const searchTerm = document.getElementById('searchAssets').value.toLowerCase();
    const typeFilter = document.getElementById('assetTypeFilter').value;
    const criticalityFilter = document.getElementById('criticalityFilter').value;
    const ownerFilter = document.getElementById('ownerFilter').value;
    const riskLevelFilter = document.getElementById('riskLevelFilter').value;
    
    let assets = getAssets();
    
    // Apply filters
    if (searchTerm) {
        assets = assets.filter(asset => 
            asset.name.toLowerCase().includes(searchTerm) ||
            asset.description?.toLowerCase().includes(searchTerm) ||
            asset.id.toLowerCase().includes(searchTerm)
        );
    }
    
    if (typeFilter) {
        assets = assets.filter(asset => asset.assetType === typeFilter);
    }
    
    if (criticalityFilter) {
        assets = assets.filter(asset => asset.criticality === criticalityFilter);
    }
    
    if (ownerFilter) {
        assets = assets.filter(asset => asset.owner === ownerFilter);
    }
    
    if (riskLevelFilter) {
        assets = assets.filter(asset => {
            const score = asset.riskScore || 0;
            switch (riskLevelFilter) {
                case 'low': return score < 3;
                case 'medium': return score >= 3 && score < 6;
                case 'high': return score >= 6 && score < 9;
                case 'critical': return score >= 9;
                default: return true;
            }
        });
    }
    
    renderAssetsTable(assets);
}

function createAsset() {
    const content = getAssetFormHTML();
    createModal('Create New Asset', content, []);
    
    // Handle form submission with delay to ensure DOM is ready
    setTimeout(() => {
        const form = document.getElementById('assetForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleAssetSubmit();
            });
        } else {
            console.error('Asset form not found in modal');
        }
    }, 100);
}

function getAssetFormHTML(asset = null) {
    const isEdit = asset !== null;
    const title = isEdit ? 'Edit Asset' : 'Create New Asset';
    
    return `
        <div class="asset-form-container">
            <form id="assetForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Asset Name *</label>
                        <input type="text" id="assetName" 
                            value="${isEdit ? asset.name : ''}" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="e.g., Customer Database" required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Asset Type *</label>
                        <select id="assetType" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            <option value="">Select Asset Type</option>
                            ${Object.entries(ASSET_CONFIG.types).map(([key, config]) => 
                                `<option value="${key}" ${isEdit && asset.assetType === key ? 'selected' : ''}>${config.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea id="assetDescription" rows="3" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Describe the asset and its business purpose...">${isEdit ? asset.description || '' : ''}</textarea>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Business Criticality *</label>
                        <select id="assetCriticality" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            <option value="">Select Criticality</option>
                            ${Object.entries(ASSET_CONFIG.criticality).map(([key, config]) => 
                                `<option value="${key}" ${isEdit && asset.criticality === key ? 'selected' : ''}>${config.label} (RTO: ${config.rto}h)</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Asset Owner *</label>
                        <select id="assetOwner" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            <option value="">Select Owner</option>
                            <option value="it-department" ${isEdit && asset.owner === 'it-department' ? 'selected' : ''}>IT Department</option>
                            <option value="security-team" ${isEdit && asset.owner === 'security-team' ? 'selected' : ''}>Security Team</option>
                            <option value="business-unit" ${isEdit && asset.owner === 'business-unit' ? 'selected' : ''}>Business Unit</option>
                            <option value="external-vendor" ${isEdit && asset.owner === 'external-vendor' ? 'selected' : ''}>External Vendor</option>
                        </select>
                    </div>
                </div>
                
                <!-- CIA Triad Assessment -->
                <div class="cia-assessment">
                    <h4 class="text-md font-medium text-gray-800 mb-3">CIA Triad Assessment (NIST 800-60)</h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Confidentiality Impact *</label>
                            <select id="confidentialityImpact" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                <option value="">Select Impact</option>
                                ${Object.entries(ASSET_CONFIG.ciaLevels).map(([key, config]) => 
                                    `<option value="${key}" ${isEdit && asset.confidentialityImpact === key ? 'selected' : ''}>${config.label}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Integrity Impact *</label>
                            <select id="integrityImpact" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                <option value="">Select Impact</option>
                                ${Object.entries(ASSET_CONFIG.ciaLevels).map(([key, config]) => 
                                    `<option value="${key}" ${isEdit && asset.integrityImpact === key ? 'selected' : ''}>${config.label}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Availability Impact *</label>
                            <select id="availabilityImpact" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                <option value="">Select Impact</option>
                                ${Object.entries(ASSET_CONFIG.ciaLevels).map(([key, config]) => 
                                    `<option value="${key}" ${isEdit && asset.availabilityImpact === key ? 'selected' : ''}>${config.label}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Additional Metadata -->
                <div class="asset-metadata">
                    <h4 class="text-md font-medium text-gray-800 mb-3">Additional Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input type="text" id="assetLocation" 
                                value="${isEdit ? asset.location || '' : ''}" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                placeholder="e.g., Data Center A, Cloud Region">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Compliance Status</label>
                            <select id="complianceStatus" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="unknown" ${isEdit && asset.complianceStatus === 'unknown' ? 'selected' : ''}>Unknown</option>
                                <option value="compliant" ${isEdit && asset.complianceStatus === 'compliant' ? 'selected' : ''}>Compliant</option>
                                <option value="partial" ${isEdit && asset.complianceStatus === 'partial' ? 'selected' : ''}>Partially Compliant</option>
                                <option value="non-compliant" ${isEdit && asset.complianceStatus === 'non-compliant' ? 'selected' : ''}>Non-Compliant</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Data Classification Tags</label>
                        <input type="text" id="dataTags" 
                            value="${isEdit ? asset.dataTags?.join(', ') || '' : ''}" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="e.g., PII, PHI, Financial, Proprietary (comma-separated)">
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onclick="closeModal()" 
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type="submit" 
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        ${isEdit ? 'Update Asset' : 'Create Asset'}
                    </button>
                </div>
            </form>
        </div>
    `;
}

async function handleAssetSubmit(assetId = null) {
    const form = document.getElementById('assetForm');
    if (!form) return;

    const formData = {
        name: document.getElementById('assetName').value,
        assetType: document.getElementById('assetType').value,
        description: document.getElementById('assetDescription').value,
        criticality: document.getElementById('assetCriticality').value,
        owner: document.getElementById('assetOwner').value,
        confidentialityImpact: document.getElementById('confidentialityImpact').value,
        integrityImpact: document.getElementById('integrityImpact').value,
        availabilityImpact: document.getElementById('availabilityImpact').value,
        location: document.getElementById('assetLocation').value,
        complianceStatus: document.getElementById('complianceStatus').value,
        dataTags: document.getElementById('dataTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
    };

    // Validation
    if (!formData.name.trim() || !formData.assetType || !formData.criticality || !formData.owner ||
        !formData.confidentialityImpact || !formData.integrityImpact || !formData.availabilityImpact) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    let assets = JSON.parse(localStorage.getItem('assets') || '[]');
    const now = new Date().toISOString();

    if (assetId) {
        // Update existing asset
        const assetIndex = assets.findIndex(a => a.id === assetId);
        if (assetIndex !== -1) {
            assets[assetIndex] = {
                ...assets[assetIndex],
                ...formData,
                updatedAt: now
            };
            showNotification('Asset updated successfully', 'success');
        }
    } else {
        // Create new asset
        const newAsset = {
            id: Date.now().toString(),
            ...formData,
            createdAt: now,
            updatedAt: now,
            lastReview: now
        };
        
        assets.push(newAsset);
        showNotification('Asset created successfully', 'success');
    }

    localStorage.setItem('assets', JSON.stringify(assets));
    closeModal();
    loadAssets(); // Refresh the display
    
    // Trigger recalculation of service and risk scores
    recalculateAllRiskScores();
}

// Service Management Functions  
function showServices() {
    updateActiveNavigation('services');
    currentModule = 'services';
    
    // Check for both possible main content IDs
    const mainContent = document.getElementById('mainContent') || document.getElementById('main-content');
    
    if (!mainContent) {
        console.error('Main content element not found - checked both mainContent and main-content');
        showNotification('Unable to load services page', 'error');
        return;
    }
    
    mainContent.innerHTML = `
        <div class="service-management-dashboard">
            <div class="dashboard-header flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Service Management</h2>
                    <p class="text-gray-600">Service dependency mapping with dynamic risk calculation based on asset relationships</p>
                </div>
                <div class="flex space-x-3">
                    <button onclick="showServiceDependencyMap()" class="btn-secondary">
                        <i class="fas fa-sitemap mr-2"></i>Dependency Map
                    </button>
                    <button onclick="exportServices()" class="btn-secondary">
                        <i class="fas fa-download mr-2"></i>Export
                    </button>
                    <button onclick="createService()" class="btn-primary">
                        <i class="fas fa-plus mr-2"></i>Add Service
                    </button>
                </div>
            </div>
            
            <!-- Service Statistics -->
            <div class="service-stats grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div class="stat-card">
                    <div class="stat-value text-xl font-bold text-blue-600" id="total-services">-</div>
                    <div class="stat-label text-sm text-gray-600">Total Services</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value text-xl font-bold text-red-600" id="critical-services">-</div>
                    <div class="stat-label text-sm text-gray-600">Business Critical</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value text-xl font-bold text-orange-600" id="high-risk-services">-</div>
                    <div class="stat-label text-sm text-gray-600">High Risk</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value text-xl font-bold text-green-600" id="avg-sla">-</div>
                    <div class="stat-label text-sm text-gray-600">Avg SLA %</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value text-xl font-bold text-purple-600" id="avg-service-risk">-</div>
                    <div class="stat-label text-sm text-gray-600">Avg Risk Score</div>
                </div>
            </div>
            
            <!-- Service Filters -->
            <div class="service-filters mb-4">
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex flex-wrap gap-3 items-center">
                        <input type="text" id="searchServices" placeholder="Search services..." 
                            onkeyup="filterServices()" 
                            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        
                        <select id="serviceTierFilter" onchange="filterServices()" class="px-3 py-2 border border-gray-300 rounded-md text-sm">
                            <option value="">All Tiers</option>
                            ${Object.entries(SERVICE_CONFIG.tiers).map(([key, config]) => 
                                `<option value="${key}">${config.label}</option>`
                            ).join('')}
                        </select>
                        
                        <select id="serviceTypeFilter" onchange="filterServices()" class="px-3 py-2 border border-gray-300 rounded-md text-sm">
                            <option value="">All Types</option>
                            ${Object.entries(SERVICE_CONFIG.types).map(([key, config]) => 
                                `<option value="${key}">${config.label}</option>`
                            ).join('')}
                        </select>
                        
                        <select id="serviceRiskFilter" onchange="filterServices()" class="px-3 py-2 border border-gray-300 rounded-md text-sm">
                            <option value="">All Risk Levels</option>
                            <option value="low">Low Risk (1-3)</option>
                            <option value="medium">Medium Risk (3-6)</option>
                            <option value="high">High Risk (6-9)</option>
                            <option value="critical">Critical Risk (9+)</option>
                        </select>
                        
                        <button onclick="refreshServiceData()" class="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                            <i class="fas fa-sync-alt mr-1"></i>Refresh
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Services Table -->
            <div class="services-table-container">
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white border-collapse">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dependencies</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assets</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="servicesTableBody" class="bg-white divide-y divide-gray-200">
                                <!-- Service rows will be inserted here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
        .service-management-dashboard .stat-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
        }
        
        .dependency-count {
            display: inline-block;
            background: #f3f4f6;
            color: #374151;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 500;
        }
        
        .sla-badge {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
        }
        </style>
    `;
    
    // Load and display services
    loadServices();
}

function loadServices() {
    const assets = getAssets();
    const services = getServices(assets);
    updateServiceStatistics(services);
    renderServicesTable(services);
}

function getServices(assets = null) {
    if (!assets) assets = getAssets();
    
    const services = JSON.parse(localStorage.getItem('services') || '[]');
    
    // Calculate risk scores for all services based on their assets
    return services.map(service => ({
        ...service,
        riskScore: RiskCalculationEngine.calculateServiceRiskScore(service, assets)
    }));
}

function updateServiceStatistics(services) {
    const totalServices = services.length;
    const criticalServices = services.filter(s => s.serviceType === 'business_critical').length;
    const highRiskServices = services.filter(s => (s.riskScore || 0) > 6).length;
    
    const avgSLA = totalServices > 0 ? 
        services.reduce((sum, s) => sum + (SERVICE_CONFIG.types[s.serviceType]?.sla || 0), 0) / totalServices : 0;
    
    const avgServiceRisk = totalServices > 0 ? 
        services.reduce((sum, s) => sum + (s.riskScore || 0), 0) / totalServices : 0;
    
    document.getElementById('total-services').textContent = totalServices;
    document.getElementById('critical-services').textContent = criticalServices;
    document.getElementById('high-risk-services').textContent = highRiskServices;
    document.getElementById('avg-sla').textContent = avgSLA.toFixed(1) + '%';
    document.getElementById('avg-service-risk').textContent = avgServiceRisk.toFixed(2);
}

function renderServicesTable(services) {
    const tbody = document.getElementById('servicesTableBody');
    
    if (services.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-cogs text-4xl mb-2 opacity-50"></i>
                    <p>No services found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = services.map(service => {
        const tierConfig = SERVICE_CONFIG.tiers[service.serviceTier] || {};
        const typeConfig = SERVICE_CONFIG.types[service.serviceType] || {};
        const riskScore = service.riskScore || 0;
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                    <div>
                        <div class="text-sm font-medium text-gray-900">${service.name}</div>
                        <div class="text-sm text-gray-500">${service.description || 'No description'}</div>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                        style="background-color: ${tierConfig.color}20; color: ${tierConfig.color};">
                        ${tierConfig.label || service.serviceTier}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm text-gray-900">${typeConfig.label || service.serviceType}</div>
                    <div class="sla-badge bg-gray-100 text-gray-700">SLA: ${typeConfig.sla || 'N/A'}%</div>
                </td>
                <td class="px-4 py-3">
                    <span class="dependency-count">${service.dependencies?.length || 0} deps</span>
                </td>
                <td class="px-4 py-3">
                    <span class="dependency-count">${service.dependentAssets?.length || 0} assets</span>
                </td>
                <td class="px-4 py-3">
                    <span class="risk-score-badge" style="background-color: ${getRiskScoreColor(riskScore)}; color: white;">
                        ${riskScore.toFixed(2)}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm text-gray-900">${typeConfig.sla || 'N/A'}%</div>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ${service.status || 'Active'}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex space-x-2">
                        <button onclick="viewService('${service.id}')" class="text-blue-600 hover:text-blue-800 text-sm">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editService('${service.id}')" class="text-green-600 hover:text-green-800 text-sm">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="mapServiceDependencies('${service.id}')" class="text-purple-600 hover:text-purple-800 text-sm">
                            <i class="fas fa-sitemap"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Global risk recalculation function
function recalculateAllRiskScores() {
    console.log('Recalculating all risk scores...');
    
    // Get current data
    const assets = getAssets();
    const services = getServices(assets);
    const risks = JSON.parse(localStorage.getItem('risks') || '[]');
    
    // Recalculate service risk scores
    const updatedServices = services.map(service => ({
        ...service,
        riskScore: RiskCalculationEngine.calculateServiceRiskScore(service, assets)
    }));
    
    // Recalculate risk scores based on services
    const updatedRisks = risks.map(risk => ({
        ...risk,
        riskScore: RiskCalculationEngine.calculateRiskScoreFromServices(risk, updatedServices),
        updatedAt: new Date().toISOString()
    }));
    
    // Save updated data
    localStorage.setItem('services', JSON.stringify(updatedServices));
    localStorage.setItem('risks', JSON.stringify(updatedRisks));
    
    console.log('Risk scores recalculated successfully');
    showNotification('Risk scores updated across all assets, services, and risks', 'success');
}

// Initialize sample data if none exists
function initializeAssetServiceData() {
    // Initialize assets if none exist
    const assets = JSON.parse(localStorage.getItem('assets') || '[]');
    if (assets.length === 0) {
        const sampleAssets = [
            {
                id: '1',
                name: 'Customer Database',
                assetType: 'information',
                description: 'Primary customer data repository containing PII and transaction history',
                criticality: 'critical',
                owner: 'it-department',
                confidentialityImpact: 'high',
                integrityImpact: 'high',
                availabilityImpact: 'high',
                location: 'Data Center A',
                complianceStatus: 'compliant',
                dataTags: ['PII', 'Financial', 'Customer Data'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastReview: new Date().toISOString()
            },
            {
                id: '2',
                name: 'Web Application Server',
                assetType: 'software',
                description: 'Main application server hosting customer-facing services',
                criticality: 'high',
                owner: 'it-department',
                confidentialityImpact: 'moderate',
                integrityImpact: 'high',
                availabilityImpact: 'high',
                location: 'Cloud Region US-East',
                complianceStatus: 'compliant',
                dataTags: ['Application', 'Production'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastReview: new Date().toISOString()
            },
            {
                id: '3',
                name: 'Backup Storage System',
                assetType: 'physical',
                description: 'Enterprise backup and disaster recovery system',
                criticality: 'medium',
                owner: 'it-department',
                confidentialityImpact: 'high',
                integrityImpact: 'high',
                availabilityImpact: 'moderate',
                location: 'Data Center B',
                complianceStatus: 'compliant',
                dataTags: ['Backup', 'DR'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastReview: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('assets', JSON.stringify(sampleAssets));
    }
    
    // Initialize services if none exist
    const services = JSON.parse(localStorage.getItem('services') || '[]');
    if (services.length === 0) {
        const sampleServices = [
            {
                id: '1',
                name: 'Customer Portal',
                serviceTier: 'presentation',
                serviceType: 'business_critical',
                description: 'Customer-facing web portal for account management',
                dependentAssets: ['1', '2'], // Customer Database, Web Application Server
                dependencies: ['2'], // Depends on API Gateway service
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '2',
                name: 'API Gateway',
                serviceTier: 'application',
                serviceType: 'business_critical',
                description: 'Central API gateway for all microservices',
                dependentAssets: ['2'], // Web Application Server
                dependencies: [],
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('services', JSON.stringify(sampleServices));
    }
}

// Service creation and management functions
function createService() {
    const content = getServiceFormHTML();
    createModal('Create New Service', content, []);
    
    // Handle form submission with delay to ensure DOM is ready
    setTimeout(() => {
        const form = document.getElementById('serviceForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleServiceSubmit();
            });
        } else {
            console.error('Service form not found in modal');
        }
    }, 100);
}

function getServiceFormHTML(service = null) {
    const isEdit = service !== null;
    const assets = JSON.parse(localStorage.getItem('assets') || '[]');
    const services = JSON.parse(localStorage.getItem('services') || '[]');
    
    return `
        <div class="service-form-container">
            <form id="serviceForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
                        <input type="text" id="serviceName" 
                            value="${isEdit ? service.name : ''}" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="e.g., Customer Portal" required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Service Tier *</label>
                        <select id="serviceTier" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            <option value="">Select Service Tier</option>
                            ${Object.entries(SERVICE_CONFIG.tiers).map(([key, config]) => 
                                `<option value="${key}" ${isEdit && service.serviceTier === key ? 'selected' : ''}>${config.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea id="serviceDescription" rows="3" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Describe the service and its business purpose...">${isEdit ? service.description || '' : ''}</textarea>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
                        <select id="serviceType" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            <option value="">Select Service Type</option>
                            ${Object.entries(SERVICE_CONFIG.types).map(([key, config]) => 
                                `<option value="${key}" ${isEdit && service.serviceType === key ? 'selected' : ''}>${config.label} (${config.sla}% SLA)</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select id="serviceStatus" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="active" ${isEdit && service.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${isEdit && service.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="maintenance" ${isEdit && service.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                            <option value="deprecated" ${isEdit && service.status === 'deprecated' ? 'selected' : ''}>Deprecated</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Dependent Assets</label>
                    <div class="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                        ${assets.map(asset => `
                            <label class="flex items-center mb-2">
                                <input type="checkbox" name="dependentAssets" value="${asset.id}"
                                    ${isEdit && service.dependentAssets?.includes(asset.id) ? 'checked' : ''}
                                    class="mr-2">
                                <span class="text-sm">${asset.name} (${asset.assetType})</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Service Dependencies</label>
                    <div class="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                        ${services.filter(s => !isEdit || s.id !== service.id).map(svc => `
                            <label class="flex items-center mb-2">
                                <input type="checkbox" name="dependencies" value="${svc.id}"
                                    ${isEdit && service.dependencies?.includes(svc.id) ? 'checked' : ''}
                                    class="mr-2">
                                <span class="text-sm">${svc.name} (${svc.serviceTier})</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onclick="closeModal()" 
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type="submit" 
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        ${isEdit ? 'Update Service' : 'Create Service'}
                    </button>
                </div>
            </form>
        </div>
    `;
}

async function handleServiceSubmit(serviceId = null) {
    const form = document.getElementById('serviceForm');
    if (!form) return;

    const formData = {
        name: document.getElementById('serviceName').value,
        serviceTier: document.getElementById('serviceTier').value,
        description: document.getElementById('serviceDescription').value,
        serviceType: document.getElementById('serviceType').value,
        status: document.getElementById('serviceStatus').value,
        dependentAssets: Array.from(document.querySelectorAll('input[name="dependentAssets"]:checked'))
            .map(cb => cb.value),
        dependencies: Array.from(document.querySelectorAll('input[name="dependencies"]:checked'))
            .map(cb => cb.value)
    };

    // Validation
    if (!formData.name.trim() || !formData.serviceTier || !formData.serviceType) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    let services = JSON.parse(localStorage.getItem('services') || '[]');
    const now = new Date().toISOString();

    if (serviceId) {
        // Update existing service
        const serviceIndex = services.findIndex(s => s.id === serviceId);
        if (serviceIndex !== -1) {
            services[serviceIndex] = {
                ...services[serviceIndex],
                ...formData,
                updatedAt: now
            };
            showNotification('Service updated successfully', 'success');
        }
    } else {
        // Create new service
        const newService = {
            id: Date.now().toString(),
            ...formData,
            createdAt: now,
            updatedAt: now
        };
        
        services.push(newService);
        showNotification('Service created successfully', 'success');
    }

    localStorage.setItem('services', JSON.stringify(services));
    closeModal();
    loadServices(); // Refresh the display
    
    // Trigger recalculation of risk scores
    recalculateAllRiskScores();
}

function filterServices() {
    const searchTerm = document.getElementById('searchServices').value.toLowerCase();
    const tierFilter = document.getElementById('serviceTierFilter').value;
    const typeFilter = document.getElementById('serviceTypeFilter').value;
    const riskFilter = document.getElementById('serviceRiskFilter').value;
    
    let services = getServices();
    
    // Apply filters
    if (searchTerm) {
        services = services.filter(service => 
            service.name.toLowerCase().includes(searchTerm) ||
            service.description?.toLowerCase().includes(searchTerm) ||
            service.id.toLowerCase().includes(searchTerm)
        );
    }
    
    if (tierFilter) {
        services = services.filter(service => service.serviceTier === tierFilter);
    }
    
    if (typeFilter) {
        services = services.filter(service => service.serviceType === typeFilter);
    }
    
    if (riskFilter) {
        services = services.filter(service => {
            const score = service.riskScore || 0;
            switch (riskFilter) {
                case 'low': return score < 3;
                case 'medium': return score >= 3 && score < 6;
                case 'high': return score >= 6 && score < 9;
                case 'critical': return score >= 9;
                default: return true;
            }
        });
    }
    
    renderServicesTable(services);
}

// Add missing asset functions
function viewAsset(assetId) {
    showNotification('Asset details view - Coming soon', 'info');
}

function editAsset(assetId) {
    const assets = JSON.parse(localStorage.getItem('assets') || '[]');
    const asset = assets.find(a => a.id === assetId);
    
    if (!asset) {
        showNotification('Asset not found', 'error');
        return;
    }
    
    const content = getAssetFormHTML(asset);
    createModal('Edit Asset', content, []);
    
    // Handle form submission with delay
    setTimeout(() => {
        const form = document.getElementById('assetForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleAssetSubmit(assetId);
            });
        }
    }, 100);
}

function assessAssetRisk(assetId) {
    showNotification('Asset risk assessment - Coming soon', 'info');
}

function viewService(serviceId) {
    showNotification('Service details view - Coming soon', 'info');
}

function editService(serviceId) {
    const services = JSON.parse(localStorage.getItem('services') || '[]');
    const service = services.find(s => s.id === serviceId);
    
    if (!service) {
        showNotification('Service not found', 'error');
        return;
    }
    
    const content = getServiceFormHTML(service);
    createModal('Edit Service', content, []);
    
    // Handle form submission with delay
    setTimeout(() => {
        const form = document.getElementById('serviceForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleServiceSubmit(serviceId);
            });
        }
    }, 100);
}

function mapServiceDependencies(serviceId) {
    showNotification('Service dependency mapping - Coming soon', 'info');
}

function showServiceDependencyMap() {
    showNotification('Service dependency map visualization - Coming soon', 'info');
}

function exportAssets() {
    const assets = getAssets();
    const csvContent = convertToCSV(assets);
    downloadFile(csvContent, 'assets.csv', 'text/csv');
    showNotification('Assets exported successfully', 'success');
}

function exportServices() {
    const services = getServices();
    const csvContent = convertToCSV(services);
    downloadFile(csvContent, 'services.csv', 'text/csv');
    showNotification('Services exported successfully', 'success');
}

function showAssetMetrics() {
    showNotification('Asset metrics dashboard - Coming soon', 'info');
}

// Utility functions
function formatDate(dateStr) {
    if (!dateStr) return 'Never';
    try {
        return new Date(dateStr).toLocaleDateString();
    } catch (error) {
        return 'Invalid Date';
    }
}

function convertToCSV(data) {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Make functions globally available
window.showAssets = showAssets;
window.showServices = showServices;
window.createAsset = createAsset;
window.createService = createService;
window.editAsset = editAsset;
window.editService = editService;
window.viewAsset = viewAsset;
window.viewService = viewService;
window.assessAssetRisk = assessAssetRisk;
window.mapServiceDependencies = mapServiceDependencies;
window.showServiceDependencyMap = showServiceDependencyMap;
window.exportAssets = exportAssets;
window.exportServices = exportServices;
window.showAssetMetrics = showAssetMetrics;
window.filterAssets = filterAssets;
window.filterServices = filterServices;
window.refreshAssetData = () => loadAssets();
window.refreshServiceData = () => loadServices();
window.recalculateAllRiskScores = recalculateAllRiskScores;
window.RiskCalculationEngine = RiskCalculationEngine;

// Add missing utility functions that might be called
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

function createModal(title, content, buttons = []) {
    // Remove existing modal if any
    const existingModal = document.getElementById('dynamic-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'dynamic-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto';
    
    modalContent.innerHTML = `
        <div class="flex justify-between items-center p-6 border-b">
            <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times text-lg"></i>
            </button>
        </div>
        <div class="p-6">
            ${content}
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    return modal;
}

function closeModal() {
    const modal = document.getElementById('dynamic-modal');
    if (modal) {
        modal.remove();
    }
}

// Initialize data on load
document.addEventListener('DOMContentLoaded', function() {
    initializeAssetServiceData();
});
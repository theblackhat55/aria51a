/**
 * Integrated Risk Management Framework
 * NIST 800-37 RMF and ISO 27001:2022 compliant integration layer
 * Connects Assets -> Services -> Risks with dynamic risk calculation
 */

// Enhanced risk framework integration
class IntegratedRiskFramework {
    
    constructor() {
        this.riskMatrices = {
            // NIST 800-30 Risk Matrix
            nist: {
                likelihood: {
                    'very_high': { value: 5, label: 'Very High (>90%)', description: 'Almost certain to occur' },
                    'high': { value: 4, label: 'High (70-90%)', description: 'Very likely to occur' },
                    'moderate': { value: 3, label: 'Moderate (20-70%)', description: 'Somewhat likely to occur' },
                    'low': { value: 2, label: 'Low (5-20%)', description: 'Unlikely to occur' },
                    'very_low': { value: 1, label: 'Very Low (<5%)', description: 'Highly unlikely to occur' }
                },
                impact: {
                    'very_high': { value: 5, label: 'Very High', description: 'Catastrophic impact to mission' },
                    'high': { value: 4, label: 'High', description: 'Severe impact to mission' },
                    'moderate': { value: 3, label: 'Moderate', description: 'Serious impact to mission' },
                    'low': { value: 2, label: 'Low', description: 'Limited impact to mission' },
                    'very_low': { value: 1, label: 'Very Low', description: 'Negligible impact to mission' }
                }
            }
        };
        
        this.riskCategories = {
            // ISO 27001:2022 Annex A control categories
            'information_security_policies': {
                label: 'Information Security Policies',
                iso_control: 'A.5',
                description: 'Management direction and support for information security'
            },
            'organization_information_security': {
                label: 'Organization of Information Security', 
                iso_control: 'A.6',
                description: 'Internal organization and mobile devices/teleworking'
            },
            'human_resource_security': {
                label: 'Human Resource Security',
                iso_control: 'A.7', 
                description: 'Personnel security before, during and after employment'
            },
            'asset_management': {
                label: 'Asset Management',
                iso_control: 'A.8',
                description: 'Responsibility for assets, information classification, media handling'
            },
            'access_control': {
                label: 'Access Control',
                iso_control: 'A.9',
                description: 'Business requirements, user access management, system access responsibilities'
            },
            'cryptography': {
                label: 'Cryptography',
                iso_control: 'A.10',
                description: 'Cryptographic controls'
            },
            'physical_environmental_security': {
                label: 'Physical and Environmental Security',
                iso_control: 'A.11', 
                description: 'Secure areas, equipment protection'
            },
            'operations_security': {
                label: 'Operations Security',
                iso_control: 'A.12',
                description: 'Operational procedures, protection from malware, backup, logging'
            },
            'communications_security': {
                label: 'Communications Security',
                iso_control: 'A.13',
                description: 'Network security management, information transfer'
            },
            'system_acquisition': {
                label: 'System Acquisition, Development and Maintenance',
                iso_control: 'A.14',
                description: 'Security requirements, development security, test data'
            },
            'supplier_relationships': {
                label: 'Supplier Relationships',
                iso_control: 'A.15',
                description: 'Information security in supplier relationships'
            },
            'incident_management': {
                label: 'Information Security Incident Management',
                iso_control: 'A.16',
                description: 'Management of information security incidents and improvements'
            },
            'business_continuity': {
                label: 'Information Security Aspects of Business Continuity',
                iso_control: 'A.17',
                description: 'Business continuity and redundancies'
            },
            'compliance': {
                label: 'Compliance',
                iso_control: 'A.18',
                description: 'Legal requirements, security reviews'
            }
        };
        
        this.threatSources = {
            // NIST 800-30 Threat Sources
            'adversarial': {
                label: 'Adversarial Threats',
                description: 'Individuals, groups, organizations seeking to exploit vulnerabilities',
                examples: ['Hackers', 'Nation-states', 'Terrorists', 'Insider threats']
            },
            'accidental': {
                label: 'Accidental Threats', 
                description: 'Human actions taken without malicious intent',
                examples: ['User errors', 'Coding errors', 'Faulty procedures']
            },
            'structural': {
                label: 'Structural Threats',
                description: 'Failure of equipment, environmental controls, or software',
                examples: ['Hardware failures', 'Software bugs', 'Natural disasters']
            },
            'environmental': {
                label: 'Environmental Threats',
                description: 'Natural and man-made disasters, hazards, failures',
                examples: ['Floods', 'Earthquakes', 'Power failures', 'HVAC failures']
            }
        };
    }
    
    // Enhanced risk calculation integrating assets, services, and NIST methodology
    calculateEnhancedRiskScore(risk, assets = [], services = []) {
        // Get affected assets and services
        const affectedAssets = risk.affectedAssets ? 
            assets.filter(asset => risk.affectedAssets.includes(asset.id)) : [];
        
        const affectedServices = risk.affectedServices ?
            services.filter(service => risk.affectedServices.includes(service.id)) : [];
        
        // Base risk calculation using NIST 800-30 methodology
        const likelihood = risk.likelihood || risk.probability || 1;
        const impact = risk.impact || 1;
        let baseRisk = likelihood * impact;
        
        // Asset-based risk amplification
        let assetRiskMultiplier = 1;
        if (affectedAssets.length > 0) {
            const avgAssetRisk = affectedAssets.reduce((sum, asset) => 
                sum + (asset.riskScore || RiskCalculationEngine.calculateAssetRiskScore(asset)), 0) / affectedAssets.length;
            assetRiskMultiplier = 1 + (avgAssetRisk / 10); // Scale asset risk impact
        }
        
        // Service-based risk amplification
        let serviceRiskMultiplier = 1;
        if (affectedServices.length > 0) {
            const avgServiceRisk = affectedServices.reduce((sum, service) => 
                sum + (service.riskScore || RiskCalculationEngine.calculateServiceRiskScore(service, assets)), 0) / affectedServices.length;
            serviceRiskMultiplier = 1 + (avgServiceRisk / 10); // Scale service risk impact
        }
        
        // Threat source amplification
        const threatMultiplier = this.getThreatSourceMultiplier(risk.threatSource);
        
        // Control effectiveness reduction
        const controlEffectiveness = this.calculateControlEffectiveness(risk);
        const controlReduction = controlEffectiveness / 10; // Reduce risk based on controls
        
        // Final integrated risk score
        const integratedRisk = baseRisk * assetRiskMultiplier * serviceRiskMultiplier * threatMultiplier - controlReduction;
        
        return Math.max(0.1, Math.round(integratedRisk * 100) / 100); // Minimum risk of 0.1
    }
    
    getThreatSourceMultiplier(threatSource) {
        const multipliers = {
            'adversarial': 1.3,    // Higher multiplier for intentional threats
            'accidental': 1.0,     // Baseline for human error
            'structural': 1.1,     // Slightly higher for system failures
            'environmental': 1.2   // Higher for environmental threats
        };
        return multipliers[threatSource] || 1.0;
    }
    
    calculateControlEffectiveness(risk) {
        if (!risk.controls || risk.controls.length === 0) return 0;
        
        // Calculate effectiveness based on control maturity and implementation
        const totalEffectiveness = risk.controls.reduce((sum, control) => {
            const maturity = control.maturityLevel || 1; // 1-5 scale
            const implementation = control.implementationStatus || 0.5; // 0-1 scale
            return sum + (maturity * implementation);
        }, 0);
        
        // Average effectiveness scaled to 0-10
        return Math.min(10, (totalEffectiveness / risk.controls.length) * 2);
    }
    
    // Generate comprehensive risk assessment report
    generateRiskAssessmentReport(riskId) {
        const risks = JSON.parse(localStorage.getItem('risks') || '[]');
        const assets = JSON.parse(localStorage.getItem('assets') || '[]');
        const services = JSON.parse(localStorage.getItem('services') || '[]');
        
        const risk = risks.find(r => r.id === riskId);
        if (!risk) return null;
        
        // Calculate enhanced risk score
        const enhancedRiskScore = this.calculateEnhancedRiskScore(risk, assets, services);
        
        // Get affected assets and services
        const affectedAssets = risk.affectedAssets ? 
            assets.filter(asset => risk.affectedAssets.includes(asset.id)) : [];
        const affectedServices = risk.affectedServices ?
            services.filter(service => risk.affectedServices.includes(service.id)) : [];
        
        return {
            riskId: risk.id,
            riskTitle: risk.title,
            category: risk.category,
            threatSource: risk.threatSource,
            likelihood: risk.likelihood,
            impact: risk.impact,
            baseRiskScore: (risk.likelihood || 1) * (risk.impact || 1),
            enhancedRiskScore: enhancedRiskScore,
            affectedAssets: affectedAssets.map(asset => ({
                id: asset.id,
                name: asset.name,
                type: asset.assetType,
                criticality: asset.criticality,
                riskScore: asset.riskScore || RiskCalculationEngine.calculateAssetRiskScore(asset)
            })),
            affectedServices: affectedServices.map(service => ({
                id: service.id,
                name: service.name,
                tier: service.serviceTier,
                type: service.serviceType,
                riskScore: service.riskScore || RiskCalculationEngine.calculateServiceRiskScore(service, assets)
            })),
            controls: risk.controls || [],
            controlEffectiveness: this.calculateControlEffectiveness(risk),
            recommendations: this.generateRiskRecommendations(risk, affectedAssets, affectedServices),
            complianceMapping: this.mapToComplianceFrameworks(risk)
        };
    }
    
    generateRiskRecommendations(risk, affectedAssets, affectedServices) {
        const recommendations = [];
        
        // Asset-based recommendations
        affectedAssets.forEach(asset => {
            if (asset.riskScore > 6) {
                recommendations.push({
                    type: 'asset',
                    priority: 'high',
                    title: `Strengthen ${asset.name} Security Controls`,
                    description: `Asset has high risk score (${asset.riskScore}). Implement additional security controls.`,
                    actions: ['Review access controls', 'Enhance monitoring', 'Update security configurations']
                });
            }
        });
        
        // Service-based recommendations  
        affectedServices.forEach(service => {
            if (service.riskScore > 6) {
                recommendations.push({
                    type: 'service',
                    priority: 'high', 
                    title: `Improve ${service.name} Resilience`,
                    description: `Service has high risk score (${service.riskScore}). Enhance service security and resilience.`,
                    actions: ['Implement redundancy', 'Enhance monitoring', 'Review dependencies']
                });
            }
        });
        
        // Control-based recommendations
        const controlEffectiveness = this.calculateControlEffectiveness(risk);
        if (controlEffectiveness < 5) {
            recommendations.push({
                type: 'control',
                priority: 'medium',
                title: 'Improve Control Effectiveness',
                description: `Current controls have low effectiveness (${controlEffectiveness}/10). Enhance implementation.`,
                actions: ['Review control design', 'Improve implementation', 'Enhance monitoring and testing']
            });
        }
        
        return recommendations;
    }
    
    mapToComplianceFrameworks(risk) {
        const mappings = {};
        
        // ISO 27001:2022 mapping based on risk category
        if (risk.category) {
            const isoMapping = this.riskCategories[risk.category];
            if (isoMapping) {
                mappings.iso27001 = {
                    control: isoMapping.iso_control,
                    title: isoMapping.label,
                    description: isoMapping.description
                };
            }
        }
        
        // NIST CSF mapping
        mappings.nistCSF = this.mapToNISTCSF(risk);
        
        // SOC 2 mapping
        mappings.soc2 = this.mapToSOC2(risk);
        
        return mappings;
    }
    
    mapToNISTCSF(risk) {
        // Map risk to NIST Cybersecurity Framework functions
        const nistMappings = {
            'information_security_policies': 'ID.GV - Governance',
            'asset_management': 'ID.AM - Asset Management', 
            'access_control': 'PR.AC - Identity Management and Access Control',
            'cryptography': 'PR.DS - Data Security',
            'operations_security': 'PR.IP - Information Protection Processes',
            'incident_management': 'RS.RP - Response Planning',
            'business_continuity': 'RC.RP - Recovery Planning'
        };
        
        return nistMappings[risk.category] || 'Multiple Functions';
    }
    
    mapToSOC2(risk) {
        // Map risk to SOC 2 Trust Service Criteria
        const soc2Mappings = {
            'access_control': 'Common Criteria (CC) - Logical and Physical Access Controls',
            'information_security_policies': 'Common Criteria (CC) - Control Environment',
            'operations_security': 'Security - System Protection',
            'communications_security': 'Security - Network Security',
            'business_continuity': 'Availability - System Availability'
        };
        
        return soc2Mappings[risk.category] || 'Multiple Criteria';
    }
    
    // Enhanced risk register with full traceability
    generateEnhancedRiskRegister() {
        const risks = JSON.parse(localStorage.getItem('risks') || '[]');
        const assets = JSON.parse(localStorage.getItem('assets') || '[]');
        const services = JSON.parse(localStorage.getItem('services') || '[]');
        
        return risks.map(risk => {
            const assessment = this.generateRiskAssessmentReport(risk.id);
            return {
                ...risk,
                enhancedRiskScore: assessment.enhancedRiskScore,
                affectedAssetsCount: assessment.affectedAssets.length,
                affectedServicesCount: assessment.affectedServices.length,
                controlEffectiveness: assessment.controlEffectiveness,
                complianceMappings: assessment.complianceMapping,
                lastAssessment: new Date().toISOString()
            };
        });
    }
}

// Enhanced risk form integration
function getEnhancedRiskFormHTML(risk = null) {
    const isEdit = risk !== null;
    const framework = new IntegratedRiskFramework();
    
    // Get available assets and services for selection
    const assets = JSON.parse(localStorage.getItem('assets') || '[]');
    const services = JSON.parse(localStorage.getItem('services') || '[]');
    
    return `
        <div class="enhanced-risk-form">
            <form id="enhancedRiskForm" class="space-y-6">
                <!-- Basic Risk Information -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 class="text-lg font-medium text-blue-900 mb-4 flex items-center">
                        <i class="fas fa-info-circle mr-2"></i>
                        Risk Identification (NIST 800-30)
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Risk ID *</label>
                            <input type="text" id="riskId" value="${isEdit ? risk.risk_id || risk.id : ''}" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                ${isEdit ? 'readonly' : ''} required>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Risk Category *</label>
                            <select id="riskCategory" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                <option value="">Select ISO 27001:2022 Category</option>
                                ${Object.entries(framework.riskCategories).map(([key, category]) => 
                                    `<option value="${key}" ${isEdit && risk.category === key ? 'selected' : ''}>${category.iso_control} - ${category.label}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Risk Title *</label>
                        <input type="text" id="riskTitle" value="${isEdit ? risk.title || '' : ''}" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="e.g., Unauthorized access to customer database" required>
                    </div>
                    
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Risk Description *</label>
                        <textarea id="riskDescription" rows="3" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="Describe the risk scenario, potential causes, and business impact...">${isEdit ? risk.description || '' : ''}</textarea>
                    </div>
                    
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Threat Source *</label>
                        <select id="threatSource" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            <option value="">Select Threat Source</option>
                            ${Object.entries(framework.threatSources).map(([key, threat]) => 
                                `<option value="${key}" ${isEdit && risk.threatSource === key ? 'selected' : ''}>${threat.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <!-- Asset and Service Impact -->
                <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 class="text-lg font-medium text-green-900 mb-4 flex items-center">
                        <i class="fas fa-server mr-2"></i>
                        Affected Assets & Services
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Affected Assets</label>
                            <div class="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                                ${assets.map(asset => `
                                    <label class="flex items-center mb-2">
                                        <input type="checkbox" name="affectedAssets" value="${asset.id}"
                                            ${isEdit && risk.affectedAssets?.includes(asset.id) ? 'checked' : ''}
                                            class="mr-2">
                                        <span class="text-sm">${asset.name} (${asset.assetType})</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Affected Services</label>
                            <div class="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                                ${services.map(service => `
                                    <label class="flex items-center mb-2">
                                        <input type="checkbox" name="affectedServices" value="${service.id}"
                                            ${isEdit && risk.affectedServices?.includes(service.id) ? 'checked' : ''}
                                            class="mr-2">
                                        <span class="text-sm">${service.name} (${service.serviceTier})</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Risk Assessment (NIST 800-30) -->
                <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 class="text-lg font-medium text-red-900 mb-4 flex items-center">
                        <i class="fas fa-calculator mr-2"></i>
                        Risk Assessment (NIST 800-30)
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Likelihood *</label>
                            <select id="likelihood" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                onchange="calculateRiskScore()" required>
                                <option value="">Select Likelihood</option>
                                ${Object.entries(framework.riskMatrices.nist.likelihood).map(([key, level]) => 
                                    `<option value="${level.value}" ${isEdit && risk.likelihood === level.value ? 'selected' : ''}>${level.label}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Impact *</label>
                            <select id="impact" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                onchange="calculateRiskScore()" required>
                                <option value="">Select Impact</option>
                                ${Object.entries(framework.riskMatrices.nist.impact).map(([key, level]) => 
                                    `<option value="${level.value}" ${isEdit && risk.impact === level.value ? 'selected' : ''}>${level.label}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Risk Score</label>
                            <div id="riskScoreDisplay" class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-center font-bold">
                                ${isEdit ? (risk.riskScore || risk.risk_score || 'TBD') : 'TBD'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <div id="riskMatrix" class="text-sm text-gray-600">
                            Risk will be calculated based on affected assets, services, and NIST methodology
                        </div>
                    </div>
                </div>
                
                <!-- Risk Treatment -->
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 class="text-lg font-medium text-yellow-900 mb-4 flex items-center">
                        <i class="fas fa-shield-alt mr-2"></i>
                        Risk Treatment & Controls
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Treatment Strategy *</label>
                            <select id="treatmentStrategy" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                <option value="">Select Strategy</option>
                                <option value="mitigate" ${isEdit && risk.treatmentStrategy === 'mitigate' ? 'selected' : ''}>Mitigate (Reduce)</option>
                                <option value="transfer" ${isEdit && risk.treatmentStrategy === 'transfer' ? 'selected' : ''}>Transfer (Share)</option>
                                <option value="accept" ${isEdit && risk.treatmentStrategy === 'accept' ? 'selected' : ''}>Accept (Retain)</option>
                                <option value="avoid" ${isEdit && risk.treatmentStrategy === 'avoid' ? 'selected' : ''}>Avoid (Eliminate)</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Risk Owner *</label>
                            <select id="riskOwner" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                <option value="">Select Owner</option>
                                <option value="ciso" ${isEdit && risk.owner === 'ciso' ? 'selected' : ''}>CISO</option>
                                <option value="it-director" ${isEdit && risk.owner === 'it-director' ? 'selected' : ''}>IT Director</option>
                                <option value="business-owner" ${isEdit && risk.owner === 'business-owner' ? 'selected' : ''}>Business Owner</option>
                                <option value="compliance-officer" ${isEdit && risk.owner === 'compliance-officer' ? 'selected' : ''}>Compliance Officer</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mitigation Actions</label>
                        <textarea id="mitigationActions" rows="3" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="Describe planned or implemented risk mitigation actions...">${isEdit ? risk.mitigationActions || '' : ''}</textarea>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onclick="closeModal()" 
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type="submit" 
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        ${isEdit ? 'Update Risk' : 'Create Risk'}
                    </button>
                </div>
            </form>
        </div>
        
        <style>
        .enhanced-risk-form .risk-matrix-cell {
            padding: 0.5rem;
            text-align: center;
            border: 1px solid #e5e7eb;
            font-size: 0.75rem;
            font-weight: 600;
        }
        </style>
    `;
}

// Enhanced risk calculation with real-time updates
function calculateRiskScore() {
    const likelihood = parseInt(document.getElementById('likelihood')?.value) || 0;
    const impact = parseInt(document.getElementById('impact')?.value) || 0;
    
    if (likelihood && impact) {
        // Get selected assets and services
        const selectedAssets = Array.from(document.querySelectorAll('input[name="affectedAssets"]:checked'))
            .map(cb => cb.value);
        const selectedServices = Array.from(document.querySelectorAll('input[name="affectedServices"]:checked'))
            .map(cb => cb.value);
        
        // Get actual asset and service data
        const allAssets = JSON.parse(localStorage.getItem('assets') || '[]');
        const allServices = JSON.parse(localStorage.getItem('services') || '[]');
        
        const affectedAssets = allAssets.filter(asset => selectedAssets.includes(asset.id));
        const affectedServices = allServices.filter(service => selectedServices.includes(service.id));
        
        // Create temporary risk object for calculation
        const tempRisk = {
            likelihood: likelihood,
            impact: impact,
            affectedAssets: selectedAssets,
            affectedServices: selectedServices,
            threatSource: document.getElementById('threatSource')?.value
        };
        
        // Calculate enhanced risk score
        const framework = new IntegratedRiskFramework();
        const enhancedScore = framework.calculateEnhancedRiskScore(tempRisk, affectedAssets, affectedServices);
        
        // Update display
        const displayElement = document.getElementById('riskScoreDisplay');
        if (displayElement) {
            displayElement.textContent = enhancedScore.toFixed(2);
            displayElement.style.backgroundColor = getRiskScoreColor(enhancedScore);
            displayElement.style.color = enhancedScore > 5 ? 'white' : 'black';
        }
        
        // Update risk matrix explanation
        const matrixElement = document.getElementById('riskMatrix');
        if (matrixElement) {
            matrixElement.innerHTML = `
                <strong>Risk Calculation:</strong><br>
                Base Risk: ${likelihood} × ${impact} = ${likelihood * impact}<br>
                Enhanced Risk: ${enhancedScore.toFixed(2)} (includes asset/service impact)<br>
                Assets Affected: ${affectedAssets.length}<br>
                Services Affected: ${affectedServices.length}
            `;
        }
    }
}

// Enhanced risk form submission
async function handleEnhancedRiskSubmit(riskId = null) {
    const form = document.getElementById('enhancedRiskForm');
    if (!form) {
        console.error('Enhanced risk form not found');
        showNotification('Form not found', 'error');
        return;
    }

    // Get form data
    const formData = {
        risk_id: document.getElementById('riskId').value,
        title: document.getElementById('riskTitle').value,
        description: document.getElementById('riskDescription').value,
        category: document.getElementById('riskCategory').value,
        threatSource: document.getElementById('threatSource').value,
        likelihood: parseInt(document.getElementById('likelihood').value),
        impact: parseInt(document.getElementById('impact').value),
        treatmentStrategy: document.getElementById('treatmentStrategy').value,
        owner: document.getElementById('riskOwner').value,
        mitigationActions: document.getElementById('mitigationActions').value,
        affectedAssets: Array.from(document.querySelectorAll('input[name="affectedAssets"]:checked'))
            .map(cb => cb.value),
        affectedServices: Array.from(document.querySelectorAll('input[name="affectedServices"]:checked'))
            .map(cb => cb.value)
    };

    // Validation
    if (!formData.risk_id || !formData.title || !formData.category || !formData.threatSource ||
        !formData.likelihood || !formData.impact || !formData.treatmentStrategy || !formData.owner) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Calculate enhanced risk score
    const assets = JSON.parse(localStorage.getItem('assets') || '[]');
    const services = JSON.parse(localStorage.getItem('services') || '[]');
    const affectedAssets = assets.filter(asset => formData.affectedAssets.includes(asset.id));
    const affectedServices = services.filter(service => formData.affectedServices.includes(service.id));
    
    const framework = new IntegratedRiskFramework();
    const enhancedRiskScore = framework.calculateEnhancedRiskScore(formData, affectedAssets, affectedServices);
    
    let risks = JSON.parse(localStorage.getItem('risks') || '[]');
    const now = new Date().toISOString();

    if (riskId) {
        // Update existing risk
        const riskIndex = risks.findIndex(r => r.id === riskId);
        if (riskIndex !== -1) {
            risks[riskIndex] = {
                ...risks[riskIndex],
                ...formData,
                riskScore: enhancedRiskScore,
                risk_score: enhancedRiskScore,
                updatedAt: now
            };
            showNotification('Risk updated successfully', 'success');
        }
    } else {
        // Create new risk
        const newRisk = {
            id: Date.now().toString(),
            ...formData,
            riskScore: enhancedRiskScore,
            risk_score: enhancedRiskScore,
            status: 'active',
            createdAt: now,
            updatedAt: now
        };
        
        risks.push(newRisk);
        showNotification('Risk created successfully', 'success');
    }

    localStorage.setItem('risks', JSON.stringify(risks));
    closeModal();
    
    // Refresh displays if functions exist
    if (typeof showRisks === 'function') {
        showRisks();
    }
    if (typeof loadRisks === 'function') {
        loadRisks();
    }
}

// Enhanced risk creation function
function createEnhancedRisk() {
    const content = getEnhancedRiskFormHTML();
    createModal('Create Enhanced Risk Assessment', content, []);
    
    // Handle form submission with delay to ensure DOM is ready
    setTimeout(() => {
        const form = document.getElementById('enhancedRiskForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleEnhancedRiskSubmit();
            });
        } else {
            console.error('Enhanced risk form not found in modal');
        }
    }, 100);
}

function editEnhancedRisk(riskId) {
    const risks = JSON.parse(localStorage.getItem('risks') || '[]');
    const risk = risks.find(r => r.id === riskId || r.risk_id === riskId);
    
    if (!risk) {
        showNotification('Risk not found', 'error');
        return;
    }
    
    const content = getEnhancedRiskFormHTML(risk);
    createModal('Edit Enhanced Risk Assessment', content, []);
    
    // Handle form submission with delay
    setTimeout(() => {
        const form = document.getElementById('enhancedRiskForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleEnhancedRiskSubmit(riskId);
            });
        } else {
            console.error('Enhanced risk form not found in modal');
        }
    }, 100);
}

// Make enhanced functions globally available
window.IntegratedRiskFramework = IntegratedRiskFramework;
window.getEnhancedRiskFormHTML = getEnhancedRiskFormHTML;
window.handleEnhancedRiskSubmit = handleEnhancedRiskSubmit;
window.calculateRiskScore = calculateRiskScore;
window.createEnhancedRisk = createEnhancedRisk;
window.editEnhancedRisk = editEnhancedRisk;

// Initialize enhanced risk framework
document.addEventListener('DOMContentLoaded', function() {
    console.log('Integrated Risk Framework initialized');
});
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
                        Risk Identification
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Risk ID *</label>
                            <input type="text" id="riskId" value="${isEdit ? risk.risk_id || risk.id : ''}" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                ${isEdit ? 'readonly' : ''} required>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Risk Category (Optional)</label>
                            <select id="riskCategory" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select Category (Optional)</option>
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
                        <i class="fas fa-cogs mr-2"></i>
                        Affected Services
                    </h3>
                    
                    <div class="grid grid-cols-1 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Related Services</label>
                            <div class="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                                ${services.map(service => `
                                    <label class="flex items-center mb-2">
                                        <input type="checkbox" name="affectedServices" value="${service.id}"
                                            ${isEdit && risk.affectedServices?.includes(service.id) ? 'checked' : ''}
                                            class="mr-2">
                                        <span class="text-sm">${service.name} (${service.criticality || 'Standard'})</span>
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
                        Risk Assessment
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Likelihood *</label>
                            <select id="likelihood" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                onchange="setTimeout(calculateRiskScore, 100)" required>
                                <option value="">Select Likelihood</option>
                                ${Object.entries(framework.riskMatrices.nist.likelihood).map(([key, level]) => 
                                    `<option value="${level.value}" ${isEdit && risk.likelihood === level.value ? 'selected' : ''}>${level.label}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Impact *</label>
                            <select id="impact" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                onchange="setTimeout(calculateRiskScore, 100)" required>
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
                
                <!-- AI Risk Assessment -->
                <div class="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h3 class="text-lg font-medium text-purple-900 mb-4 flex items-center">
                        <i class="fas fa-brain mr-2"></i>
                        AI Risk Assessment
                    </h3>
                    
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <p class="text-sm text-gray-600">Get AI-powered risk analysis based on your risk details and related services</p>
                            <button type="button" id="analyze-with-ai" onclick="performAIRiskAssessment()"
                                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium">
                                <i class="fas fa-robot mr-2"></i>Analyze with AI
                            </button>
                        </div>
                        
                        <!-- AI Suggestions Display -->
                        <div id="ai-suggestions" class="hidden">
                            <div class="bg-white rounded-lg border border-purple-200 p-4">
                                <h4 class="font-medium text-purple-900 mb-3">AI Analysis Results:</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">AI Suggested Likelihood:</label>
                                        <div id="ai-likelihood" class="text-sm text-gray-600 p-2 bg-gray-50 rounded"></div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">AI Suggested Impact:</label>
                                        <div id="ai-impact" class="text-sm text-gray-600 p-2 bg-gray-50 rounded"></div>
                                    </div>
                                </div>
                                <div class="mt-3">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">AI Risk Score:</label>
                                    <div id="ai-risk-score" class="text-lg font-bold text-purple-700 p-2 bg-gray-50 rounded"></div>
                                </div>
                                <div class="mt-3">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">AI Recommendations:</label>
                                    <div id="ai-recommendations" class="text-sm text-gray-600 p-2 bg-gray-50 rounded"></div>
                                </div>
                                <div class="mt-3 flex space-x-2">
                                    <button type="button" onclick="applyAISuggestions()"
                                        class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                                        Apply AI Suggestions
                                    </button>
                                    <button type="button" onclick="dismissAISuggestions()"
                                        class="px-3 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500">
                                        Dismiss
                                    </button>
                                </div>
                            </div>
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
    
    // Update risk score display immediately when values are selected
    const displayElement = document.getElementById('riskScoreDisplay');
    const matrixElement = document.getElementById('riskMatrix');
    
    if (likelihood && impact) {
        // Calculate base risk score (likelihood × impact)
        const baseRiskScore = likelihood * impact;
        
        // Get selected services only (we removed assets from the form)
        const selectedServices = Array.from(document.querySelectorAll('input[name="affectedServices"]:checked'))
            .map(cb => cb.value);
        
        // Calculate service impact factor
        let serviceImpactMultiplier = 1.0;
        let serviceImpactDescription = '';
        
        if (selectedServices.length > 0) {
            // Fetch service data to calculate impact
            try {
                // Simple service impact calculation based on count and criticality
                // In a real system, you'd fetch actual service criticality from the API
                const serviceCount = selectedServices.length;
                
                if (serviceCount >= 3) {
                    serviceImpactMultiplier = 1.5; // High impact for multiple services
                    serviceImpactDescription = 'High service impact (3+ services)';
                } else if (serviceCount >= 2) {
                    serviceImpactMultiplier = 1.3; // Medium impact for 2 services
                    serviceImpactDescription = 'Medium service impact (2 services)';
                } else if (serviceCount === 1) {
                    serviceImpactMultiplier = 1.1; // Low impact for 1 service
                    serviceImpactDescription = 'Low service impact (1 service)';
                }
            } catch (error) {
                console.log('Using default service impact calculation');
                serviceImpactMultiplier = 1.0 + (selectedServices.length * 0.1);
                serviceImpactDescription = `Service impact factor: ${selectedServices.length} service(s)`;
            }
        }
        
        // Calculate final risk score
        const finalRiskScore = baseRiskScore * serviceImpactMultiplier;
        
        // Update main risk score display
        if (displayElement) {
            displayElement.textContent = Math.round(finalRiskScore);
            displayElement.style.backgroundColor = getRiskScoreColor(finalRiskScore);
            displayElement.style.color = finalRiskScore > 15 ? 'white' : '#374151';
            displayElement.style.fontWeight = 'bold';
            displayElement.style.fontSize = '1.25rem';
        }
        
        // Update risk calculation explanation
        if (matrixElement) {
            const riskLevel = getRiskLevel(finalRiskScore);
            matrixElement.innerHTML = `
                <div class="space-y-2">
                    <div><strong>Risk Calculation:</strong></div>
                    <div>Base Risk: ${likelihood} × ${impact} = ${baseRiskScore}</div>
                    ${selectedServices.length > 0 ? 
                        `<div>Service Impact: ×${serviceImpactMultiplier.toFixed(1)} (${serviceImpactDescription})</div>
                         <div><strong>Final Risk Score: ${Math.round(finalRiskScore)} (${riskLevel})</strong></div>` :
                        `<div><strong>Final Risk Score: ${baseRiskScore} (${getRiskLevel(baseRiskScore)})</strong></div>`
                    }
                    <div class="text-xs text-gray-500 mt-2">
                        Services Affected: ${selectedServices.length}
                    </div>
                </div>`
        }
    } else {
        // Clear displays when no values selected
        if (displayElement) {
            displayElement.textContent = 'TBD';
            displayElement.style.backgroundColor = '#f3f4f6';
            displayElement.style.color = '#6b7280';
        }
        
        if (matrixElement) {
            matrixElement.innerHTML = `
                <div class="text-gray-600">
                    Select likelihood and impact to calculate risk score
                </div>`;
        }
    }
}

// Helper functions for risk score display
function getRiskScoreColor(score) {
    if (score >= 20) return '#dc2626'; // Red - Critical
    if (score >= 15) return '#ea580c'; // Orange - High
    if (score >= 10) return '#d97706'; // Amber - Medium-High
    if (score >= 5) return '#eab308';  // Yellow - Medium
    return '#16a34a'; // Green - Low
}

function getRiskLevel(score) {
    if (score >= 20) return 'Critical';
    if (score >= 15) return 'High';
    if (score >= 10) return 'Medium-High';
    if (score >= 5) return 'Medium';
    return 'Low';
}

// Enhanced risk form submission using API
async function handleEnhancedRiskSubmit(riskId = null) {
    const form = document.getElementById('enhancedRiskForm');
    if (!form) {
        console.error('Enhanced risk form not found');
        showNotification('Form not found', 'error');
        return;
    }

    // Get form data and map to API format
    const formData = {
        title: document.getElementById('riskTitle').value,
        description: document.getElementById('riskDescription').value,
        category_id: document.getElementById('riskCategory').value || null,
        threat_source: document.getElementById('threatSource').value,
        probability: parseInt(document.getElementById('likelihood').value),
        impact: parseInt(document.getElementById('impact').value),
        treatment_strategy: document.getElementById('treatmentStrategy').value,
        mitigation_plan: document.getElementById('mitigationActions').value,
        related_services: Array.from(document.querySelectorAll('input[name="affectedServices"]:checked'))
            .map(cb => cb.value).join(','),
        organization_id: 1, // Default organization
        owner_id: 1 // Default owner - this should be dynamic in production
    };

    // Basic validation - only title is required now (category is optional)
    if (!formData.title || !formData.probability || !formData.impact) {
        showNotification('Please fill in title, probability, and impact', 'error');
        return;
    }

    try {
        // Try multiple token storage keys
        const token = localStorage.getItem('dmt_token') ||           // Main app token
                     localStorage.getItem('authToken') || 
                     localStorage.getItem('token') || 
                     localStorage.getItem('dmt_access_token') ||      // Keycloak token
                     sessionStorage.getItem('authToken');
                     
        if (!token) {
            showNotification('Authentication required - please log in', 'error');
            return;
        }

        let response;
        if (riskId) {
            // Update existing risk
            response = await fetch(`/api/risks/${riskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
        } else {
            // Create new risk
            response = await fetch('/api/risks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
        }

        const result = await response.json();

        if (result.success) {
            showNotification(
                riskId ? 'Risk updated successfully' : 'Risk created successfully', 
                'success'
            );
            closeModal();
            
            // Refresh the risk list display
            if (typeof showRisks === 'function') {
                showRisks();
            }
            if (typeof loadRisks === 'function') {
                loadRisks();
            }
            
            // Refresh completed - no additional module data loading needed
        } else {
            throw new Error(result.error || 'Operation failed');
        }
        
    } catch (error) {
        console.error('Risk submission error:', error);
        showNotification('Failed to save risk. Please try again.', 'error');
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
            
            // Initialize risk score calculation
            setTimeout(() => {
                calculateRiskScore();
                
                // Add event listeners for service checkboxes to trigger recalculation
                const serviceCheckboxes = document.querySelectorAll('input[name="affectedServices"]');
                serviceCheckboxes.forEach(checkbox => {
                    checkbox.addEventListener('change', () => setTimeout(calculateRiskScore, 50));
                });
            }, 200);
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

// AI Risk Assessment Functions
async function performAIRiskAssessment() {
    const button = document.getElementById('analyze-with-ai');
    const suggestionsDiv = document.getElementById('ai-suggestions');
    
    // Get form data
    const title = document.getElementById('riskTitle')?.value || '';
    const description = document.getElementById('riskDescription')?.value || '';
    const selectedServices = Array.from(document.querySelectorAll('input[name="affectedServices"]:checked'))
        .map(cb => cb.value).join(',');
    
    if (!title.trim()) {
        showNotification('Please enter a risk title before using AI analysis', 'warning');
        return;
    }
    
    // Show loading state
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
    
    try {
        // Try multiple token storage keys (different parts of the app may use different keys)
        const token = localStorage.getItem('dmt_token') ||           // Main app token
                     localStorage.getItem('authToken') || 
                     localStorage.getItem('token') || 
                     localStorage.getItem('dmt_access_token') ||      // Keycloak token
                     sessionStorage.getItem('authToken');
                     
        if (!token) {
            throw new Error('Authentication token not found. Please log in again.');
        }

        const response = await fetch('/api/risks/ai-assessment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: title,
                description: description,
                related_services: selectedServices
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                displayAISuggestions(result.data);
                suggestionsDiv.classList.remove('hidden');
                showNotification('AI risk assessment completed successfully', 'success');
            } else {
                throw new Error(result.error || 'AI assessment failed');
            }
        } else {
            throw new Error('Failed to get AI assessment');
        }
    } catch (error) {
        console.error('AI Assessment error:', error);
        showNotification('AI assessment failed. Please try again.', 'error');
    } finally {
        // Reset button
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-robot mr-2"></i>Analyze with AI';
    }
}

function displayAISuggestions(aiData) {
    // Display AI suggestions
    document.getElementById('ai-likelihood').textContent = 
        `${aiData.probability}/5 - ${aiData.probability_reasoning}`;
    document.getElementById('ai-impact').textContent = 
        `${aiData.impact}/5 - ${aiData.impact_reasoning}`;
    document.getElementById('ai-risk-score').textContent = 
        `${aiData.risk_score} (${getRiskLevelText(aiData.risk_score)})`;
    
    // Display recommendations
    const recommendationsDiv = document.getElementById('ai-recommendations');
    if (aiData.mitigation_recommendations && aiData.mitigation_recommendations.length > 0) {
        recommendationsDiv.innerHTML = `
            <ul class="list-disc list-inside space-y-1">
                ${aiData.mitigation_recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        `;
    } else {
        recommendationsDiv.textContent = 'No specific recommendations provided';
    }
    
    // Store AI data for potential application
    window.currentAISuggestions = aiData;
}

function applyAISuggestions() {
    if (!window.currentAISuggestions) return;
    
    const aiData = window.currentAISuggestions;
    
    // Apply likelihood and impact
    const likelihoodSelect = document.getElementById('likelihood');
    const impactSelect = document.getElementById('impact');
    const threatSourceSelect = document.getElementById('threatSource');
    
    if (likelihoodSelect && aiData.probability) {
        likelihoodSelect.value = aiData.probability;
    }
    if (impactSelect && aiData.impact) {
        impactSelect.value = aiData.impact;
    }
    if (threatSourceSelect && aiData.threat_source) {
        // Map AI threat source to form options
        const threatMapping = {
            'internal': 'insider',
            'external': 'external',
            'technical_failure': 'system',
            'human_error': 'human',
            'process_failure': 'process',
            'natural_disaster': 'environmental',
            'regulatory_change': 'regulatory'
        };
        const mappedThreat = threatMapping[aiData.threat_source];
        if (mappedThreat) {
            threatSourceSelect.value = mappedThreat;
        }
    }
    
    // Update mitigation actions if available
    const mitigationTextarea = document.getElementById('mitigationActions');
    if (mitigationTextarea && aiData.mitigation_recommendations) {
        const currentText = mitigationTextarea.value.trim();
        const aiRecommendations = aiData.mitigation_recommendations.join('\n• ');
        const newText = currentText ? 
            `${currentText}\n\nAI Recommendations:\n• ${aiRecommendations}` :
            `AI Recommendations:\n• ${aiRecommendations}`;
        mitigationTextarea.value = newText;
    }
    
    // Recalculate risk score
    calculateRiskScore();
    
    showNotification('AI suggestions applied successfully', 'success');
    dismissAISuggestions();
}

function dismissAISuggestions() {
    document.getElementById('ai-suggestions').classList.add('hidden');
    window.currentAISuggestions = null;
}

function getRiskLevelText(score) {
    if (score >= 20) return 'Very High';
    if (score >= 15) return 'High';
    if (score >= 10) return 'Medium';
    if (score >= 5) return 'Low';
    return 'Very Low';
}

// Make enhanced functions globally available
window.IntegratedRiskFramework = IntegratedRiskFramework;
window.getEnhancedRiskFormHTML = getEnhancedRiskFormHTML;
window.handleEnhancedRiskSubmit = handleEnhancedRiskSubmit;
window.calculateRiskScore = calculateRiskScore;
window.createEnhancedRisk = createEnhancedRisk;
window.editEnhancedRisk = editEnhancedRisk;
window.performAIRiskAssessment = performAIRiskAssessment;
window.applyAISuggestions = applyAISuggestions;
window.dismissAISuggestions = dismissAISuggestions;
window.getRiskScoreColor = getRiskScoreColor;
window.getRiskLevel = getRiskLevel;

// Initialize enhanced risk framework
document.addEventListener('DOMContentLoaded', function() {
    console.log('Integrated Risk Framework initialized');
});
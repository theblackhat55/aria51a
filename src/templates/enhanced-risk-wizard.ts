import { html } from 'hono/html'

export function renderEnhancedRiskWizard() {
  return html`
    <div class="max-w-6xl mx-auto p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Enhanced Risk Assessment Wizard</h1>
          <p class="text-gray-600">Create comprehensive risk assessments using the integrated risk management framework</p>
        </div>
        <div class="flex space-x-3">
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <i class="fas fa-save mr-2"></i>Save Draft
          </button>
          <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
            <i class="fas fa-check mr-2"></i>Complete Assessment
          </button>
        </div>
      </div>

      <!-- Progress Indicator -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
            <div class="w-24 h-1 bg-blue-600 ml-2"></div>
          </div>
          <div class="flex items-center">
            <div class="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
            <div class="w-24 h-1 bg-gray-300 ml-2"></div>
          </div>
          <div class="flex items-center">
            <div class="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
            <div class="w-24 h-1 bg-gray-300 ml-2"></div>
          </div>
          <div class="flex items-center">
            <div class="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
            <div class="w-24 h-1 bg-gray-300 ml-2"></div>
          </div>
          <div class="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">5</div>
        </div>
        <div class="flex justify-between mt-2 text-sm text-gray-600">
          <span class="font-semibold text-blue-600">Threat Sources</span>
          <span>Threat Events</span>
          <span>Vulnerabilities</span>
          <span>Assets</span>
          <span>Risk Calculation</span>
        </div>
      </div>

      <!-- Main Form -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <form id="enhanced-risk-form" class="space-y-8">
          
          <!-- Step 1: Threat Sources -->
          <div id="step-1" class="step-content">
            <h2 class="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <i class="fas fa-crosshairs mr-3 text-red-600"></i>
              Step 1: Identify Threat Sources
            </h2>
            
            <div class="grid md:grid-cols-2 gap-6">
              <!-- Adversarial Threats -->
              <div class="border rounded-lg p-6 bg-red-50">
                <h3 class="text-lg font-semibold text-red-800 mb-4 flex items-center">
                  <i class="fas fa-user-ninja mr-2"></i>
                  Adversarial Threats
                </h3>
                
                <div class="space-y-3">
                  <label class="flex items-center">
                    <input type="checkbox" name="threat_sources[]" value="apt_groups" class="mr-3 text-red-600">
                    <div>
                      <span class="font-medium">Advanced Persistent Threat (APT) Groups</span>
                      <p class="text-sm text-gray-600">State-sponsored cyber espionage groups</p>
                    </div>
                  </label>
                  
                  <label class="flex items-center">
                    <input type="checkbox" name="threat_sources[]" value="cybercriminals" class="mr-3 text-red-600">
                    <div>
                      <span class="font-medium">Organized Cybercriminals</span>
                      <p class="text-sm text-gray-600">Professional criminal organizations</p>
                    </div>
                  </label>
                  
                  <label class="flex items-center">
                    <input type="checkbox" name="threat_sources[]" value="hacktivists" class="mr-3 text-red-600">
                    <div>
                      <span class="font-medium">Hacktivist Collectives</span>
                      <p class="text-sm text-gray-600">Ideologically motivated groups</p>
                    </div>
                  </label>
                  
                  <label class="flex items-center">
                    <input type="checkbox" name="threat_sources[]" value="malicious_insiders" class="mr-3 text-red-600">
                    <div>
                      <span class="font-medium">Malicious Insiders</span>
                      <p class="text-sm text-gray-600">Employees with authorized access</p>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Non-Adversarial Threats -->
              <div class="border rounded-lg p-6 bg-blue-50">
                <h3 class="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <i class="fas fa-exclamation-triangle mr-2"></i>
                  Non-Adversarial Threats
                </h3>
                
                <div class="space-y-3">
                  <label class="flex items-center">
                    <input type="checkbox" name="threat_sources[]" value="human_error" class="mr-3 text-blue-600">
                    <div>
                      <span class="font-medium">Human Error</span>
                      <p class="text-sm text-gray-600">Accidental actions by authorized users</p>
                    </div>
                  </label>
                  
                  <label class="flex items-center">
                    <input type="checkbox" name="threat_sources[]" value="system_failures" class="mr-3 text-blue-600">
                    <div>
                      <span class="font-medium">System Failures</span>
                      <p class="text-sm text-gray-600">Hardware/software malfunctions</p>
                    </div>
                  </label>
                  
                  <label class="flex items-center">
                    <input type="checkbox" name="threat_sources[]" value="environmental" class="mr-3 text-blue-600">
                    <div>
                      <span class="font-medium">Environmental</span>
                      <p class="text-sm text-gray-600">Natural disasters and weather events</p>
                    </div>
                  </label>
                  
                  <label class="flex items-center">
                    <input type="checkbox" name="threat_sources[]" value="infrastructure" class="mr-3 text-blue-600">
                    <div>
                      <span class="font-medium">Infrastructure Outages</span>
                      <p class="text-sm text-gray-600">Power failures, ISP outages</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Threat Source Details -->
            <div class="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 class="font-semibold text-gray-800 mb-3">Threat Source Assessment</h4>
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Likelihood Score (1-5)</label>
                  <select name="likelihood_score" class="w-full border border-gray-300 rounded-lg p-2">
                    <option value="1">1 - Very Low</option>
                    <option value="2">2 - Low</option>
                    <option value="3" selected>3 - Medium</option>
                    <option value="4">4 - High</option>
                    <option value="5">5 - Very High</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Impact Potential</label>
                  <select name="impact_potential" class="w-full border border-gray-300 rounded-lg p-2">
                    <option value="Low">Low</option>
                    <option value="Medium" selected>Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between pt-6 border-t">
            <button type="button" class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors" disabled>
              <i class="fas fa-arrow-left mr-2"></i>Previous
            </button>
            <button type="button" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors" onclick="nextStep()">
              Next<i class="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
        </form>
      </div>

      <!-- Risk Flow Diagram -->
      <div class="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-project-diagram mr-3 text-purple-600"></i>
          Risk Management Flow
        </h3>
        
        <div class="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
          <div class="flex items-center justify-between text-sm">
            <div class="text-center">
              <div class="w-12 h-12 bg-red-100 border-2 border-red-500 rounded-full flex items-center justify-center mb-2">
                <i class="fas fa-crosshairs text-red-600"></i>
              </div>
              <span class="font-semibold">Threat Sources</span>
            </div>
            
            <div class="flex-1 mx-2">
              <div class="border-t-2 border-dashed border-gray-400 relative">
                <span class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-2 text-xs text-gray-600">impose</span>
              </div>
            </div>
            
            <div class="text-center">
              <div class="w-12 h-12 bg-orange-100 border-2 border-orange-500 rounded-full flex items-center justify-center mb-2">
                <i class="fas fa-bolt text-orange-600"></i>
              </div>
              <span class="font-semibold">Threat Events</span>
            </div>
            
            <div class="flex-1 mx-2">
              <div class="border-t-2 border-dashed border-gray-400 relative">
                <span class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-2 text-xs text-gray-600">exploit</span>
              </div>
            </div>
            
            <div class="text-center">
              <div class="w-12 h-12 bg-yellow-100 border-2 border-yellow-500 rounded-full flex items-center justify-center mb-2">
                <i class="fas fa-shield-alt text-yellow-600"></i>
              </div>
              <span class="font-semibold">Vulnerabilities</span>
            </div>
            
            <div class="flex-1 mx-2">
              <div class="border-t-2 border-dashed border-gray-400 relative">
                <span class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-2 text-xs text-gray-600">impact</span>
              </div>
            </div>
            
            <div class="text-center">
              <div class="w-12 h-12 bg-green-100 border-2 border-green-500 rounded-full flex items-center justify-center mb-2">
                <i class="fas fa-database text-green-600"></i>
              </div>
              <span class="font-semibold">Assets</span>
            </div>
          </div>
        </div>
        
        <!-- Controls Layer -->
        <div class="mt-4 p-4 bg-blue-50 rounded-lg">
          <div class="text-center">
            <h4 class="font-semibold text-blue-800 mb-2">Control Framework</h4>
            <div class="flex justify-center space-x-6">
              <div class="text-center">
                <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-1">
                  <i class="fas fa-stop text-white text-sm"></i>
                </div>
                <span class="text-xs font-medium">Preventive</span>
              </div>
              <div class="text-center">
                <div class="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mb-1">
                  <i class="fas fa-search text-white text-sm"></i>
                </div>
                <span class="text-xs font-medium">Detective</span>
              </div>
              <div class="text-center">
                <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mb-1">
                  <i class="fas fa-tools text-white text-sm"></i>
                </div>
                <span class="text-xs font-medium">Corrective</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Assistant Integration -->
      <div class="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-lg font-semibold mb-2">Need Help with Risk Assessment?</h4>
            <p class="text-blue-100">Ask ARIA about threat sources, vulnerabilities, or control recommendations.</p>
          </div>
          <button class="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors" onclick="openAriaChat()">
            <i class="fas fa-robot mr-2"></i>Ask ARIA
          </button>
        </div>
      </div>
    </div>

    <script>
      let currentStep = 1;
      const totalSteps = 5;

      function nextStep() {
        if (currentStep < totalSteps) {
          currentStep++;
          updateStepDisplay();
        }
      }

      function previousStep() {
        if (currentStep > 1) {
          currentStep--;
          updateStepDisplay();
        }
      }

      function updateStepDisplay() {
        // Update progress indicator
        document.querySelectorAll('.step-content').forEach((el, index) => {
          el.style.display = (index + 1 === currentStep) ? 'block' : 'none';
        });
        
        // Update progress circles and lines
        document.querySelectorAll('.w-8.h-8').forEach((el, index) => {
          if (index < currentStep) {
            el.className = el.className.replace('bg-gray-300 text-gray-600', 'bg-blue-600 text-white');
          }
        });
      }

      function openAriaChat() {
        // Integration with existing ARIA chatbot
        if (window.toggleAriaChat) {
          window.toggleAriaChat();
          // Pre-populate with risk assessment question
          setTimeout(() => {
            const input = document.querySelector('#aria-message-input');
            if (input) {
              input.value = "I'm working on a risk assessment. Can you help me understand the relationship between threat sources and vulnerabilities?";
            }
          }, 500);
        }
      }

      // Initialize form
      document.addEventListener('DOMContentLoaded', function() {
        updateStepDisplay();
        
        // Add form validation
        document.getElementById('enhanced-risk-form').addEventListener('submit', function(e) {
          e.preventDefault();
          
          // Collect form data
          const formData = new FormData(this);
          const riskData = {
            threatSources: formData.getAll('threat_sources[]'),
            likelihoodScore: formData.get('likelihood_score'),
            impactPotential: formData.get('impact_potential')
          };
          
          console.log('Risk Assessment Data:', riskData);
          
          // Show success message
          alert('Risk assessment data collected! This would normally be saved to the database.');
        });
      });
    </script>
  `
}

export function renderEnhancedRiskDashboard() {
  return html`
    <div class="max-w-7xl mx-auto p-6">
      <!-- Header with Statistics -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Enhanced Risk Management Dashboard</h1>
        
        <!-- Risk Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div class="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-500">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-crosshairs text-red-600 text-xl"></i>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Active Threat Sources</p>
                <p class="text-2xl font-semibold text-gray-900">12</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-lg border-l-4 border-yellow-500">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-shield-alt text-yellow-600 text-xl"></i>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Open Vulnerabilities</p>
                <p class="text-2xl font-semibold text-gray-900">8</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-database text-blue-600 text-xl"></i>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Critical Assets</p>
                <p class="text-2xl font-semibold text-gray-900">25</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-shield-check text-green-600 text-xl"></i>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Active Controls</p>
                <p class="text-2xl font-semibold text-gray-900">47</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-4 mb-8">
        <a href="/risk/enhanced-wizard" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center">
          <i class="fas fa-plus mr-2"></i>
          New Risk Assessment
        </a>
        <button class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center">
          <i class="fas fa-crosshairs mr-2"></i>
          Manage Threat Sources
        </button>
        <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center">
          <i class="fas fa-shield-alt mr-2"></i>
          Vulnerability Scan
        </button>
        <button class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center">
          <i class="fas fa-database mr-2"></i>
          Asset Inventory
        </button>
      </div>

      <!-- Risk Heat Map -->
      <div class="grid lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <h3 class="text-xl font-semibold text-gray-800 mb-4">Risk Heat Map</h3>
            <div class="grid grid-cols-5 gap-2">
              <!-- Risk Matrix -->
              ${Array(25).fill(0).map((_, index) => {
                const row = Math.floor(index / 5);
                const col = index % 5;
                let bgColor = 'bg-green-200';
                
                if (row + col > 6) bgColor = 'bg-red-500';
                else if (row + col > 4) bgColor = 'bg-orange-400';
                else if (row + col > 2) bgColor = 'bg-yellow-300';
                
                return html`
                  <div class="${bgColor} h-12 rounded flex items-center justify-center text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity">
                    ${row + col > 6 ? 'H' : row + col > 4 ? 'M' : row + col > 2 ? 'L' : 'VL'}
                  </div>
                `;
              })}
            </div>
            <div class="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>Low Impact →</span>
              <span>← High Impact</span>
            </div>
            <div class="mt-2 text-sm text-gray-600 text-center">Likelihood (Low → High)</div>
          </div>
        </div>

        <!-- Top Risks -->
        <div>
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <h3 class="text-xl font-semibold text-gray-800 mb-4">Top 5 Risks</h3>
            <div class="space-y-4">
              ${[
                { name: 'Ransomware Attack', level: 'Critical', score: 24 },
                { name: 'Data Breach', level: 'High', score: 18 },
                { name: 'System Outage', level: 'High', score: 16 },
                { name: 'Insider Threat', level: 'Medium', score: 12 },
                { name: 'Supply Chain Compromise', level: 'Medium', score: 10 }
              ].map(risk => html`
                <div class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p class="font-medium text-gray-900">${risk.name}</p>
                    <p class="text-sm text-gray-600">Risk Score: ${risk.score}</p>
                  </div>
                  <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                    risk.level === 'Critical' ? 'bg-red-100 text-red-800' :
                    risk.level === 'High' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }">${risk.level}</span>
                </div>
              `)}
            </div>
          </div>
        </div>
      </div>

      <!-- Control Effectiveness Matrix -->
      <div class="mt-8">
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <h3 class="text-xl font-semibold text-gray-800 mb-4">Control Coverage Analysis</h3>
          
          <div class="grid md:grid-cols-3 gap-6">
            <!-- Preventive Controls -->
            <div class="border rounded-lg p-4">
              <h4 class="font-semibold text-green-700 mb-3 flex items-center">
                <i class="fas fa-stop mr-2"></i>
                Preventive Controls
              </h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm">Firewall</span>
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div class="bg-green-500 h-2 rounded-full" style="width: 85%"></div>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Access Control</span>
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div class="bg-green-500 h-2 rounded-full" style="width: 90%"></div>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Security Training</span>
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div class="bg-yellow-500 h-2 rounded-full" style="width: 65%"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Detective Controls -->
            <div class="border rounded-lg p-4">
              <h4 class="font-semibold text-yellow-700 mb-3 flex items-center">
                <i class="fas fa-search mr-2"></i>
                Detective Controls
              </h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm">SIEM</span>
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div class="bg-green-500 h-2 rounded-full" style="width: 80%"></div>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Vulnerability Scanning</span>
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div class="bg-yellow-500 h-2 rounded-full" style="width: 70%"></div>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Log Monitoring</span>
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div class="bg-red-500 h-2 rounded-full" style="width: 45%"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Corrective Controls -->
            <div class="border rounded-lg p-4">
              <h4 class="font-semibold text-purple-700 mb-3 flex items-center">
                <i class="fas fa-tools mr-2"></i>
                Corrective Controls
              </h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm">Incident Response</span>
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div class="bg-green-500 h-2 rounded-full" style="width: 75%"></div>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Backup & Recovery</span>
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div class="bg-green-500 h-2 rounded-full" style="width: 95%"></div>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Forensics</span>
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div class="bg-yellow-500 h-2 rounded-full" style="width: 60%"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
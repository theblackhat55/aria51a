// DMT Risk Assessment System - Enhanced Risk Management Features
// AI Integration, Risk Score Calculation, and Improved Editing

// AI-powered risk assessment functions
async function generateAIRiskAssessment() {
  const titleField = document.getElementById('risk-title');
  const descriptionField = document.getElementById('risk-description');
  const servicesField = document.getElementById('risk-services');
  
  if (!titleField?.value || !descriptionField?.value) {
    showToast('Please provide risk title and description before AI analysis', 'warning');
    return;
  }
  
  const button = event.target;
  const originalText = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Analyzing...';
  button.disabled = true;
  
  try {
    const selectedServices = Array.from(servicesField.selectedOptions).map(opt => opt.text).join(', ');
    
    const analysisData = {
      title: titleField.value,
      description: descriptionField.value,
      services: selectedServices,
      threat_source: document.getElementById('risk-threat-source')?.value || ''
    };
    
    const token = localStorage.getItem('dmt_token');
    const response = await axios.post('/api/ai/risk-assessment', analysisData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const analysis = response.data.analysis;
      
      // Show AI results
      document.getElementById('ai-assessment-results').classList.remove('hidden');
      document.getElementById('ai-probability-suggestion').textContent = `${analysis.probability}/5 - ${getProbabilityLabel(analysis.probability)}`;
      document.getElementById('ai-impact-suggestion').textContent = `${analysis.impact}/5 - ${getImpactLabel(analysis.impact)}`;
      document.getElementById('ai-analysis-text').textContent = analysis.reasoning || 'AI analysis completed successfully.';
      
      // Store AI suggestions for easy application
      window.aiSuggestions = {
        probability: analysis.probability,
        impact: analysis.impact
      };
      
      showToast('AI risk assessment completed!', 'success');
    } else {
      throw new Error(response.data.message || 'AI analysis failed');
    }
  } catch (error) {
    console.error('AI risk assessment error:', error);
    showToast('AI analysis temporarily unavailable. Please assess manually.', 'info');
  } finally {
    button.innerHTML = originalText;
    button.disabled = false;
  }
}

function applyAIProbability() {
  if (window.aiSuggestions?.probability) {
    document.getElementById('risk-probability').value = window.aiSuggestions.probability;
    updateRiskScoreCalculation();
    showToast('AI probability suggestion applied', 'success');
  }
}

function applyAIImpact() {
  if (window.aiSuggestions?.impact) {
    document.getElementById('risk-impact').value = window.aiSuggestions.impact;
    updateRiskScoreCalculation();
    showToast('AI impact suggestion applied', 'success');
  }
}

function getProbabilityLabel(value) {
  const labels = { 1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very High' };
  return labels[value] || 'Unknown';
}

function getImpactLabel(value) {
  const labels = { 1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very High' };
  return labels[value] || 'Unknown';
}

// Risk score calculation and display
function updateRiskScoreCalculation() {
  const probabilityField = document.getElementById('risk-probability');
  const impactField = document.getElementById('risk-impact');
  const scoreDisplay = document.getElementById('calculated-risk-score');
  const levelIndicator = document.getElementById('risk-level-indicator');
  
  if (!probabilityField || !impactField || !scoreDisplay || !levelIndicator) {
    return;
  }
  
  const probability = parseInt(probabilityField.value);
  const impact = parseInt(impactField.value);
  
  if (probability && impact) {
    const riskScore = probability * impact;
    scoreDisplay.textContent = riskScore;
    
    // Update risk level indicator
    let level, colorClass;
    if (riskScore >= 20) {
      level = 'Critical';
      colorClass = 'bg-red-600 text-white';
    } else if (riskScore >= 15) {
      level = 'High';
      colorClass = 'bg-orange-500 text-white';
    } else if (riskScore >= 10) {
      level = 'Medium';
      colorClass = 'bg-yellow-500 text-white';
    } else if (riskScore >= 5) {
      level = 'Low';
      colorClass = 'bg-green-500 text-white';
    } else {
      level = 'Very Low';
      colorClass = 'bg-gray-500 text-white';
    }
    
    levelIndicator.textContent = `${level} Risk`;
    levelIndicator.className = `px-4 py-2 rounded-lg text-sm font-medium ${colorClass}`;
  } else {
    scoreDisplay.textContent = '-';
    levelIndicator.textContent = 'Select probability and impact';
    levelIndicator.className = 'px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-600';
  }
}

// Risk scoring guide
function showRiskScoringGuide(type) {
  const guides = {
    probability: {
      title: 'Probability Scoring Guide',
      content: `
        <div class="space-y-3">
          <div class="border-l-4 border-red-500 pl-3">
            <strong>5 - Very High (76-100%)</strong>
            <p class="text-sm text-gray-600">Almost certain to occur within the next year</p>
          </div>
          <div class="border-l-4 border-orange-500 pl-3">
            <strong>4 - High (51-75%)</strong>
            <p class="text-sm text-gray-600">Likely to occur within the next year</p>
          </div>
          <div class="border-l-4 border-yellow-500 pl-3">
            <strong>3 - Medium (26-50%)</strong>
            <p class="text-sm text-gray-600">Possible to occur within the next year</p>
          </div>
          <div class="border-l-4 border-blue-500 pl-3">
            <strong>2 - Low (6-25%)</strong>
            <p class="text-sm text-gray-600">Unlikely but possible within the next year</p>
          </div>
          <div class="border-l-4 border-green-500 pl-3">
            <strong>1 - Very Low (0-5%)</strong>
            <p class="text-sm text-gray-600">Rare occurrence, unlikely within the next year</p>
          </div>
        </div>
      `
    },
    impact: {
      title: 'Impact Scoring Guide',
      content: `
        <div class="space-y-3">
          <div class="border-l-4 border-red-500 pl-3">
            <strong>5 - Very High (Severe)</strong>
            <p class="text-sm text-gray-600">Critical business disruption, major financial loss, severe reputation damage</p>
          </div>
          <div class="border-l-4 border-orange-500 pl-3">
            <strong>4 - High (Major)</strong>
            <p class="text-sm text-gray-600">Significant business impact, substantial financial loss, notable reputation damage</p>
          </div>
          <div class="border-l-4 border-yellow-500 pl-3">
            <strong>3 - Medium (Moderate)</strong>
            <p class="text-sm text-gray-600">Moderate business disruption, measurable financial impact, some reputation impact</p>
          </div>
          <div class="border-l-4 border-blue-500 pl-3">
            <strong>2 - Low (Minor)</strong>
            <p class="text-sm text-gray-600">Limited business impact, minor financial loss, minimal reputation impact</p>
          </div>
          <div class="border-l-4 border-green-500 pl-3">
            <strong>1 - Very Low (Minimal)</strong>
            <p class="text-sm text-gray-600">Negligible business impact, minimal financial loss, no reputation impact</p>
          </div>
        </div>
      `
    }
  };
  
  const guide = guides[type];
  if (guide) {
    showModal(guide.title, guide.content, [
      { text: 'Close', class: 'btn-secondary', onclick: 'closeUniversalModal()' }
    ]);
  }
}

// Enhanced editRisk function with better error handling
async function editRiskEnhanced(id) {
  console.log('Editing risk with ID:', id);
  
  const risk = moduleData.risks?.find(r => r.id === id);
  if (!risk) {
    showToast('Risk not found', 'error');
    return;
  }
  
  const modal = createModal('Edit Risk', getRiskFormHTML(risk));
  document.body.appendChild(modal);
  
  // Populate dropdowns and form data
  try {
    await populateRiskFormDropdownsSafe();
    
    // Wait for dropdowns to be populated, then populate form
    setTimeout(() => {
      populateRiskFormEnhanced(risk);
      
      // Add event listeners for risk score calculation
      const probabilityField = document.getElementById('risk-probability');
      const impactField = document.getElementById('risk-impact');
      
      if (probabilityField) {
        probabilityField.addEventListener('change', updateRiskScoreCalculation);
      }
      if (impactField) {
        impactField.addEventListener('change', updateRiskScoreCalculation);
      }
      
      // Initial calculation
      updateRiskScoreCalculation();
    }, 500);
    
  } catch (error) {
    console.error('Error populating form:', error);
    showToast('Error loading form data', 'error');
  }
  
  // Handle form submission
  document.getElementById('risk-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleRiskSubmit(id);
  });
}

// Enhanced form population with better error handling
function populateRiskFormEnhanced(risk) {
  console.log('Populating risk form with enhanced data:', risk);
  
  // Safely populate each field with existence check
  const fields = [
    { id: 'risk-title', value: risk.title || '' },
    { id: 'risk-category', value: risk.category_id || '' },
    { id: 'risk-description', value: risk.description || '' },
    { id: 'risk-organization', value: risk.organization_id || '' },
    { id: 'risk-owner', value: risk.owner_id || '' },
    { id: 'risk-probability', value: risk.probability || '' },
    { id: 'risk-impact', value: risk.impact || '' },
    { id: 'risk-threat-source', value: risk.threat_source || '' },
    { id: 'risk-root-cause', value: risk.root_cause || '' },
    { id: 'risk-potential-impact', value: risk.potential_impact || '' },
    { id: 'risk-treatment', value: risk.treatment_strategy || '' },
    { id: 'risk-mitigation', value: risk.mitigation_plan || '' }
  ];
  
  fields.forEach(field => {
    const element = document.getElementById(field.id);
    if (element) {
      element.value = field.value;
      console.log(`✓ Set ${field.id} to:`, field.value);
    } else {
      console.warn(`⚠ Element ${field.id} not found`);
    }
  });
  
  // Handle date fields
  const dateFields = [
    { id: 'risk-identified-date', value: risk.identified_date },
    { id: 'risk-review-date', value: risk.next_review_date }
  ];
  
  dateFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (element && field.value) {
      element.value = field.value.split('T')[0];
      console.log(`✓ Set ${field.id} to:`, element.value);
    }
  });
  
  // Populate services selection
  if (risk.related_services) {
    const servicesSelect = document.getElementById('risk-services');
    if (servicesSelect) {
      const serviceIds = risk.related_services.split(',');
      Array.from(servicesSelect.options).forEach(option => {
        if (serviceIds.includes(option.value)) {
          option.selected = true;
        }
      });
      console.log('✓ Selected services:', serviceIds);
    }
  }
  
  // Update risk score calculation
  updateRiskScoreCalculation();
}

// Override the original editRisk function
if (typeof editRisk !== 'undefined') {
  window.originalEditRisk = editRisk;
}
window.editRisk = editRiskEnhanced;

// Add event listeners when document is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Risk enhancements loaded');
});

// Initialize risk form enhancements when risk form is shown
function initializeRiskFormEnhancements() {
  const probabilityField = document.getElementById('risk-probability');
  const impactField = document.getElementById('risk-impact');
  
  if (probabilityField) {
    probabilityField.addEventListener('change', updateRiskScoreCalculation);
  }
  if (impactField) {
    impactField.addEventListener('change', updateRiskScoreCalculation);
  }
  
  // Initial calculation
  updateRiskScoreCalculation();
}

// Auto-initialize when form elements are available
const checkForRiskForm = () => {
  if (document.getElementById('risk-probability')) {
    initializeRiskFormEnhancements();
  } else {
    setTimeout(checkForRiskForm, 100);
  }
};

// Start checking when any modal opens
const originalCreateModal = window.createModal;
if (originalCreateModal) {
  window.createModal = function(title, content, buttons) {
    const modal = originalCreateModal(title, content, buttons);
    if (title.includes('Risk')) {
      setTimeout(checkForRiskForm, 100);
    }
    return modal;
  };
}
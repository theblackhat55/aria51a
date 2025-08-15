#!/usr/bin/env node

/**
 * Framework Population Script
 * Populates database with ISO 27001 and UAE ISR framework controls
 */

const fs = require('fs');
const path = require('path');

// Read JSON data
const iso27001Data = JSON.parse(fs.readFileSync(path.join(__dirname, 'iso27001.json'), 'utf8'));
const uaeIsrData = JSON.parse(fs.readFileSync(path.join(__dirname, 'uae_isr.json'), 'utf8'));

// Clean and normalize text
function cleanText(text) {
  if (!text) return null;
  return text.toString().trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

// Generate SQL for ISO 27001 controls
function generateISO27001SQL() {
  const controls = [];
  
  iso27001Data.forEach((control, index) => {
    // Skip empty controls
    if (!control.Clause || !control.Control) return;
    
    const clause = cleanText(control.Clause);
    const title = cleanText(control.Control);
    const section = cleanText(control.Section) || 'General';
    const applicable = control.Applicable === 'Yes' ? 1 : 0;
    const legacyRef = cleanText(control['Status in ISO 27001:2013']) || null;
    
    // Determine priority based on section
    let priority = 'medium';
    if (section.includes('Organizational')) priority = 'high';
    if (section.includes('Technological')) priority = 'high';
    
    const sql = `INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      ${escapeSQL(clause)},
      ${escapeSQL(title)},
      ${escapeSQL(section)},
      ${applicable},
      '${priority}',
      ${legacyRef ? escapeSQL(legacyRef) : 'NULL'},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );`;
    
    controls.push(sql);
  });
  
  return controls;
}

// Generate SQL for UAE ISR controls
function generateUAEISRSQL() {
  const controls = [];
  
  uaeIsrData.forEach((control, index) => {
    // Skip empty controls
    if (!control['Control Ref.'] || !control.Control) return;
    
    const controlRef = cleanText(control['Control Ref.']);
    const title = cleanText(control.Control);
    const description = cleanText(control['Control Description']);
    const subControlDesc = cleanText(control['Sub-Control Description']);
    const domainName = cleanText(control['Doman Name']) || cleanText(control['Domain Name']);
    const domainRef = cleanText(control['Domain Ref.']);
    const subdomainName = cleanText(control['Sub-domain Name']);
    const subdomainRef = cleanText(control['Sub-domain Ref.']);
    
    // Determine priority based on domain
    let priority = 'medium';
    if (domainName && (domainName.includes('Strategy') || domainName.includes('Governance'))) {
      priority = 'high';
    }
    if (domainName && domainName.includes('Information Security Incident')) {
      priority = 'critical';
    }
    
    const sql = `INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      ${escapeSQL(controlRef)},
      ${escapeSQL(title)},
      ${description ? escapeSQL(description) : 'NULL'},
      ${domainName ? escapeSQL(domainName) : 'NULL'},
      ${domainRef ? escapeSQL(domainRef) : 'NULL'},
      ${subdomainName ? escapeSQL(subdomainName) : 'NULL'},
      ${subdomainRef ? escapeSQL(subdomainRef) : 'NULL'},
      ${subControlDesc ? escapeSQL(subControlDesc) : 'NULL'},
      1,
      '${priority}',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );`;
    
    controls.push(sql);
  });
  
  return controls;
}

// Escape SQL strings
function escapeSQL(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

// Generate complete SQL file
function generateSQL() {
  const sql = [
    '-- Framework Controls Population Script',
    '-- Generated from ISO 27001 and UAE ISR JSON data',
    '',
    '-- Ensure frameworks exist',
    `INSERT OR IGNORE INTO frameworks (name, code, version, description, effective_date, framework_type) VALUES 
('ISO/IEC 27001:2022', 'ISO27001', '2022', 'Information security management systems - Requirements', '2022-10-01', 'standard'),
('UAE Information Assurance Standard', 'UAE_ISR', '2.0', 'UAE Information Assurance Standard for Information Security Requirements', '2021-01-01', 'regulation');`,
    '',
    '-- ISO 27001:2022 Controls',
    '-- Total controls: ' + iso27001Data.length,
    ...generateISO27001SQL(),
    '',
    '-- UAE Information Assurance Standard Controls', 
    '-- Total controls: ' + uaeIsrData.length,
    ...generateUAEISRSQL(),
    '',
    '-- Update framework statistics',
    `UPDATE frameworks SET 
      updated_at = CURRENT_TIMESTAMP 
    WHERE code IN ('ISO27001', 'UAE_ISR');`,
    ''
  ];
  
  return sql.join('\n');
}

// Write SQL file
const sqlContent = generateSQL();
fs.writeFileSync(path.join(__dirname, 'framework-controls-seed.sql'), sqlContent);

console.log('✅ Framework population SQL generated successfully!');
console.log(`📊 ISO 27001 controls: ${iso27001Data.length}`);
console.log(`📊 UAE ISR controls: ${uaeIsrData.length}`);
console.log('📄 Generated file: framework-controls-seed.sql');
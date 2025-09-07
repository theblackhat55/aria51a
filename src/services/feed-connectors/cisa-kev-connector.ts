/**
 * ARIA5 TI Enhancement - Phase 2.2: CISA KEV Feed Connector
 * 
 * Connector for CISA Known Exploited Vulnerabilities (KEV) catalog.
 * Provides high-confidence vulnerability intelligence for active threats.
 */

import { BaseFeedConnector, FeedConfig, ThreatIndicator } from './base-connector';

interface CISAVulnerability {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse?: string;
  notes?: string;
}

interface CISAKEVCatalog {
  title: string;
  catalogVersion: string;
  dateReleased: string;
  count: number;
  vulnerabilities: CISAVulnerability[];
}

export class CISAKEVConnector extends BaseFeedConnector {
  private readonly feedUrl = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
  
  constructor(config: FeedConfig) {
    super(config);
  }

  protected async fetchRawData(): Promise<CISAKEVCatalog> {
    const response = await this.makeRequest(this.feedUrl);
    return await response.json();
  }

  protected async parseData(rawData: CISAKEVCatalog): Promise<ThreatIndicator[]> {
    const indicators: ThreatIndicator[] = [];
    
    if (!rawData.vulnerabilities) {
      return indicators;
    }

    for (const vuln of rawData.vulnerabilities) {
      const indicator = this.convertCISAVulnerability(vuln);
      if (indicator) {
        indicators.push(indicator);
      }
    }

    return indicators;
  }

  private convertCISAVulnerability(vuln: CISAVulnerability): ThreatIndicator {
    const confidence = this.calculateConfidence(vuln);
    const severity = this.calculateSeverity(vuln);
    const tags = this.generateTags(vuln);

    return {
      id: `cisa_kev_${vuln.cveID}`,
      type: 'cve',
      value: vuln.cveID,
      confidence,
      severity,
      first_seen: vuln.dateAdded,
      last_seen: vuln.dateAdded,
      tags,
      context: {
        attack_pattern: 'Known Exploitation',
        kill_chain_phase: 'exploitation',
        mitre_technique: 'T1190' // Exploit Public-Facing Application
      },
      source_confidence: 0.95, // CISA is highly reliable
      source_reliability: 'A', // Official government source
      tlp_marking: 'WHITE', // Public information
      raw_data: vuln
    };
  }

  private calculateConfidence(vuln: CISAVulnerability): number {
    let confidence = 85; // Base confidence for CISA KEV (high)
    
    // Increase confidence for ransomware usage
    if (vuln.knownRansomwareCampaignUse === 'Known') {
      confidence += 10;
    }
    
    // Recent additions get higher confidence
    const addedDate = new Date(vuln.dateAdded);
    const daysSinceAdded = (Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAdded <= 30) {
      confidence += 5;
    }
    
    return Math.min(100, confidence);
  }

  private calculateSeverity(vuln: CISAVulnerability): 'low' | 'medium' | 'high' | 'critical' {
    // CISA KEV vulnerabilities are actively exploited, so default to high
    if (vuln.knownRansomwareCampaignUse === 'Known') {
      return 'critical';
    }
    
    // Check if it's a recent addition (higher threat)
    const addedDate = new Date(vuln.dateAdded);
    const daysSinceAdded = (Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceAdded <= 7) {
      return 'critical';
    } else if (daysSinceAdded <= 30) {
      return 'high';
    }
    
    return 'high'; // Default for KEV
  }

  private generateTags(vuln: CISAVulnerability): string[] {
    const tags = [
      'cisa-kev',
      'known-exploited',
      'vulnerability',
      vuln.vendorProject.toLowerCase(),
      vuln.product.toLowerCase()
    ];

    if (vuln.knownRansomwareCampaignUse === 'Known') {
      tags.push('ransomware', 'active-campaign');
    }

    // Add date-based tags
    const addedDate = new Date(vuln.dateAdded);
    const year = addedDate.getFullYear();
    tags.push(`kev-${year}`);

    // Add urgency tags based on due date
    const dueDate = new Date(vuln.dueDate);
    const daysUntilDue = (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    
    if (daysUntilDue <= 0) {
      tags.push('overdue');
    } else if (daysUntilDue <= 7) {
      tags.push('urgent');
    } else if (daysUntilDue <= 14) {
      tags.push('high-priority');
    }

    return tags.filter(tag => tag.length > 0);
  }
}

export default CISAKEVConnector;
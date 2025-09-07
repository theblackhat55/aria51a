/**
 * ARIA5 TI Enhancement - Phase 2.2: AlienVault OTX Feed Connector
 * 
 * Connector for AlienVault Open Threat Exchange (OTX) threat intelligence feed.
 * Fetches IOCs, pulses, and threat intelligence from OTX's public API.
 */

import { BaseFeedConnector, FeedConfig, ThreatIndicator } from './base-connector';

interface OTXPulse {
  id: string;
  name: string;
  description: string;
  author_name: string;
  created: string;
  modified: string;
  tlp: string;
  tags: string[];
  indicators: OTXIndicator[];
  malware_families: string[];
  attack_ids: string[];
  adversary?: string;
}

interface OTXIndicator {
  id: number;
  indicator: string;
  type: string;
  title?: string;
  description?: string;
  created?: string;
  is_active?: number;
}

export class OTXConnector extends BaseFeedConnector {
  private readonly baseUrl = 'https://otx.alienvault.com/api/v1';
  
  constructor(config: FeedConfig) {
    super(config);
  }

  protected async fetchRawData(): Promise<any> {
    const url = `${this.baseUrl}/pulses/subscribed?limit=50&page=1`;
    const response = await this.makeRequest(url);
    return await response.json();
  }

  protected async parseData(rawData: any): Promise<ThreatIndicator[]> {
    const indicators: ThreatIndicator[] = [];
    
    if (!rawData.results) {
      return indicators;
    }

    for (const pulse of rawData.results) {
      if (!pulse.indicators) continue;

      for (const otxIndicator of pulse.indicators) {
        const indicator = this.convertOTXIndicator(otxIndicator, pulse);
        if (indicator) {
          indicators.push(indicator);
        }
      }
    }

    return indicators;
  }

  private convertOTXIndicator(otxIndicator: OTXIndicator, pulse: OTXPulse): ThreatIndicator | null {
    const typeMapping: Record<string, string> = {
      'IPv4': 'ip',
      'IPv6': 'ip', 
      'domain': 'domain',
      'hostname': 'domain',
      'URL': 'url',
      'URI': 'url',
      'FileHash-MD5': 'hash',
      'FileHash-SHA1': 'hash',
      'FileHash-SHA256': 'hash',
      'email': 'email'
    };

    const mappedType = typeMapping[otxIndicator.type];
    if (!mappedType) {
      return null;
    }

    const confidence = this.calculateConfidence(pulse, otxIndicator);
    const severity = this.calculateSeverity(pulse, confidence);

    return {
      id: `otx_${otxIndicator.id}`,
      type: mappedType as any,
      value: otxIndicator.indicator,
      confidence,
      severity,
      first_seen: otxIndicator.created || pulse.created,
      last_seen: pulse.modified,
      tags: [...pulse.tags, ...pulse.malware_families, ...(pulse.attack_ids || [])],
      context: {
        threat_actor: pulse.adversary,
        campaign: pulse.name,
        malware_family: pulse.malware_families?.join(', '),
        attack_pattern: pulse.attack_ids?.join(', ')
      },
      source_confidence: confidence / 100,
      source_reliability: this.calculateReliability(pulse),
      tlp_marking: this.mapTLPMarking(pulse.tlp),
      raw_data: { pulse, indicator: otxIndicator }
    };
  }

  private calculateConfidence(pulse: OTXPulse, indicator: OTXIndicator): number {
    let confidence = 50; // Base confidence
    
    // Increase confidence based on pulse quality
    if (pulse.malware_families?.length > 0) confidence += 15;
    if (pulse.attack_ids?.length > 0) confidence += 15;
    if (pulse.adversary) confidence += 10;
    if (indicator.is_active) confidence += 10;
    
    return Math.min(100, confidence);
  }

  private calculateSeverity(pulse: OTXPulse, confidence: number): 'low' | 'medium' | 'high' | 'critical' {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  }

  private calculateReliability(pulse: OTXPulse): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' {
    // OTX is generally reliable but varies by author
    if (pulse.adversary && pulse.malware_families?.length > 0) return 'B';
    if (pulse.tags?.length >= 3) return 'C';
    return 'D';
  }

  private mapTLPMarking(tlp: string): 'WHITE' | 'GREEN' | 'AMBER' | 'RED' {
    const tlpLower = tlp?.toLowerCase() || 'white';
    if (tlpLower.includes('red')) return 'RED';
    if (tlpLower.includes('amber')) return 'AMBER';
    if (tlpLower.includes('green')) return 'GREEN';
    return 'WHITE';
  }
}

export default OTXConnector;
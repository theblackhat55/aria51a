/**
 * ARIA5 TI Enhancement - Phase 2.1: STIX/TAXII Feed Connector
 * 
 * Implements STIX (Structured Threat Information eXpression) and TAXII (Trusted Automated eXchange of Intelligence Information)
 * standard for threat intelligence data exchange.
 * 
 * Supports TAXII 2.0/2.1 and STIX 2.0/2.1 formats
 */

import { BaseFeedConnector, FeedConfig, ThreatIndicator } from './base-connector';

export interface STIXBundle {
  type: 'bundle';
  id: string;
  objects: STIXDomainObject[];
  spec_version: string;
}

export interface STIXDomainObject {
  type: string;
  id: string;
  created: string;
  modified: string;
  spec_version?: string;
  [key: string]: any;
}

export interface STIXIndicator extends STIXDomainObject {
  type: 'indicator';
  labels: string[];
  pattern: string;
  valid_from: string;
  valid_until?: string;
  kill_chain_phases?: Array<{
    kill_chain_name: string;
    phase_name: string;
  }>;
}

export interface STIXMalware extends STIXDomainObject {
  type: 'malware';
  name: string;
  labels: string[];
  is_family?: boolean;
}

export interface STIXIntrusionSet extends STIXDomainObject {
  type: 'intrusion-set';
  name: string;
  aliases?: string[];
  goals?: string[];
}

export interface TAXIICollectionConfig extends FeedConfig {
  taxii_version: '2.0' | '2.1';
  discovery_url: string;
  collection_id?: string;
  collection_name?: string;
  stix_version: '2.0' | '2.1';
  added_after?: string; // ISO timestamp for incremental updates
}

export class STIXTAXIIConnector extends BaseFeedConnector {
  private taxiiConfig: TAXIICollectionConfig;
  private apiRoot?: string;
  private collections?: any[];

  constructor(config: TAXIICollectionConfig) {
    super(config);
    this.taxiiConfig = config;
  }

  /**
   * Fetch raw STIX data from TAXII server
   */
  protected async fetchRawData(): Promise<STIXBundle> {
    try {
      // Step 1: Discover TAXII server capabilities
      await this.discoverTAXIIServer();

      // Step 2: Get available collections
      await this.getCollections();

      // Step 3: Fetch STIX objects from specified collection
      const stixData = await this.fetchSTIXObjects();

      return stixData;

    } catch (error) {
      throw new Error(`STIX/TAXII fetch failed: ${error.message}`);
    }
  }

  /**
   * Parse STIX bundle into normalized threat indicators
   */
  protected async parseData(rawData: STIXBundle): Promise<ThreatIndicator[]> {
    const indicators: ThreatIndicator[] = [];

    try {
      console.log(`Parsing STIX bundle with ${rawData.objects.length} objects`);

      // Build context maps for enrichment
      const malwareMap = this.buildMalwareMap(rawData.objects);
      const intrusionSetMap = this.buildIntrusionSetMap(rawData.objects);
      const relationshipMap = this.buildRelationshipMap(rawData.objects);

      // Process STIX Indicators
      for (const obj of rawData.objects) {
        if (obj.type === 'indicator') {
          const stixIndicator = obj as STIXIndicator;
          const parsedIndicators = await this.parseSTIXIndicator(
            stixIndicator, 
            malwareMap, 
            intrusionSetMap, 
            relationshipMap
          );
          indicators.push(...parsedIndicators);
        }
      }

      console.log(`Parsed ${indicators.length} indicators from STIX bundle`);
      return indicators;

    } catch (error) {
      throw new Error(`STIX parsing failed: ${error.message}`);
    }
  }

  /**
   * Discover TAXII server capabilities
   */
  private async discoverTAXIIServer(): Promise<void> {
    try {
      console.log(`Discovering TAXII server at ${this.taxiiConfig.discovery_url}`);
      
      const response = await this.makeRequest(this.taxiiConfig.discovery_url, {
        headers: {
          'Accept': 'application/taxii+json;version=2.1',
          'Content-Type': 'application/taxii+json;version=2.1'
        }
      });

      const discovery = await response.json();
      
      if (!discovery.api_roots || discovery.api_roots.length === 0) {
        throw new Error('No API roots found in TAXII discovery response');
      }

      // Use first API root if not specified
      this.apiRoot = discovery.api_roots[0];
      console.log(`Using TAXII API root: ${this.apiRoot}`);

    } catch (error) {
      throw new Error(`TAXII discovery failed: ${error.message}`);
    }
  }

  /**
   * Get available collections from TAXII server
   */
  private async getCollections(): Promise<void> {
    if (!this.apiRoot) {
      throw new Error('API root not discovered');
    }

    try {
      const collectionsUrl = `${this.apiRoot}collections/`;
      console.log(`Fetching collections from ${collectionsUrl}`);

      const response = await this.makeRequest(collectionsUrl, {
        headers: {
          'Accept': 'application/taxii+json;version=2.1'
        }
      });

      const collectionsData = await response.json();
      this.collections = collectionsData.collections || [];

      console.log(`Found ${this.collections.length} collections`);

      // Find target collection
      if (this.taxiiConfig.collection_id) {
        const targetCollection = this.collections.find(c => c.id === this.taxiiConfig.collection_id);
        if (!targetCollection) {
          throw new Error(`Collection ${this.taxiiConfig.collection_id} not found`);
        }
      } else if (this.taxiiConfig.collection_name) {
        const targetCollection = this.collections.find(c => c.title === this.taxiiConfig.collection_name);
        if (!targetCollection) {
          throw new Error(`Collection "${this.taxiiConfig.collection_name}" not found`);
        }
        this.taxiiConfig.collection_id = targetCollection.id;
      } else {
        // Use first available collection
        if (this.collections.length > 0) {
          this.taxiiConfig.collection_id = this.collections[0].id;
          console.log(`Using first available collection: ${this.collections[0].title}`);
        } else {
          throw new Error('No collections available');
        }
      }

    } catch (error) {
      throw new Error(`Failed to get collections: ${error.message}`);
    }
  }

  /**
   * Fetch STIX objects from collection
   */
  private async fetchSTIXObjects(): Promise<STIXBundle> {
    if (!this.apiRoot || !this.taxiiConfig.collection_id) {
      throw new Error('API root or collection ID not available');
    }

    try {
      let objectsUrl = `${this.apiRoot}collections/${this.taxiiConfig.collection_id}/objects/`;
      
      // Add query parameters for incremental updates
      const params = new URLSearchParams();
      
      if (this.taxiiConfig.added_after) {
        params.append('added_after', this.taxiiConfig.added_after);
      }

      // Limit the number of objects to avoid overwhelming the system
      params.append('limit', '1000');

      if (params.toString()) {
        objectsUrl += '?' + params.toString();
      }

      console.log(`Fetching STIX objects from ${objectsUrl}`);

      const response = await this.makeRequest(objectsUrl, {
        headers: {
          'Accept': 'application/taxii+json;version=2.1'
        }
      });

      const objectsData = await response.json();

      // Handle both envelope and bundle formats
      let bundle: STIXBundle;
      
      if (objectsData.objects) {
        // TAXII envelope format
        bundle = {
          type: 'bundle',
          id: `bundle--${crypto.randomUUID()}`,
          objects: objectsData.objects,
          spec_version: this.taxiiConfig.stix_version
        };
      } else if (objectsData.type === 'bundle') {
        // Direct STIX bundle
        bundle = objectsData;
      } else {
        throw new Error('Unexpected response format from TAXII server');
      }

      console.log(`Fetched ${bundle.objects.length} STIX objects`);
      return bundle;

    } catch (error) {
      throw new Error(`Failed to fetch STIX objects: ${error.message}`);
    }
  }

  /**
   * Parse a single STIX indicator into threat indicators
   */
  private async parseSTIXIndicator(
    stixIndicator: STIXIndicator,
    malwareMap: Map<string, STIXMalware>,
    intrusionSetMap: Map<string, STIXIntrusionSet>,
    relationshipMap: Map<string, any[]>
  ): Promise<ThreatIndicator[]> {
    const indicators: ThreatIndicator[] = [];

    try {
      // Parse STIX pattern to extract observable values
      const observables = this.parseSTIXPattern(stixIndicator.pattern);

      for (const observable of observables) {
        // Get enrichment context from relationships
        const context = await this.getIndicatorContext(
          stixIndicator.id,
          malwareMap,
          intrusionSetMap,
          relationshipMap
        );

        const indicator: ThreatIndicator = {
          id: this.generateSTIXIndicatorId(stixIndicator.id, observable.value),
          type: observable.type,
          value: observable.value,
          confidence: this.mapSTIXConfidence(stixIndicator.confidence || 50),
          severity: this.mapSTIXSeverity(stixIndicator.labels),
          first_seen: stixIndicator.valid_from,
          last_seen: stixIndicator.modified,
          tags: [...stixIndicator.labels, ...(context.tags || [])],
          context: {
            malware_family: context.malware_family,
            threat_actor: context.threat_actor,
            campaign: context.campaign,
            attack_pattern: context.attack_pattern,
            kill_chain_phase: this.getKillChainPhase(stixIndicator.kill_chain_phases),
            mitre_technique: context.mitre_technique
          },
          source_confidence: this.mapSTIXConfidence(stixIndicator.confidence || 50) / 100,
          source_reliability: this.mapSourceReliability(this.config.name),
          tlp_marking: this.extractTLPMarking(stixIndicator),
          raw_data: stixIndicator
        };

        indicators.push(indicator);
      }

    } catch (error) {
      console.warn(`Failed to parse STIX indicator ${stixIndicator.id}:`, error);
    }

    return indicators;
  }

  /**
   * Parse STIX pattern to extract observables
   */
  private parseSTIXPattern(pattern: string): Array<{ type: string; value: string }> {
    const observables: Array<{ type: string; value: string }> = [];

    try {
      // Remove brackets and split by AND/OR
      const cleanPattern = pattern.replace(/[\[\]]/g, '');
      const expressions = cleanPattern.split(/\s+(AND|OR)\s+/);

      for (const expr of expressions) {
        if (expr === 'AND' || expr === 'OR') continue;

        // Parse different STIX cyber observable types
        const patterns = [
          // IPv4 Address
          /file:hashes\.MD5\s*=\s*'([^']+)'/,
          /file:hashes\.SHA-1\s*=\s*'([^']+)'/,
          /file:hashes\.SHA-256\s*=\s*'([^']+)'/,
          // Domain
          /domain-name:value\s*=\s*'([^']+)'/,
          // URL  
          /url:value\s*=\s*'([^']+)'/,
          // IPv4
          /ipv4-addr:value\s*=\s*'([^']+)'/,
          // IPv6
          /ipv6-addr:value\s*=\s*'([^']+)'/,
          // Email
          /email-message:sender_ref\.value\s*=\s*'([^']+)'/,
          /email-addr:value\s*=\s*'([^']+)'/,
          // File path
          /file:name\s*=\s*'([^']+)'/
        ];

        const typeMapping = [
          'hash', 'hash', 'hash', 'domain', 'url', 'ip', 'ip', 'email', 'email', 'file_path'
        ];

        for (let i = 0; i < patterns.length; i++) {
          const match = expr.match(patterns[i]);
          if (match) {
            observables.push({
              type: typeMapping[i],
              value: match[1]
            });
            break;
          }
        }
      }

    } catch (error) {
      console.warn(`Failed to parse STIX pattern: ${pattern}`, error);
    }

    return observables;
  }

  /**
   * Build malware context map from STIX objects
   */
  private buildMalwareMap(objects: STIXDomainObject[]): Map<string, STIXMalware> {
    const malwareMap = new Map<string, STIXMalware>();
    
    objects
      .filter(obj => obj.type === 'malware')
      .forEach(obj => {
        malwareMap.set(obj.id, obj as STIXMalware);
      });

    return malwareMap;
  }

  /**
   * Build intrusion set (threat actor) context map
   */
  private buildIntrusionSetMap(objects: STIXDomainObject[]): Map<string, STIXIntrusionSet> {
    const intrusionSetMap = new Map<string, STIXIntrusionSet>();
    
    objects
      .filter(obj => obj.type === 'intrusion-set')
      .forEach(obj => {
        intrusionSetMap.set(obj.id, obj as STIXIntrusionSet);
      });

    return intrusionSetMap;
  }

  /**
   * Build relationship map for context enrichment
   */
  private buildRelationshipMap(objects: STIXDomainObject[]): Map<string, any[]> {
    const relationshipMap = new Map<string, any[]>();
    
    objects
      .filter(obj => obj.type === 'relationship')
      .forEach(relationship => {
        const sourceId = relationship.source_ref;
        if (!relationshipMap.has(sourceId)) {
          relationshipMap.set(sourceId, []);
        }
        relationshipMap.get(sourceId)!.push(relationship);
      });

    return relationshipMap;
  }

  /**
   * Get enrichment context for an indicator
   */
  private async getIndicatorContext(
    indicatorId: string,
    malwareMap: Map<string, STIXMalware>,
    intrusionSetMap: Map<string, STIXIntrusionSet>,
    relationshipMap: Map<string, any[]>
  ): Promise<any> {
    const context: any = {
      tags: []
    };

    const relationships = relationshipMap.get(indicatorId) || [];

    for (const rel of relationships) {
      const targetId = rel.target_ref;
      const relationType = rel.relationship_type;

      // Check if target is malware
      if (malwareMap.has(targetId)) {
        const malware = malwareMap.get(targetId)!;
        if (relationType === 'indicates' || relationType === 'related-to') {
          context.malware_family = malware.name;
          context.tags.push(`malware:${malware.name}`);
        }
      }

      // Check if target is intrusion set (threat actor)
      if (intrusionSetMap.has(targetId)) {
        const intrusionSet = intrusionSetMap.get(targetId)!;
        if (relationType === 'indicates' || relationType === 'attributed-to') {
          context.threat_actor = intrusionSet.name;
          context.tags.push(`actor:${intrusionSet.name}`);
        }
      }
    }

    return context;
  }

  // Mapping and utility methods

  private mapSTIXConfidence(confidence?: number): number {
    if (typeof confidence === 'number') {
      return Math.min(Math.max(confidence, 0), 100);
    }
    return 50; // Default confidence
  }

  private mapSTIXSeverity(labels: string[]): 'low' | 'medium' | 'high' | 'critical' {
    const severityLabels = {
      'malicious-activity': 'high',
      'suspicious-activity': 'medium',
      'benign': 'low',
      'attribution': 'medium'
    };

    for (const label of labels) {
      if (severityLabels[label]) {
        return severityLabels[label] as any;
      }
    }

    return 'medium'; // Default severity
  }

  private mapSourceReliability(sourceName: string): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' {
    // Map source reliability based on source reputation
    const reliabilityMap = {
      'misp': 'B',
      'opencti': 'B', 
      'anomali': 'A',
      'threatconnect': 'A',
      'crowdstrike': 'A',
      'default': 'C'
    };

    const lowerName = sourceName.toLowerCase();
    for (const [key, value] of Object.entries(reliabilityMap)) {
      if (lowerName.includes(key)) {
        return value as any;
      }
    }

    return 'C'; // Default reliability
  }

  private getKillChainPhase(killChainPhases?: Array<{ kill_chain_name: string; phase_name: string }>): string | undefined {
    if (!killChainPhases || killChainPhases.length === 0) {
      return undefined;
    }

    // Prefer MITRE ATT&CK kill chain
    const mitrePhase = killChainPhases.find(phase => 
      phase.kill_chain_name === 'mitre-attack' || phase.kill_chain_name === 'kill-chain'
    );

    return mitrePhase?.phase_name || killChainPhases[0].phase_name;
  }

  private extractTLPMarking(stixObject: STIXDomainObject): 'WHITE' | 'GREEN' | 'AMBER' | 'RED' | undefined {
    const markings = stixObject.object_marking_refs || [];
    
    for (const marking of markings) {
      if (typeof marking === 'string') {
        if (marking.includes('white')) return 'WHITE';
        if (marking.includes('green')) return 'GREEN';
        if (marking.includes('amber')) return 'AMBER';
        if (marking.includes('red')) return 'RED';
      }
    }

    return undefined;
  }

  private generateSTIXIndicatorId(stixId: string, observableValue: string): string {
    const hash = this.simpleHash(stixId + observableValue);
    return `stix_${hash}`;
  }
}

/**
 * Factory function for creating STIX/TAXII connector
 */
export function createSTIXTAXIIConnector(config: TAXIICollectionConfig): STIXTAXIIConnector {
  return new STIXTAXIIConnector(config);
}

// Default export for easier importing
export default STIXTAXIIConnector;
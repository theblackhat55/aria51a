/**
 * ARIA5 TI Enhancement - Phase 2.2: NVD (National Vulnerability Database) Feed Connector
 * 
 * Connector for NIST National Vulnerability Database (NVD) CVE feed.
 * Fetches CVE data, vulnerability details, CVSS scores, and weakness information.
 * 
 * API Documentation: https://nvd.nist.gov/developers/vulnerabilities
 */

import { BaseFeedConnector, FeedConfig, ThreatIndicator, ConnectorResult, FeedData } from './base-connector';

interface NVDCVEResponse {
  resultsPerPage: number;
  startIndex: number;
  totalResults: number;
  format: string;
  version: string;
  timestamp: string;
  vulnerabilities: NVDVulnerability[];
}

interface NVDVulnerability {
  cve: {
    id: string;
    sourceIdentifier: string;
    published: string;
    lastModified: string;
    vulnStatus: string;
    descriptions: Array<{
      lang: string;
      value: string;
    }>;
    metrics?: {
      cvssMetricV31?: Array<{
        source: string;
        type: string;
        cvssData: {
          version: string;
          vectorString: string;
          attackVector: string;
          attackComplexity: string;
          privilegesRequired: string;
          userInteraction: string;
          scope: string;
          confidentialityImpact: string;
          integrityImpact: string;
          availabilityImpact: string;
          baseScore: number;
          baseSeverity: string;
        };
        exploitabilityScore: number;
        impactScore: number;
      }>;
      cvssMetricV30?: Array<any>;
      cvssMetricV2?: Array<any>;
    };
    weaknesses?: Array<{
      source: string;
      type: string;
      description: Array<{
        lang: string;
        value: string;
      }>;
    }>;
    configurations?: Array<{
      nodes: Array<{
        operator: string;
        negate: boolean;
        cpeMatch: Array<{
          vulnerable: boolean;
          criteria: string;
          matchCriteriaId: string;
          versionEndExcluding?: string;
          versionEndIncluding?: string;
          versionStartExcluding?: string;
          versionStartIncluding?: string;
        }>;
      }>;
    }>;
    references?: Array<{
      url: string;
      source: string;
      tags?: string[];
    }>;
    vendorComments?: Array<{
      organization: string;
      comment: string;
      lastModified: string;
    }>;
  };
}

interface CVSSMetrics {
  version: string;
  baseScore: number;
  baseSeverity: string;
  vectorString: string;
  attackVector: string;
  attackComplexity: string;
  privilegesRequired: string;
  userInteraction: string;
  scope: string;
  confidentialityImpact: string;
  integrityImpact: string;
  availabilityImpact: string;
  exploitabilityScore?: number;
  impactScore?: number;
}

export class NVDConnector extends BaseFeedConnector {
  private readonly baseUrl = 'https://services.nvd.nist.gov/rest/json';
  private readonly apiVersion = '2.0';
  private readonly requestsPerSecond = 5; // NVD rate limit without API key
  private readonly requestsPerSecondWithKey = 50; // With API key
  private readonly maxResultsPerRequest = 2000;

  constructor(config: FeedConfig) {
    super(config);
  }

  /**
   * Fetch recent CVE data from NVD
   */
  protected async fetchRawData(): Promise<FeedData> {
    const indicators: ThreatIndicator[] = [];
    let totalFetched = 0;
    let newCount = 0;

    try {
      // Determine time window for fetching
      const { startDate, endDate } = this.getTimeWindow();
      
      console.log(`[NVD] Fetching CVEs from ${startDate} to ${endDate}`);

      // Fetch recently published CVEs
      const publishedCVEs = await this.fetchCVEsByTimeWindow(startDate, endDate, 'published');
      const publishedIndicators = publishedCVEs.map(cve => this.convertToThreatIndicator(cve));
      indicators.push(...publishedIndicators.filter(Boolean));

      // Fetch recently modified CVEs (updates to existing ones)
      const modifiedCVEs = await this.fetchCVEsByTimeWindow(startDate, endDate, 'modified');
      const modifiedIndicators = modifiedCVEs.map(cve => this.convertToThreatIndicator(cve));
      indicators.push(...modifiedIndicators.filter(Boolean));

      // Remove duplicates based on CVE ID
      const uniqueIndicators = this.deduplicateIndicators(indicators);
      totalFetched = uniqueIndicators.length;
      newCount = uniqueIndicators.filter(i => this.isNewIndicator(i)).length;

      console.log(`[NVD] Processed ${totalFetched} unique CVEs (${newCount} new)`);

      return {
        indicators: uniqueIndicators,
        metadata: {
          source: 'NIST NVD',
          fetch_time: new Date().toISOString(),
          total_count: totalFetched,
          new_count: newCount,
          updated_count: totalFetched - newCount,
          version: this.apiVersion,
          next_update: this.calculateNextUpdate().toISOString()
        }
      };

    } catch (error) {
      console.error('[NVD] Error fetching data:', error);
      throw new Error(`Failed to fetch NVD data: ${error.message}`);
    }
  }

  /**
   * Fetch CVEs by time window and type (published or modified)
   */
  private async fetchCVEsByTimeWindow(
    startDate: string, 
    endDate: string, 
    timeType: 'published' | 'modified'
  ): Promise<NVDVulnerability[]> {
    const allCVEs: NVDVulnerability[] = [];
    let startIndex = 0;
    const resultsPerPage = this.maxResultsPerRequest;

    try {
      while (true) {
        const params = new URLSearchParams({
          'resultsPerPage': resultsPerPage.toString(),
          'startIndex': startIndex.toString()
        });

        // Add time filter
        if (timeType === 'published') {
          params.append('pubStartDate', startDate);
          params.append('pubEndDate', endDate);
        } else {
          params.append('lastModStartDate', startDate);
          params.append('lastModEndDate', endDate);
        }

        // Add API key if available for higher rate limits
        if (this.config.api_key) {
          params.append('apiKey', this.config.api_key);
        }

        const url = `${this.baseUrl}/cves/${this.apiVersion}?${params}`;
        console.log(`[NVD] Fetching ${timeType} CVEs: ${url.replace(/apiKey=[^&]*/, 'apiKey=***')}`);

        const response = await this.makeRequest(url);
        const data: NVDCVEResponse = await response.json();

        allCVEs.push(...data.vulnerabilities);

        console.log(`[NVD] Fetched ${data.vulnerabilities.length} CVEs (${startIndex + 1}-${startIndex + data.vulnerabilities.length} of ${data.totalResults})`);

        // Check if we have more results
        if (startIndex + resultsPerPage >= data.totalResults) {
          break;
        }

        startIndex += resultsPerPage;

        // Rate limiting
        await this.rateLimitDelay();
      }

    } catch (error) {
      console.error(`[NVD] Error fetching ${timeType} CVEs:`, error);
      throw error;
    }

    return allCVEs;
  }

  /**
   * Convert NVD vulnerability to standardized ThreatIndicator format
   */
  private convertToThreatIndicator(nvdVuln: NVDVulnerability): ThreatIndicator | null {
    try {
      const cve = nvdVuln.cve;
      const description = cve.descriptions?.find(d => d.lang === 'en')?.value || 'No description available';
      
      // Extract CVSS metrics (prefer v3.1, fallback to v3.0, then v2)
      const cvssMetrics = this.extractCVSSMetrics(cve.metrics);
      const severity = this.mapCVSSSeverityToThreatSeverity(cvssMetrics?.baseSeverity);
      
      // Extract weaknesses (CWE)
      const weaknesses = this.extractWeaknesses(cve.weaknesses);
      
      // Extract affected products/configurations
      const affectedProducts = this.extractAffectedProducts(cve.configurations);
      
      // Calculate confidence based on data completeness
      const confidence = this.calculateConfidence(cve, cvssMetrics);

      return {
        id: `nvd-${cve.id}`,
        type: 'cve',
        value: cve.id,
        confidence,
        severity,
        first_seen: cve.published,
        last_seen: cve.lastModified,
        tags: [
          'nvd',
          'cve',
          `status:${cve.vulnStatus}`,
          `cvss:${cvssMetrics?.baseScore || 'unknown'}`,
          ...weaknesses.map(w => `cwe:${w}`),
          ...affectedProducts.slice(0, 5).map(p => `product:${p}`), // Limit to 5 products
          ...(cvssMetrics ? [`attack-vector:${cvssMetrics.attackVector?.toLowerCase()}`] : [])
        ],
        context: {
          attack_pattern: weaknesses.join(', '),
          kill_chain_phase: this.mapCVSSToKillChain(cvssMetrics),
          mitre_technique: this.mapWeaknessesToMitre(weaknesses)
        },
        source_confidence: confidence / 100,
        source_reliability: 'A', // NIST NVD is authoritative source
        tlp_marking: 'WHITE', // NVD data is public
        raw_data: {
          cve: cve,
          cvss_metrics: cvssMetrics,
          weaknesses: weaknesses,
          affected_products: affectedProducts,
          references: cve.references?.map(ref => ref.url) || []
        }
      };
    } catch (error) {
      console.error(`[NVD] Error converting CVE ${nvdVuln.cve.id}:`, error);
      return null;
    }
  }

  /**
   * Extract CVSS metrics from NVD vulnerability data
   */
  private extractCVSSMetrics(metrics?: any): CVSSMetrics | null {
    if (!metrics) return null;

    // Prefer CVSS v3.1
    if (metrics.cvssMetricV31 && metrics.cvssMetricV31.length > 0) {
      const cvss = metrics.cvssMetricV31[0];
      return {
        version: '3.1',
        baseScore: cvss.cvssData.baseScore,
        baseSeverity: cvss.cvssData.baseSeverity,
        vectorString: cvss.cvssData.vectorString,
        attackVector: cvss.cvssData.attackVector,
        attackComplexity: cvss.cvssData.attackComplexity,
        privilegesRequired: cvss.cvssData.privilegesRequired,
        userInteraction: cvss.cvssData.userInteraction,
        scope: cvss.cvssData.scope,
        confidentialityImpact: cvss.cvssData.confidentialityImpact,
        integrityImpact: cvss.cvssData.integrityImpact,
        availabilityImpact: cvss.cvssData.availabilityImpact,
        exploitabilityScore: cvss.exploitabilityScore,
        impactScore: cvss.impactScore
      };
    }

    // Fallback to CVSS v3.0
    if (metrics.cvssMetricV30 && metrics.cvssMetricV30.length > 0) {
      const cvss = metrics.cvssMetricV30[0];
      return {
        version: '3.0',
        baseScore: cvss.cvssData.baseScore,
        baseSeverity: cvss.cvssData.baseSeverity,
        vectorString: cvss.cvssData.vectorString,
        attackVector: cvss.cvssData.attackVector,
        attackComplexity: cvss.cvssData.attackComplexity,
        privilegesRequired: cvss.cvssData.privilegesRequired,
        userInteraction: cvss.cvssData.userInteraction,
        scope: cvss.cvssData.scope,
        confidentialityImpact: cvss.cvssData.confidentialityImpact,
        integrityImpact: cvss.cvssData.integrityImpact,
        availabilityImpact: cvss.cvssData.availabilityImpact,
        exploitabilityScore: cvss.exploitabilityScore,
        impactScore: cvss.impactScore
      };
    }

    // Fallback to CVSS v2
    if (metrics.cvssMetricV2 && metrics.cvssMetricV2.length > 0) {
      const cvss = metrics.cvssMetricV2[0];
      return {
        version: '2.0',
        baseScore: cvss.cvssData.baseScore,
        baseSeverity: cvss.baseSeverity || this.mapCVSSv2Severity(cvss.cvssData.baseScore),
        vectorString: cvss.cvssData.vectorString,
        attackVector: cvss.cvssData.accessVector,
        attackComplexity: cvss.cvssData.accessComplexity,
        privilegesRequired: 'NONE', // Not applicable to v2
        userInteraction: 'NONE', // Not applicable to v2
        scope: 'UNCHANGED', // Not applicable to v2
        confidentialityImpact: cvss.cvssData.confidentialityImpact,
        integrityImpact: cvss.cvssData.integrityImpact,
        availabilityImpact: cvss.cvssData.availabilityImpact,
        exploitabilityScore: cvss.exploitabilityScore,
        impactScore: cvss.impactScore
      };
    }

    return null;
  }

  /**
   * Extract CWE weakness identifiers
   */
  private extractWeaknesses(weaknesses?: any[]): string[] {
    if (!weaknesses) return [];

    const cweList: string[] = [];
    for (const weakness of weaknesses) {
      for (const desc of weakness.description || []) {
        if (desc.lang === 'en' && desc.value.startsWith('CWE-')) {
          cweList.push(desc.value);
        }
      }
    }
    return [...new Set(cweList)]; // Remove duplicates
  }

  /**
   * Extract affected products from CPE configurations
   */
  private extractAffectedProducts(configurations?: any[]): string[] {
    if (!configurations) return [];

    const products: string[] = [];
    for (const config of configurations) {
      for (const node of config.nodes || []) {
        for (const cpeMatch of node.cpeMatch || []) {
          if (cpeMatch.vulnerable && cpeMatch.criteria) {
            // Parse CPE URI to extract vendor and product
            const cpeComponents = cpeMatch.criteria.split(':');
            if (cpeComponents.length >= 5) {
              const vendor = cpeComponents[3];
              const product = cpeComponents[4];
              if (vendor && product) {
                products.push(`${vendor}:${product}`);
              }
            }
          }
        }
      }
    }
    return [...new Set(products)]; // Remove duplicates
  }

  /**
   * Calculate confidence based on data completeness and quality
   */
  private calculateConfidence(cve: any, cvssMetrics: CVSSMetrics | null): number {
    let confidence = 80; // Base confidence for NIST data

    // CVSS availability increases confidence
    if (cvssMetrics) {
      confidence += 10;
      if (cvssMetrics.version === '3.1') confidence += 5; // Latest version
    }

    // Description quality
    const description = cve.descriptions?.find((d: any) => d.lang === 'en')?.value || '';
    if (description.length > 100) confidence += 5;

    // References availability
    if (cve.references && cve.references.length > 0) {
      confidence += Math.min(5, cve.references.length);
    }

    // Weakness analysis available
    if (cve.weaknesses && cve.weaknesses.length > 0) confidence += 5;

    // Configuration details available
    if (cve.configurations && cve.configurations.length > 0) confidence += 5;

    return Math.min(95, confidence);
  }

  /**
   * Map CVSS severity to ThreatIndicator severity
   */
  private mapCVSSSeverityToThreatSeverity(cvssBaseSeverity?: string): ThreatIndicator['severity'] {
    if (!cvssBaseSeverity) return 'medium';

    const severityMap: Record<string, ThreatIndicator['severity']> = {
      'CRITICAL': 'critical',
      'HIGH': 'high',
      'MEDIUM': 'medium',
      'LOW': 'low'
    };

    return severityMap[cvssBaseSeverity.toUpperCase()] || 'medium';
  }

  /**
   * Map CVSS v2 score to severity (for backwards compatibility)
   */
  private mapCVSSv2Severity(score: number): string {
    if (score >= 9.0) return 'CRITICAL';
    if (score >= 7.0) return 'HIGH';
    if (score >= 4.0) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Map CVSS attack vector to kill chain phase
   */
  private mapCVSSToKillChain(cvssMetrics: CVSSMetrics | null): string {
    if (!cvssMetrics) return 'unknown';

    const attackVector = cvssMetrics.attackVector?.toUpperCase();
    switch (attackVector) {
      case 'NETWORK':
        return 'delivery';
      case 'ADJACENT_NETWORK':
        return 'lateral-movement';
      case 'LOCAL':
        return 'privilege-escalation';
      case 'PHYSICAL':
        return 'initial-access';
      default:
        return 'exploitation';
    }
  }

  /**
   * Map CWE weaknesses to MITRE ATT&CK techniques (simplified mapping)
   */
  private mapWeaknessesToMitre(weaknesses: string[]): string {
    const mitreMapping: Record<string, string> = {
      'CWE-78': 'T1059', // OS Command Injection -> Command and Scripting Interpreter
      'CWE-79': 'T1055', // XSS -> Process Injection
      'CWE-89': 'T1190', // SQL Injection -> Exploit Public-Facing Application
      'CWE-94': 'T1055', // Code Injection -> Process Injection
      'CWE-119': 'T1055', // Buffer Overflow -> Process Injection
      'CWE-200': 'T1083', // Information Exposure -> File and Directory Discovery
      'CWE-264': 'T1068', // Permissions/Privileges -> Exploitation for Privilege Escalation
      'CWE-287': 'T1110', // Authentication bypass -> Brute Force
      'CWE-352': 'T1068', // CSRF -> Exploitation for Privilege Escalation
      'CWE-434': 'T1105', // File Upload -> Ingress Tool Transfer
      'CWE-502': 'T1055', // Deserialization -> Process Injection
    };

    const techniques: string[] = [];
    for (const weakness of weaknesses) {
      const technique = mitreMapping[weakness];
      if (technique) {
        techniques.push(technique);
      }
    }

    return techniques.join(', ');
  }

  /**
   * Remove duplicate indicators based on CVE ID
   */
  private deduplicateIndicators(indicators: ThreatIndicator[]): ThreatIndicator[] {
    const seen = new Set<string>();
    return indicators.filter(indicator => {
      if (seen.has(indicator.value)) {
        return false;
      }
      seen.add(indicator.value);
      return true;
    });
  }

  /**
   * Get time window for fetching CVEs
   */
  private getTimeWindow(): { startDate: string; endDate: string } {
    const endDate = new Date();
    const startDate = new Date();

    if (this.lastSync) {
      // Incremental update since last sync
      startDate.setTime(this.lastSync.getTime());
    } else {
      // Initial sync: last 7 days
      startDate.setDate(endDate.getDate() - 7);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  }

  /**
   * Check if indicator is new (simplified logic)
   */
  private isNewIndicator(indicator: ThreatIndicator): boolean {
    // In real implementation, this would check against existing database
    const daysSincePublished = (Date.now() - new Date(indicator.first_seen).getTime()) / (1000 * 60 * 60 * 24);
    return daysSincePublished <= 1; // Consider CVEs published in last 24 hours as new
  }

  /**
   * Calculate next update time
   */
  private calculateNextUpdate(): Date {
    const nextUpdate = new Date();
    nextUpdate.setHours(nextUpdate.getHours() + 4); // Update every 4 hours
    return nextUpdate;
  }

  /**
   * Make HTTP request with rate limiting
   */
  private async makeRequest(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout * 1000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'ARIA5-TI-Enhancement/1.0',
          ...this.config.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Rate limiting delay based on API key availability
   */
  private async rateLimitDelay(): Promise<void> {
    const delayMs = this.config.api_key 
      ? 1000 / this.requestsPerSecondWithKey  // With API key: 50 req/sec
      : 1000 / this.requestsPerSecond;        // Without API key: 5 req/sec
    
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }

  /**
   * Validate connector configuration
   */
  protected validateConfig(): void {
    if (this.config.api_key) {
      console.log('[NVD] API key provided - using enhanced rate limits');
    } else {
      console.log('[NVD] No API key - using public rate limits (5 req/sec)');
    }

    if (this.config.timeout < 30) {
      console.warn('[NVD] Timeout is low for NVD API - recommend at least 30 seconds');
    }
  }

  /**
   * Get connector status and health metrics
   */
  getStatus(): any {
    return {
      connector_type: 'NIST NVD',
      last_sync: this.lastSync,
      error_count: this.errorCount,
      max_errors: this.maxErrors,
      status: this.errorCount < this.maxErrors ? 'healthy' : 'degraded',
      api_endpoint: this.baseUrl,
      api_version: this.apiVersion,
      rate_limit: this.config.api_key ? '50 req/sec (with key)' : '5 req/sec (public)',
      max_results_per_request: this.maxResultsPerRequest
    };
  }
}

export default NVDConnector;
/**
 * ARIA5 TI Enhancement - Phase 2: Base Feed Connector
 * 
 * Abstract base class for all threat intelligence feed connectors.
 * Provides common functionality for data fetching, normalization, and error handling.
 */

export interface FeedConfig {
  id: string;
  name: string;
  type: 'stix_taxii' | 'json_api' | 'xml_feed' | 'csv_feed' | 'custom';
  url: string;
  api_key?: string;
  username?: string;
  password?: string;
  headers?: Record<string, string>;
  polling_interval: number; // seconds
  timeout: number; // seconds
  retry_attempts: number;
  retry_delay: number; // seconds
  enabled: boolean;
  normalization_rules?: any;
  filter_rules?: any;
}

export interface FeedData {
  indicators: ThreatIndicator[];
  metadata: {
    source: string;
    fetch_time: string;
    total_count: number;
    new_count: number;
    updated_count: number;
    version?: string;
    next_update?: string;
  };
}

export interface ThreatIndicator {
  id: string;
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'file_path' | 'cve' | 'yara';
  value: string;
  confidence: number; // 0-100
  severity: 'low' | 'medium' | 'high' | 'critical';
  first_seen: string;
  last_seen: string;
  tags: string[];
  context: {
    malware_family?: string;
    threat_actor?: string;
    campaign?: string;
    attack_pattern?: string;
    kill_chain_phase?: string;
    mitre_technique?: string;
  };
  source_confidence: number; // 0-1
  source_reliability: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; // Admiral scale
  tlp_marking?: 'WHITE' | 'GREEN' | 'AMBER' | 'RED';
  raw_data?: any;
}

export interface ConnectorResult {
  success: boolean;
  indicators_fetched: number;
  indicators_new: number;
  indicators_updated: number;
  errors: string[];
  processing_time_ms: number;
  next_sync?: Date;
}

export abstract class BaseFeedConnector {
  protected config: FeedConfig;
  protected lastSync?: Date;
  protected errorCount: number = 0;
  protected maxErrors: number = 5;

  constructor(config: FeedConfig) {
    this.config = config;
  }

  /**
   * Main method to fetch and process feed data
   */
  async fetchFeed(): Promise<ConnectorResult> {
    const startTime = Date.now();
    let indicators: ThreatIndicator[] = [];
    let errors: string[] = [];

    try {
      // Pre-fetch validation
      if (!this.config.enabled) {
        throw new Error('Feed connector is disabled');
      }

      if (this.errorCount >= this.maxErrors) {
        throw new Error(`Maximum error count reached (${this.maxErrors})`);
      }

      // Implement rate limiting
      await this.enforceRateLimit();

      // Fetch raw data
      console.log(`Fetching data from ${this.config.name}...`);
      const rawData = await this.fetchRawData();

      // Parse and normalize data
      console.log(`Parsing data from ${this.config.name}...`);
      indicators = await this.parseData(rawData);

      // Apply filters
      indicators = await this.applyFilters(indicators);

      // Normalize data format
      indicators = await this.normalizeData(indicators);

      // Validate indicators
      indicators = indicators.filter(indicator => this.validateIndicator(indicator));

      // Determine new vs updated
      const { newIndicators, updatedIndicators } = await this.categorizeIndicators(indicators);

      // Reset error count on successful fetch
      this.errorCount = 0;
      this.lastSync = new Date();

      const processingTime = Date.now() - startTime;

      console.log(`Successfully processed ${indicators.length} indicators from ${this.config.name} in ${processingTime}ms`);

      return {
        success: true,
        indicators_fetched: indicators.length,
        indicators_new: newIndicators,
        indicators_updated: updatedIndicators,
        errors: [],
        processing_time_ms: processingTime,
        next_sync: this.calculateNextSync()
      };

    } catch (error) {
      this.errorCount++;
      errors.push(error.message);
      
      console.error(`Feed fetch failed for ${this.config.name}:`, error);

      return {
        success: false,
        indicators_fetched: 0,
        indicators_new: 0,
        indicators_updated: 0,
        errors,
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Abstract methods to be implemented by specific connectors
   */
  protected abstract fetchRawData(): Promise<any>;
  protected abstract parseData(rawData: any): Promise<ThreatIndicator[]>;

  /**
   * Enforce rate limiting to prevent overwhelming the source
   */
  protected async enforceRateLimit(): Promise<void> {
    if (this.lastSync) {
      const timeSinceLastSync = Date.now() - this.lastSync.getTime();
      const minInterval = this.config.polling_interval * 1000;
      
      if (timeSinceLastSync < minInterval) {
        const waitTime = minInterval - timeSinceLastSync;
        console.log(`Rate limiting: waiting ${waitTime}ms before next fetch from ${this.config.name}`);
        await this.sleep(waitTime);
      }
    }
  }

  /**
   * Apply configured filters to indicators
   */
  protected async applyFilters(indicators: ThreatIndicator[]): Promise<ThreatIndicator[]> {
    if (!this.config.filter_rules) {
      return indicators;
    }

    return indicators.filter(indicator => {
      const rules = this.config.filter_rules;

      // Filter by types
      if (rules.allowed_types && !rules.allowed_types.includes(indicator.type)) {
        return false;
      }

      // Filter by confidence
      if (rules.min_confidence && indicator.confidence < rules.min_confidence) {
        return false;
      }

      // Filter by severity
      if (rules.min_severity) {
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
        if (severityLevels[indicator.severity] < severityLevels[rules.min_severity]) {
          return false;
        }
      }

      // Filter by TLP marking
      if (rules.allowed_tlp && indicator.tlp_marking && !rules.allowed_tlp.includes(indicator.tlp_marking)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Normalize data according to ARIA5 standards
   */
  protected async normalizeData(indicators: ThreatIndicator[]): Promise<ThreatIndicator[]> {
    return indicators.map(indicator => {
      // Ensure required fields
      if (!indicator.id) {
        indicator.id = this.generateIndicatorId(indicator);
      }

      // Normalize confidence to 0-100 scale
      if (indicator.confidence > 1 && indicator.confidence <= 10) {
        indicator.confidence = indicator.confidence * 10; // Convert 0-10 to 0-100
      }

      // Normalize timestamps
      if (!indicator.first_seen) {
        indicator.first_seen = new Date().toISOString();
      }
      if (!indicator.last_seen) {
        indicator.last_seen = indicator.first_seen;
      }

      // Apply normalization rules if configured
      if (this.config.normalization_rules) {
        indicator = this.applyNormalizationRules(indicator, this.config.normalization_rules);
      }

      return indicator;
    });
  }

  /**
   * Validate indicator data quality
   */
  protected validateIndicator(indicator: ThreatIndicator): boolean {
    // Required fields check
    if (!indicator.value || !indicator.type) {
      return false;
    }

    // Value format validation
    switch (indicator.type) {
      case 'ip':
        return this.isValidIP(indicator.value);
      case 'domain':
        return this.isValidDomain(indicator.value);
      case 'url':
        return this.isValidURL(indicator.value);
      case 'hash':
        return this.isValidHash(indicator.value);
      case 'email':
        return this.isValidEmail(indicator.value);
      default:
        return true; // Allow other types
    }
  }

  /**
   * Categorize indicators as new or updated
   */
  protected async categorizeIndicators(indicators: ThreatIndicator[]): Promise<{ newIndicators: number; updatedIndicators: number }> {
    // This would check against existing database records
    // For now, assume all are new (to be implemented with database integration)
    return {
      newIndicators: indicators.length,
      updatedIndicators: 0
    };
  }

  /**
   * Calculate next sync time
   */
  protected calculateNextSync(): Date {
    const next = new Date();
    next.setSeconds(next.getSeconds() + this.config.polling_interval);
    return next;
  }

  /**
   * Generate unique indicator ID
   */
  protected generateIndicatorId(indicator: ThreatIndicator): string {
    const source = this.config.name.toLowerCase().replace(/\s+/g, '_');
    const hash = this.simpleHash(indicator.value + indicator.type);
    return `${source}_${indicator.type}_${hash}`;
  }

  /**
   * Apply normalization rules to indicator
   */
  protected applyNormalizationRules(indicator: ThreatIndicator, rules: any): ThreatIndicator {
    // Apply custom transformation rules
    if (rules.confidence_multiplier) {
      indicator.confidence *= rules.confidence_multiplier;
    }

    if (rules.severity_mapping) {
      indicator.severity = rules.severity_mapping[indicator.severity] || indicator.severity;
    }

    if (rules.tag_mappings) {
      indicator.tags = indicator.tags.map(tag => rules.tag_mappings[tag] || tag);
    }

    return indicator;
  }

  // Validation helper methods
  protected isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  protected isValidDomain(domain: string): boolean {
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    return domainRegex.test(domain) && domain.length <= 253;
  }

  protected isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  protected isValidHash(hash: string): boolean {
    const md5Regex = /^[a-fA-F0-9]{32}$/;
    const sha1Regex = /^[a-fA-F0-9]{40}$/;
    const sha256Regex = /^[a-fA-F0-9]{64}$/;
    return md5Regex.test(hash) || sha1Regex.test(hash) || sha256Regex.test(hash);
  }

  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Utility methods
  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Make HTTP request with retry logic
   */
  protected async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const requestOptions: RequestInit = {
      timeout: this.config.timeout * 1000,
      headers: {
        'User-Agent': 'ARIA5-TI-Enhancement/1.0',
        ...this.config.headers,
        ...options.headers
      },
      ...options
    };

    // Add authentication if configured
    if (this.config.api_key) {
      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': `Bearer ${this.config.api_key}`
      };
    } else if (this.config.username && this.config.password) {
      const auth = btoa(`${this.config.username}:${this.config.password}`);
      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': `Basic ${auth}`
      };
    }

    let lastError: Error;

    for (let attempt = 0; attempt < this.config.retry_attempts; attempt++) {
      try {
        console.log(`Attempting request to ${url} (attempt ${attempt + 1}/${this.config.retry_attempts})`);
        
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;

      } catch (error) {
        lastError = error as Error;
        console.warn(`Request attempt ${attempt + 1} failed:`, error.message);

        if (attempt < this.config.retry_attempts - 1) {
          const delay = this.config.retry_delay * 1000 * Math.pow(2, attempt); // Exponential backoff
          console.log(`Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`All ${this.config.retry_attempts} request attempts failed. Last error: ${lastError.message}`);
  }

  // Getters
  get name(): string {
    return this.config.name;
  }

  get isEnabled(): boolean {
    return this.config.enabled;
  }

  get lastSyncTime(): Date | undefined {
    return this.lastSync;
  }

  get errorCountCurrent(): number {
    return this.errorCount;
  }
}
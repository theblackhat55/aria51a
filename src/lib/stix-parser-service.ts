/**
 * STIX Parser Service
 * Week 7 - STIX 2.1 Parser and Database Integration
 * 
 * Parses STIX 2.1 bundles and stores them in the database with:
 * - Full STIX object storage
 * - Relationship graph tracking
 * - IOC extraction with confidence scoring
 * - Vector embeddings for semantic search (placeholder for now)
 */

export interface STIXBundle {
  type: 'bundle';
  id: string;
  objects: STIXObject[];
  spec_version?: string;
}

export interface STIXObject {
  type: string;
  id: string;
  created: string;
  modified: string;
  created_by_ref?: string;
  revoked?: boolean;
  labels?: string[];
  confidence?: number;
  lang?: string;
  external_references?: Array<{
    source_name: string;
    description?: string;
    url?: string;
    external_id?: string;
  }>;
  object_marking_refs?: string[];
  granular_markings?: any[];
  [key: string]: any;
}

export interface STIXRelationship extends STIXObject {
  type: 'relationship';
  relationship_type: string;
  source_ref: string;
  target_ref: string;
}

export interface STIXIndicator extends STIXObject {
  type: 'indicator';
  name?: string;
  description?: string;
  pattern: string;
  pattern_type: string;
  valid_from: string;
  valid_until?: string;
  kill_chain_phases?: Array<{
    kill_chain_name: string;
    phase_name: string;
  }>;
}

export class STIXParserService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Parse and store a STIX bundle
   */
  async parseBundle(bundle: STIXBundle, taxiiServerId?: number): Promise<{
    bundleId: number;
    objectsStored: number;
    relationshipsStored: number;
    iocsExtracted: number;
  }> {
    try {
      // 1. Store the bundle
      const bundleResult = await this.db.prepare(`
        INSERT INTO stix_bundles (
          stix_id, type, spec_version, object_count, 
          relationship_count, source_taxii_server_id, 
          processing_status, raw_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        bundle.id,
        bundle.type,
        bundle.spec_version || '2.1',
        bundle.objects.length,
        bundle.objects.filter(o => o.type === 'relationship').length,
        taxiiServerId || null,
        'processing',
        JSON.stringify(bundle)
      ).run();

      const bundleId = bundleResult.meta.last_row_id as number;

      // 2. Store all STIX objects
      let objectsStored = 0;
      let relationshipsStored = 0;
      let iocsExtracted = 0;

      for (const obj of bundle.objects) {
        try {
          if (obj.type === 'relationship') {
            // Store relationship
            await this.storeRelationship(obj as STIXRelationship, bundleId);
            relationshipsStored++;
          } else {
            // Store regular STIX object
            await this.storeObject(obj, bundleId);
            objectsStored++;

            // Extract IOCs from indicators
            if (obj.type === 'indicator') {
              const iocs = await this.extractIOCs(obj as STIXIndicator, bundleId);
              iocsExtracted += iocs;
            }
          }
        } catch (error) {
          console.error(`Error storing STIX object ${obj.id}:`, error);
          // Continue processing other objects
        }
      }

      // 3. Update bundle status
      await this.db.prepare(`
        UPDATE stix_bundles 
        SET processing_status = 'completed',
            objects_stored = ?,
            relationships_stored = ?,
            processed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(objectsStored, relationshipsStored, bundleId).run();

      return {
        bundleId,
        objectsStored,
        relationshipsStored,
        iocsExtracted
      };

    } catch (error) {
      console.error('Error parsing STIX bundle:', error);
      throw error;
    }
  }

  /**
   * Store a STIX object in the database
   */
  private async storeObject(obj: STIXObject, bundleId: number): Promise<void> {
    // Extract common fields
    const name = obj.name || obj.id;
    const description = obj.description || '';
    const tlpMarking = this.extractTLPMarking(obj);
    const confidence = obj.confidence || null;
    
    // Generate simple text for FTS search (full-text search)
    const searchText = this.generateSearchText(obj);

    // Store object
    await this.db.prepare(`
      INSERT OR REPLACE INTO stix_objects (
        stix_id, type, name, description, spec_version,
        created, modified, created_by_ref, revoked,
        confidence, tlp_marking, labels, external_references,
        pattern, pattern_type, valid_from, valid_until,
        kill_chain_phases, bundle_id, raw_data, search_text,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `).bind(
      obj.id,
      obj.type,
      name.substring(0, 255), // Limit name length
      description.substring(0, 1000), // Limit description
      obj.spec_version || '2.1',
      obj.created,
      obj.modified,
      obj.created_by_ref || null,
      obj.revoked ? 1 : 0,
      confidence,
      tlpMarking,
      obj.labels ? JSON.stringify(obj.labels) : null,
      obj.external_references ? JSON.stringify(obj.external_references) : null,
      (obj as any).pattern || null,
      (obj as any).pattern_type || null,
      (obj as any).valid_from || null,
      (obj as any).valid_until || null,
      (obj as any).kill_chain_phases ? JSON.stringify((obj as any).kill_chain_phases) : null,
      bundleId,
      JSON.stringify(obj),
      searchText
    ).run();
  }

  /**
   * Store a STIX relationship
   */
  private async storeRelationship(rel: STIXRelationship, bundleId: number): Promise<void> {
    await this.db.prepare(`
      INSERT OR REPLACE INTO stix_relationships (
        stix_id, relationship_type, source_ref, target_ref,
        created, modified, description, bundle_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      rel.id,
      rel.relationship_type,
      rel.source_ref,
      rel.target_ref,
      rel.created,
      rel.modified,
      rel.description || null,
      bundleId
    ).run();
  }

  /**
   * Extract IOCs from a STIX indicator
   */
  private async extractIOCs(indicator: STIXIndicator, bundleId: number): Promise<number> {
    let count = 0;

    try {
      // Parse the STIX pattern to extract observables
      const observables = this.parsePattern(indicator.pattern);

      for (const observable of observables) {
        // Determine confidence and severity
        const confidence = indicator.confidence || 50;
        const severity = this.determineSeverity(indicator.labels || [], confidence);

        // Store IOC
        await this.db.prepare(`
          INSERT OR REPLACE INTO iocs (
            type, value, source, stix_object_id,
            confidence, severity, first_seen, last_seen,
            valid_until, tags, description, bundle_id,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
          observable.type,
          observable.value,
          'stix',
          indicator.id,
          confidence,
          severity,
          indicator.valid_from,
          indicator.modified,
          indicator.valid_until || null,
          indicator.labels ? JSON.stringify(indicator.labels) : null,
          indicator.description || indicator.name || null,
          bundleId
        ).run();

        count++;
      }
    } catch (error) {
      console.error(`Error extracting IOCs from indicator ${indicator.id}:`, error);
    }

    return count;
  }

  /**
   * Parse STIX pattern to extract observable values
   */
  private parsePattern(pattern: string): Array<{ type: string; value: string }> {
    const observables: Array<{ type: string; value: string }> = [];

    try {
      // Remove square brackets and split by AND/OR
      const cleanPattern = pattern.replace(/[\[\]]/g, '');
      const expressions = cleanPattern.split(/\s+(AND|OR)\s+/);

      for (const expr of expressions) {
        if (expr === 'AND' || expr === 'OR') continue;

        // Match different STIX cyber observable patterns
        const patterns = [
          { regex: /ipv4-addr:value\s*=\s*'([^']+)'/, type: 'ip' },
          { regex: /ipv6-addr:value\s*=\s*'([^']+)'/, type: 'ip' },
          { regex: /domain-name:value\s*=\s*'([^']+)'/, type: 'domain' },
          { regex: /url:value\s*=\s*'([^']+)'/, type: 'url' },
          { regex: /file:hashes\.MD5\s*=\s*'([^']+)'/, type: 'file_hash' },
          { regex: /file:hashes\.SHA-1\s*=\s*'([^']+)'/, type: 'file_hash' },
          { regex: /file:hashes\.SHA-256\s*=\s*'([^']+)'/, type: 'file_hash' },
          { regex: /email-addr:value\s*=\s*'([^']+)'/, type: 'email' },
          { regex: /email-message:sender_ref\.value\s*=\s*'([^']+)'/, type: 'email' },
          { regex: /file:name\s*=\s*'([^']+)'/, type: 'file_hash' },
          { regex: /process:name\s*=\s*'([^']+)'/, type: 'process' },
          { regex: /windows-registry-key:key\s*=\s*'([^']+)'/, type: 'registry_key' },
          { regex: /mutex:name\s*=\s*'([^']+)'/, type: 'mutex' }
        ];

        for (const { regex, type } of patterns) {
          const match = expr.match(regex);
          if (match) {
            observables.push({
              type,
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
   * Extract TLP marking from STIX object
   */
  private extractTLPMarking(obj: STIXObject): 'WHITE' | 'GREEN' | 'AMBER' | 'RED' | null {
    const markings = obj.object_marking_refs || [];
    
    for (const marking of markings) {
      if (typeof marking === 'string') {
        const lower = marking.toLowerCase();
        if (lower.includes('white')) return 'WHITE';
        if (lower.includes('green')) return 'GREEN';
        if (lower.includes('amber')) return 'AMBER';
        if (lower.includes('red')) return 'RED';
        if (lower.includes('tlp:clear')) return 'WHITE';
      }
    }

    // Check labels as fallback
    if (obj.labels) {
      for (const label of obj.labels) {
        const lower = label.toLowerCase();
        if (lower.includes('tlp:white') || lower.includes('tlp:clear')) return 'WHITE';
        if (lower.includes('tlp:green')) return 'GREEN';
        if (lower.includes('tlp:amber')) return 'AMBER';
        if (lower.includes('tlp:red')) return 'RED';
      }
    }

    return null;
  }

  /**
   * Determine severity based on labels and confidence
   */
  private determineSeverity(labels: string[], confidence: number): 'critical' | 'high' | 'medium' | 'low' {
    const labelStr = labels.join(' ').toLowerCase();

    if (labelStr.includes('critical') || labelStr.includes('malicious-activity')) {
      return 'critical';
    }
    if (labelStr.includes('high') || (labelStr.includes('malicious') && confidence >= 80)) {
      return 'high';
    }
    if (labelStr.includes('medium') || labelStr.includes('suspicious')) {
      return 'medium';
    }
    if (labelStr.includes('low') || labelStr.includes('benign')) {
      return 'low';
    }

    // Default based on confidence
    if (confidence >= 80) return 'high';
    if (confidence >= 50) return 'medium';
    return 'low';
  }

  /**
   * Generate search text for full-text search
   */
  private generateSearchText(obj: STIXObject): string {
    const parts: string[] = [];

    if (obj.name) parts.push(obj.name);
    if (obj.description) parts.push(obj.description);
    if (obj.labels) parts.push(obj.labels.join(' '));
    if ((obj as any).pattern) parts.push((obj as any).pattern);

    return parts.join(' ').substring(0, 5000); // Limit search text size
  }

  /**
   * Get STIX object statistics
   */
  async getStatistics(): Promise<{
    totalObjects: number;
    totalBundles: number;
    totalIOCs: number;
    objectsByType: Record<string, number>;
  }> {
    const [totalObjects, totalBundles, totalIOCs, typeStats] = await Promise.all([
      this.db.prepare('SELECT COUNT(*) as count FROM stix_objects').first(),
      this.db.prepare('SELECT COUNT(*) as count FROM stix_bundles').first(),
      this.db.prepare('SELECT COUNT(*) as count FROM iocs WHERE source = ?').bind('stix').first(),
      this.db.prepare(`
        SELECT type, COUNT(*) as count 
        FROM stix_objects 
        GROUP BY type
        ORDER BY count DESC
      `).all()
    ]);

    const objectsByType: Record<string, number> = {};
    if (typeStats.results) {
      for (const row of typeStats.results as any[]) {
        objectsByType[row.type] = row.count;
      }
    }

    return {
      totalObjects: (totalObjects as any)?.count || 0,
      totalBundles: (totalBundles as any)?.count || 0,
      totalIOCs: (totalIOCs as any)?.count || 0,
      objectsByType
    };
  }
}

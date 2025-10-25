/**
 * TAXII Client Service
 * Week 7 - TAXII 2.1 Client for Polling Threat Intelligence
 * 
 * Connects to TAXII 2.1 servers, polls collections, and fetches STIX bundles.
 * Supports authentication: Basic, API Key, OAuth
 */

import { STIXBundle, STIXParserService } from './stix-parser-service';

export interface TAXIIServer {
  id: number;
  name: string;
  url: string;
  api_root: string;
  username?: string;
  password?: string;
  api_key?: string;
  auth_type: 'none' | 'basic' | 'api_key' | 'oauth';
  verify_ssl: boolean;
  is_active: boolean;
}

export interface TAXIICollection {
  id: number;
  taxii_server_id: number;
  collection_id: string;
  title: string;
  description?: string;
  can_read: boolean;
  can_write: boolean;
  media_types?: string[];
  is_polling_enabled: boolean;
  polling_interval_minutes: number;
  last_poll_at?: string;
  next_poll_at?: string;
}

export class TAXIIClientService {
  private db: D1Database;
  private stixParser: STIXParserService;

  constructor(db: D1Database) {
    this.db = db;
    this.stixParser = new STIXParserService(db);
  }

  /**
   * Test connection to a TAXII server
   */
  async testConnection(server: TAXIIServer): Promise<{
    success: boolean;
    message: string;
    apiRoots?: string[];
    collections?: number;
  }> {
    try {
      // 1. Discover server
      const discoveryUrl = new URL('/taxii2/', server.url).href;
      const discoveryResponse = await this.makeRequest(server, discoveryUrl);
      const discovery = await discoveryResponse.json();

      if (!discovery.api_roots || discovery.api_roots.length === 0) {
        return {
          success: false,
          message: 'No API roots found on server'
        };
      }

      // 2. Get collections from first API root
      const apiRoot = discovery.api_roots[0];
      const collectionsUrl = new URL('collections/', apiRoot).href;
      const collectionsResponse = await this.makeRequest(server, collectionsUrl);
      const collectionsData = await collectionsResponse.json();

      const collections = collectionsData.collections || [];

      return {
        success: true,
        message: 'Connection successful',
        apiRoots: discovery.api_roots,
        collections: collections.length
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Discover and store collections from a TAXII server
   */
  async discoverCollections(serverId: number): Promise<number> {
    try {
      // Get server details
      const serverResult = await this.db.prepare(
        'SELECT * FROM taxii_servers WHERE id = ?'
      ).bind(serverId).first();

      if (!serverResult) {
        throw new Error('Server not found');
      }

      const server = serverResult as unknown as TAXIIServer;

      // Get collections
      const collectionsUrl = new URL('collections/', server.api_root).href;
      const response = await this.makeRequest(server, collectionsUrl);
      const data = await response.json();

      const collections = data.collections || [];
      let storedCount = 0;

      for (const collection of collections) {
        try {
          await this.db.prepare(`
            INSERT OR REPLACE INTO taxii_collections (
              taxii_server_id, collection_id, title, description,
              can_read, can_write, media_types, is_polling_enabled,
              polling_interval_minutes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).bind(
            serverId,
            collection.id,
            collection.title || collection.id,
            collection.description || null,
            collection.can_read !== false ? 1 : 0,
            collection.can_write === true ? 1 : 0,
            collection.media_types ? JSON.stringify(collection.media_types) : null,
            1, // Enable polling by default
            60 // Default 60 minutes
          ).run();

          storedCount++;
        } catch (error) {
          console.error(`Error storing collection ${collection.id}:`, error);
        }
      }

      return storedCount;

    } catch (error) {
      console.error('Error discovering collections:', error);
      throw error;
    }
  }

  /**
   * Poll a specific collection for new STIX objects
   */
  async pollCollection(collectionId: number): Promise<{
    success: boolean;
    objectsFetched: number;
    iocsExtracted: number;
    error?: string;
  }> {
    try {
      // Get collection details
      const collection = await this.db.prepare(`
        SELECT c.*, s.*
        FROM taxii_collections c
        JOIN taxii_servers s ON c.taxii_server_id = s.id
        WHERE c.id = ?
      `).bind(collectionId).first() as any;

      if (!collection) {
        throw new Error('Collection not found');
      }

      if (!collection.can_read) {
        throw new Error('Collection is not readable');
      }

      // Build objects URL
      const objectsUrl = new URL(
        `collections/${collection.collection_id}/objects/`,
        collection.api_root
      ).href;

      // Add query parameters for incremental updates
      const url = new URL(objectsUrl);
      if (collection.last_poll_at) {
        url.searchParams.append('added_after', collection.last_poll_at);
      }
      url.searchParams.append('limit', '1000'); // Limit to 1000 objects per poll

      // Fetch objects
      const response = await this.makeRequest(
        {
          id: collection.taxii_server_id,
          name: collection.name,
          url: collection.url,
          api_root: collection.api_root,
          username: collection.username,
          password: collection.password,
          api_key: collection.api_key,
          auth_type: collection.auth_type,
          verify_ssl: collection.verify_ssl,
          is_active: collection.is_active
        } as TAXIIServer,
        url.href
      );

      const data = await response.json();

      // Handle both envelope and bundle formats
      let bundle: STIXBundle;
      
      if (data.objects) {
        // TAXII envelope format
        bundle = {
          type: 'bundle',
          id: `bundle--${crypto.randomUUID()}`,
          objects: data.objects,
          spec_version: '2.1'
        };
      } else if (data.type === 'bundle') {
        // Direct STIX bundle
        bundle = data;
      } else {
        throw new Error('Unexpected response format');
      }

      // Parse and store bundle
      const result = await this.stixParser.parseBundle(bundle, collection.taxii_server_id);

      // Update collection poll status
      const now = new Date().toISOString();
      const nextPoll = new Date(Date.now() + collection.polling_interval_minutes * 60 * 1000).toISOString();

      await this.db.prepare(`
        UPDATE taxii_collections
        SET last_poll_at = ?,
            next_poll_at = ?,
            last_poll_status = 'success',
            objects_count = objects_count + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(now, nextPoll, result.objectsStored, collectionId).run();

      return {
        success: true,
        objectsFetched: result.objectsStored,
        iocsExtracted: result.iocsExtracted
      };

    } catch (error: any) {
      // Update collection with error status
      await this.db.prepare(`
        UPDATE taxii_collections
        SET last_poll_status = 'error',
            last_poll_error = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(error.message, collectionId).run();

      return {
        success: false,
        objectsFetched: 0,
        iocsExtracted: 0,
        error: error.message
      };
    }
  }

  /**
   * Poll all enabled collections that are due for polling
   */
  async pollDueCollections(): Promise<{
    collectionsPolled: number;
    totalObjectsFetched: number;
    totalIOCsExtracted: number;
    errors: string[];
  }> {
    try {
      // Get collections due for polling
      const result = await this.db.prepare(`
        SELECT c.id
        FROM taxii_collections c
        JOIN taxii_servers s ON c.taxii_server_id = s.id
        WHERE c.is_polling_enabled = 1
          AND s.is_active = 1
          AND (c.next_poll_at IS NULL OR c.next_poll_at <= datetime('now'))
        ORDER BY c.next_poll_at ASC
        LIMIT 10
      `).all();

      const collections = result.results as any[];
      
      let collectionsPolled = 0;
      let totalObjectsFetched = 0;
      let totalIOCsExtracted = 0;
      const errors: string[] = [];

      for (const collection of collections) {
        try {
          const pollResult = await this.pollCollection(collection.id);
          
          if (pollResult.success) {
            collectionsPolled++;
            totalObjectsFetched += pollResult.objectsFetched;
            totalIOCsExtracted += pollResult.iocsExtracted;
          } else {
            errors.push(`Collection ${collection.id}: ${pollResult.error}`);
          }
        } catch (error: any) {
          errors.push(`Collection ${collection.id}: ${error.message}`);
        }
      }

      return {
        collectionsPolled,
        totalObjectsFetched,
        totalIOCsExtracted,
        errors
      };

    } catch (error: any) {
      throw new Error(`Failed to poll collections: ${error.message}`);
    }
  }

  /**
   * Make authenticated request to TAXII server
   */
  private async makeRequest(server: TAXIIServer, url: string): Promise<Response> {
    const headers: Record<string, string> = {
      'Accept': 'application/taxii+json;version=2.1',
      'Content-Type': 'application/taxii+json;version=2.1'
    };

    // Add authentication
    if (server.auth_type === 'basic' && server.username && server.password) {
      const credentials = btoa(`${server.username}:${server.password}`);
      headers['Authorization'] = `Basic ${credentials}`;
    } else if (server.auth_type === 'api_key' && server.api_key) {
      headers['Authorization'] = `Bearer ${server.api_key}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  /**
   * Get polling statistics
   */
  async getPollingStatistics(): Promise<{
    activeServers: number;
    totalCollections: number;
    enabledCollections: number;
    dueForPolling: number;
    lastPollResults: any[];
  }> {
    const [activeServers, totalCollections, enabledCollections, dueForPolling, lastPolls] = await Promise.all([
      this.db.prepare('SELECT COUNT(*) as count FROM taxii_servers WHERE is_active = 1').first(),
      this.db.prepare('SELECT COUNT(*) as count FROM taxii_collections').first(),
      this.db.prepare('SELECT COUNT(*) as count FROM taxii_collections WHERE is_polling_enabled = 1').first(),
      this.db.prepare(`
        SELECT COUNT(*) as count FROM taxii_collections 
        WHERE is_polling_enabled = 1 AND (next_poll_at IS NULL OR next_poll_at <= datetime('now'))
      `).first(),
      this.db.prepare(`
        SELECT c.id, c.title, c.last_poll_at, c.last_poll_status, c.last_poll_error,
               s.name as server_name
        FROM taxii_collections c
        JOIN taxii_servers s ON c.taxii_server_id = s.id
        WHERE c.last_poll_at IS NOT NULL
        ORDER BY c.last_poll_at DESC
        LIMIT 10
      `).all()
    ]);

    return {
      activeServers: (activeServers as any)?.count || 0,
      totalCollections: (totalCollections as any)?.count || 0,
      enabledCollections: (enabledCollections as any)?.count || 0,
      dueForPolling: (dueForPolling as any)?.count || 0,
      lastPollResults: lastPolls.results || []
    };
  }
}

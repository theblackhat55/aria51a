/**
 * Auto-Indexing Service for Real-Time Semantic Search Updates
 * 
 * Automatically indexes new and updated records into Vectorize when data changes.
 * Supports multiple strategies: webhook-based, polling, and trigger simulation.
 * 
 * Architecture:
 * - Webhook endpoint receives data change notifications
 * - Polling service checks for recently modified records
 * - Incremental indexing updates only changed records
 */

import type { MCPEnvironment } from '../types/mcp-types';
import { VectorizeService } from './vectorize-service';
import { DocumentProcessor } from './document-processor';

export interface IndexingJob {
  id: string;
  namespace: string;
  recordId: number;
  operation: 'insert' | 'update' | 'delete';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface AutoIndexingConfig {
  enabled: boolean;
  pollingIntervalMs?: number;
  batchSize?: number;
  maxRetries?: number;
  namespaces: string[];
}

export class AutoIndexingService {
  private env: MCPEnvironment;
  private vectorize: VectorizeService;
  private documentProcessor: DocumentProcessor;
  private config: AutoIndexingConfig;
  private pollingTimer?: NodeJS.Timeout;

  constructor(env: MCPEnvironment, config?: Partial<AutoIndexingConfig>) {
    this.env = env;
    this.vectorize = new VectorizeService(env);
    this.documentProcessor = new DocumentProcessor();
    this.config = {
      enabled: true,
      pollingIntervalMs: 60000, // 1 minute
      batchSize: 20,
      maxRetries: 3,
      namespaces: ['risks', 'incidents', 'compliance', 'documents'],
      ...config
    };
  }

  /**
   * Handle webhook notification for data change
   * This is called when ARIA5.1 creates/updates/deletes a record
   */
  async handleDataChange(
    namespace: string,
    recordId: number,
    operation: 'insert' | 'update' | 'delete',
    data?: any
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      // Validate namespace
      if (!this.config.namespaces.includes(namespace)) {
        return {
          success: false,
          error: `Namespace '${namespace}' not configured for auto-indexing`
        };
      }

      // Create indexing job
      const jobId = `${namespace}_${recordId}_${Date.now()}`;
      
      console.log(`📝 Auto-indexing job created: ${jobId} (${operation})`);

      // Process immediately for real-time updates
      const result = await this.processIndexingJob({
        id: jobId,
        namespace,
        recordId,
        operation,
        status: 'pending',
        attempts: 0,
        createdAt: new Date().toISOString()
      }, data);

      return {
        success: result.success,
        jobId,
        error: result.error
      };

    } catch (error: any) {
      console.error('❌ Error handling data change:', error);
      return {
        success: false,
        error: error.message || 'Failed to handle data change'
      };
    }
  }

  /**
   * Process a single indexing job
   */
  private async processIndexingJob(
    job: IndexingJob,
    data?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      job.status = 'processing';

      switch (job.operation) {
        case 'insert':
        case 'update':
          return await this.indexRecord(job.namespace, job.recordId, data);
        
        case 'delete':
          return await this.deleteRecord(job.namespace, job.recordId);
        
        default:
          return {
            success: false,
            error: `Unknown operation: ${job.operation}`
          };
      }

    } catch (error: any) {
      job.attempts++;
      
      if (job.attempts >= this.config.maxRetries!) {
        job.status = 'failed';
        job.error = error.message;
        console.error(`❌ Job ${job.id} failed after ${job.attempts} attempts:`, error);
        return { success: false, error: error.message };
      }

      // Retry later
      job.status = 'pending';
      console.warn(`⚠️  Job ${job.id} failed (attempt ${job.attempts}), will retry`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Index a single record into Vectorize
   */
  private async indexRecord(
    namespace: string,
    recordId: number,
    providedData?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let data = providedData;

      // Fetch record from database if not provided
      if (!data) {
        data = await this.fetchRecord(namespace, recordId);
        if (!data) {
          return {
            success: false,
            error: `Record ${recordId} not found in ${namespace}`
          };
        }
      }

      // Generate content and embedding based on namespace
      let content: string;
      let metadata: any;

      switch (namespace) {
        case 'risks':
          content = [
            `Risk: ${data.title}`,
            data.description || '',
            `Category: ${data.category || 'Unknown'}`,
            `Risk Level: ${data.risk_level || 'Unknown'}`,
            `Status: ${data.status || 'Unknown'}`,
            data.mitigation_strategy || ''
          ].filter(Boolean).join('\n');
          
          metadata = {
            recordId: recordId.toString(),
            title: data.title,
            category: data.category || '',
            risk_level: data.risk_level || '',
            status: data.status || '',
            indexed_at: new Date().toISOString()
          };
          break;

        case 'incidents':
          content = [
            `Incident: ${data.title}`,
            data.description || '',
            `Type: ${data.type || 'Unknown'}`,
            `Severity: ${data.severity || 'Unknown'}`,
            data.root_cause || '',
            data.impact_description || ''
          ].filter(Boolean).join('\n');
          
          metadata = {
            recordId: recordId.toString(),
            title: data.title,
            type: data.type || '',
            severity: data.severity || '',
            status: data.status || '',
            indexed_at: new Date().toISOString()
          };
          break;

        case 'compliance':
          content = [
            `Control: ${data.control_name}`,
            `ID: ${data.control_id}`,
            data.description || '',
            `Category: ${data.category || 'Unknown'}`,
            `Priority: ${data.priority || 'Unknown'}`
          ].filter(Boolean).join('\n');
          
          metadata = {
            recordId: recordId.toString(),
            control_id: data.control_id,
            control_name: data.control_name,
            category: data.category || '',
            priority: data.priority || '',
            indexed_at: new Date().toISOString()
          };
          break;

        case 'documents':
          // Documents require chunking
          return await this.indexDocument(recordId, data);

        default:
          return {
            success: false,
            error: `Unsupported namespace: ${namespace}`
          };
      }

      // Generate embedding
      const embeddingResult = await this.vectorize.generateEmbedding({ text: content });

      // Upsert into Vectorize
      await this.env.VECTORIZE.upsert([{
        id: `${namespace}_${recordId}`,
        values: embeddingResult.embedding,
        namespace,
        metadata
      }]);

      console.log(`✅ Indexed ${namespace} record ${recordId}`);
      return { success: true };

    } catch (error: any) {
      console.error(`❌ Failed to index ${namespace} record ${recordId}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to index record'
      };
    }
  }

  /**
   * Index a document with chunking
   */
  private async indexDocument(
    documentId: number,
    data?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Fetch document if not provided
      if (!data) {
        const docResult = await this.env.DB.prepare(`
          SELECT id, title, content, document_type, file_path
          FROM rag_documents WHERE id = ?
        `).bind(documentId).first();

        if (!docResult) {
          return {
            success: false,
            error: `Document ${documentId} not found`
          };
        }
        data = docResult;
      }

      if (!data.content) {
        return {
          success: false,
          error: 'Document has no content to index'
        };
      }

      // Update status
      await this.env.DB.prepare(`
        UPDATE rag_documents 
        SET embedding_status = 'processing', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(documentId).run();

      // Process document into chunks
      const chunks = await this.documentProcessor.processDocument(
        documentId,
        data.content as string,
        {
          title: data.title as string,
          document_type: data.document_type as string,
          file_path: data.file_path as string
        },
        {
          chunkSize: 512,
          chunkOverlap: 50,
          strategy: 'semantic',
          preserveContext: true
        }
      );

      // Store chunks
      await this.vectorize.storeDocumentChunks(documentId, chunks);

      // Update status
      await this.env.DB.prepare(`
        UPDATE rag_documents 
        SET embedding_status = 'completed', chunk_count = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(chunks.length, documentId).run();

      console.log(`✅ Indexed document ${documentId} with ${chunks.length} chunks`);
      return { success: true };

    } catch (error: any) {
      // Update status to failed
      await this.env.DB.prepare(`
        UPDATE rag_documents 
        SET embedding_status = 'failed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(documentId).run();

      console.error(`❌ Failed to index document ${documentId}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to index document'
      };
    }
  }

  /**
   * Delete a record from Vectorize
   */
  private async deleteRecord(
    namespace: string,
    recordId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const vectorId = `${namespace}_${recordId}`;
      
      // Delete from Vectorize
      await this.env.VECTORIZE.deleteByIds([vectorId]);

      console.log(`✅ Deleted ${namespace} record ${recordId} from index`);
      return { success: true };

    } catch (error: any) {
      console.error(`❌ Failed to delete ${namespace} record ${recordId}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to delete record'
      };
    }
  }

  /**
   * Fetch a record from the database
   */
  private async fetchRecord(namespace: string, recordId: number): Promise<any> {
    let query: string;
    
    switch (namespace) {
      case 'risks':
        query = `SELECT * FROM risks WHERE id = ?`;
        break;
      case 'incidents':
        query = `SELECT * FROM incidents WHERE id = ?`;
        break;
      case 'compliance':
        query = `SELECT fc.*, cf.name as framework_name 
                 FROM framework_controls fc 
                 JOIN compliance_frameworks cf ON fc.framework_id = cf.id 
                 WHERE fc.id = ?`;
        break;
      case 'documents':
        query = `SELECT * FROM rag_documents WHERE id = ?`;
        break;
      default:
        return null;
    }

    const result = await this.env.DB.prepare(query).bind(recordId).first();
    return result;
  }

  /**
   * Start polling for recently modified records
   * This is a fallback mechanism when webhooks aren't available
   */
  startPolling(): void {
    if (!this.config.enabled || this.pollingTimer) {
      return;
    }

    console.log(`🔄 Starting auto-indexing polling (interval: ${this.config.pollingIntervalMs}ms)`);

    this.pollingTimer = setInterval(async () => {
      try {
        await this.pollRecentChanges();
      } catch (error) {
        console.error('❌ Polling error:', error);
      }
    }, this.config.pollingIntervalMs);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = undefined;
      console.log('⏹️  Stopped auto-indexing polling');
    }
  }

  /**
   * Poll for recently modified records and index them
   */
  private async pollRecentChanges(): Promise<void> {
    const cutoffTime = new Date(Date.now() - this.config.pollingIntervalMs!);
    const cutoffISO = cutoffTime.toISOString();

    for (const namespace of this.config.namespaces) {
      try {
        // Find recently modified records
        const records = await this.findRecentlyModified(namespace, cutoffISO);
        
        if (records.length === 0) {
          continue;
        }

        console.log(`📊 Found ${records.length} recently modified ${namespace} records`);

        // Index in batches
        for (let i = 0; i < records.length; i += this.config.batchSize!) {
          const batch = records.slice(i, i + this.config.batchSize!);
          
          for (const record of batch) {
            await this.handleDataChange(namespace, record.id, 'update', record);
          }
        }

      } catch (error) {
        console.error(`❌ Error polling ${namespace}:`, error);
      }
    }
  }

  /**
   * Find recently modified records in a namespace
   */
  private async findRecentlyModified(namespace: string, since: string): Promise<any[]> {
    let query: string;

    switch (namespace) {
      case 'risks':
        query = `SELECT * FROM risks WHERE updated_at > ? ORDER BY updated_at DESC`;
        break;
      case 'incidents':
        query = `SELECT * FROM incidents WHERE updated_at > ? ORDER BY updated_at DESC`;
        break;
      case 'compliance':
        query = `SELECT fc.*, cf.name as framework_name 
                 FROM framework_controls fc 
                 JOIN compliance_frameworks cf ON fc.framework_id = cf.id 
                 WHERE fc.created_at > ? 
                 ORDER BY fc.created_at DESC`;
        break;
      case 'documents':
        query = `SELECT * FROM rag_documents 
                 WHERE updated_at > ? AND embedding_status != 'completed' 
                 ORDER BY updated_at DESC`;
        break;
      default:
        return [];
    }

    const result = await this.env.DB.prepare(query).bind(since).all();
    return result.results as any[];
  }

  /**
   * Get auto-indexing statistics
   */
  async getStatistics(): Promise<{
    enabled: boolean;
    pollingActive: boolean;
    config: AutoIndexingConfig;
  }> {
    return {
      enabled: this.config.enabled,
      pollingActive: !!this.pollingTimer,
      config: this.config
    };
  }
}

/**
 * Create auto-indexing service instance
 */
export function createAutoIndexingService(
  env: MCPEnvironment,
  config?: Partial<AutoIndexingConfig>
): AutoIndexingService {
  return new AutoIndexingService(env, config);
}

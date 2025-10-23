/**
 * Batch Indexing Utility for MCP Server
 * 
 * Indexes existing data from ARIA5.1 database into Vectorize for semantic search.
 * Processes risks, incidents, compliance controls, and documents in batches.
 * 
 * Usage:
 *   npx tsx src/mcp-server/scripts/batch-indexer.ts [namespace] [options]
 * 
 * Examples:
 *   npx tsx src/mcp-server/scripts/batch-indexer.ts risks
 *   npx tsx src/mcp-server/scripts/batch-indexer.ts all --batch-size=50
 */

import type { MCPEnvironment } from '../types/mcp-types';
import { VectorizeService } from '../services/vectorize-service';
import { DocumentProcessor } from '../services/document-processor';

interface BatchIndexOptions {
  namespace?: string;
  batchSize?: number;
  skipExisting?: boolean;
  dryRun?: boolean;
}

export class BatchIndexer {
  private env: MCPEnvironment;
  private vectorize: VectorizeService;
  private documentProcessor: DocumentProcessor;
  private stats = {
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0
  };

  constructor(env: MCPEnvironment) {
    this.env = env;
    this.vectorize = new VectorizeService(env);
    this.documentProcessor = new DocumentProcessor();
  }

  /**
   * Index all risks from the database
   */
  async indexRisks(options: BatchIndexOptions = {}): Promise<any> {
    const { batchSize = 50, skipExisting = false, dryRun = false } = options;
    
    console.log('📊 Starting risk indexing...');
    
    try {
      // Fetch all risks
      const risksResult = await this.env.DB.prepare(`
        SELECT id, title, description, category, subcategory, probability, impact, 
               inherent_risk, residual_risk, status, source, affected_assets
        FROM risks
        ORDER BY id ASC
      `).all();
      
      const risks = risksResult.results as any[];
      console.log(`Found ${risks.length} risks to index`);
      
      if (dryRun) {
        console.log('🔍 DRY RUN - No actual indexing will occur');
        return { dryRun: true, wouldProcess: risks.length };
      }
      
      // Process in batches
      for (let i = 0; i < risks.length; i += batchSize) {
        const batch = risks.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(risks.length / batchSize)}...`);
        
        const vectors = [];
        
        for (const risk of batch) {
          this.stats.processed++;
          
          try {
            // Build content for embedding
            const riskLevel = risk.inherent_risk >= 15 ? 'Critical' : 
                             risk.inherent_risk >= 10 ? 'High' : 
                             risk.inherent_risk >= 5 ? 'Medium' : 'Low';
            const content = [
              `Risk: ${risk.title}`,
              risk.description || '',
              `Category: ${risk.category || 'Unknown'}`,
              risk.subcategory ? `Subcategory: ${risk.subcategory}` : '',
              `Risk Level: ${riskLevel}`,
              `Probability: ${risk.probability || 0}`,
              `Impact: ${risk.impact || 0}`,
              `Status: ${risk.status || 'Unknown'}`,
              risk.affected_assets ? `Affected Assets: ${risk.affected_assets}` : ''
            ].filter(Boolean).join('\n');
            
            // Generate embedding
            const embeddingResult = await this.vectorize.generateEmbedding({ text: content });
            
            // Prepare vector with metadata
            vectors.push({
              id: `risk_${risk.id}`,
              values: embeddingResult.embedding,
              namespace: 'risks',
              metadata: {
                recordId: risk.id.toString(),
                title: risk.title,
                category: risk.category || '',
                subcategory: risk.subcategory || '',
                risk_level: riskLevel,
                probability: risk.probability?.toString() || '0',
                impact: risk.impact?.toString() || '0',
                status: risk.status || '',
                indexed_at: new Date().toISOString()
              }
            });
            
            this.stats.successful++;
            
          } catch (error: any) {
            console.error(`❌ Failed to process risk ${risk.id}:`, error.message);
            this.stats.failed++;
          }
        }
        
        // Insert batch into Vectorize
        if (vectors.length > 0) {
          try {
            console.log(`📤 Inserting ${vectors.length} vectors into Vectorize...`);
            const result = await this.env.VECTORIZE.insert(vectors);
            console.log(`✅ Indexed ${vectors.length} risks - insert result:`, JSON.stringify(result));
          } catch (error: any) {
            console.error(`❌ Failed to insert batch into Vectorize:`, error.message, error.stack);
            throw error; // Don't swallow the error
          }
        }
      }
      
      console.log('✅ Risk indexing completed');
      console.log(`   Processed: ${this.stats.processed}`);
      console.log(`   Successful: ${this.stats.successful}`);
      console.log(`   Failed: ${this.stats.failed}`);
      
      return this.stats;
      
    } catch (error: any) {
      console.error('❌ Risk indexing failed:', error);
      throw error;
    }
  }

  /**
   * Index all incidents/threats from the database
   */
  async indexIncidents(options: BatchIndexOptions = {}): Promise<any> {
    const { batchSize = 50, dryRun = false } = options;
    
    console.log('🚨 Starting incident indexing...');
    
    try {
      const incidentsResult = await this.env.DB.prepare(`
        SELECT id, title, description, type, severity, status, root_cause, impact_description, lessons_learned
        FROM incidents
        ORDER BY id ASC
      `).all();
      
      const incidents = incidentsResult.results as any[];
      console.log(`Found ${incidents.length} incidents to index`);
      
      if (dryRun) {
        return { dryRun: true, wouldProcess: incidents.length };
      }
      
      for (let i = 0; i < incidents.length; i += batchSize) {
        const batch = incidents.slice(i, i + batchSize);
        const vectors = [];
        
        for (const incident of batch) {
          this.stats.processed++;
          
          try {
            const content = [
              `Incident: ${incident.title}`,
              incident.description || '',
              `Type: ${incident.type || 'Unknown'}`,
              `Severity: ${incident.severity || 'Unknown'}`,
              incident.root_cause || '',
              incident.impact_description || '',
              incident.lessons_learned || ''
            ].filter(Boolean).join('\n');
            
            const embeddingResult = await this.vectorize.generateEmbedding({ text: content });
            
            vectors.push({
              id: `incident_${incident.id}`,
              values: embeddingResult.embedding,
              namespace: 'incidents',
              metadata: {
                recordId: incident.id.toString(),
                title: incident.title,
                type: incident.type || '',
                severity: incident.severity || '',
                status: incident.status || '',
                indexed_at: new Date().toISOString()
              }
            });
            
            this.stats.successful++;
            
          } catch (error: any) {
            console.error(`❌ Failed to process incident ${incident.id}:`, error.message);
            this.stats.failed++;
          }
        }
        
        if (vectors.length > 0) {
          await this.env.VECTORIZE.insert(vectors);
          console.log(`✅ Indexed ${vectors.length} incidents`);
        }
      }
      
      console.log('✅ Incident indexing completed');
      return this.stats;
      
    } catch (error: any) {
      console.error('❌ Incident indexing failed:', error);
      throw error;
    }
  }

  /**
   * Index all compliance controls from the database
   */
  async indexComplianceControls(options: BatchIndexOptions = {}): Promise<any> {
    const { batchSize = 50, dryRun = false } = options;
    
    console.log('📋 Starting compliance control indexing...');
    
    try {
      const controlsResult = await this.env.DB.prepare(`
        SELECT 
          fc.id, fc.control_id, fc.control_name, fc.description,
          fc.category, fc.priority, fc.control_type,
          cf.name as framework_name, cf.version as framework_version
        FROM framework_controls fc
        JOIN compliance_frameworks cf ON fc.framework_id = cf.id
        ORDER BY fc.id ASC
      `).all();
      
      const controls = controlsResult.results as any[];
      console.log(`Found ${controls.length} controls to index`);
      
      if (dryRun) {
        return { dryRun: true, wouldProcess: controls.length };
      }
      
      for (let i = 0; i < controls.length; i += batchSize) {
        const batch = controls.slice(i, i + batchSize);
        const vectors = [];
        
        for (const control of batch) {
          this.stats.processed++;
          
          try {
            const content = [
              `Control: ${control.control_name}`,
              `ID: ${control.control_id}`,
              control.description || '',
              `Category: ${control.category || 'Unknown'}`,
              `Framework: ${control.framework_name} ${control.framework_version || ''}`,
              `Priority: ${control.priority || 'Unknown'}`,
              `Type: ${control.control_type || 'Unknown'}`
            ].filter(Boolean).join('\n');
            
            const embeddingResult = await this.vectorize.generateEmbedding({ text: content });
            
            vectors.push({
              id: `compliance_${control.id}`,
              values: embeddingResult.embedding,
              namespace: 'compliance',
              metadata: {
                recordId: control.id.toString(),
                control_id: control.control_id,
                control_name: control.control_name,
                category: control.category || '',
                priority: control.priority || '',
                framework_name: control.framework_name,
                indexed_at: new Date().toISOString()
              }
            });
            
            this.stats.successful++;
            
          } catch (error: any) {
            console.error(`❌ Failed to process control ${control.id}:`, error.message);
            this.stats.failed++;
          }
        }
        
        if (vectors.length > 0) {
          await this.env.VECTORIZE.insert(vectors);
          console.log(`✅ Indexed ${vectors.length} controls`);
        }
      }
      
      console.log('✅ Compliance control indexing completed');
      return this.stats;
      
    } catch (error: any) {
      console.error('❌ Compliance control indexing failed:', error);
      throw error;
    }
  }

  /**
   * Index all documents from the database
   */
  async indexDocuments(options: BatchIndexOptions = {}): Promise<any> {
    const { batchSize = 10, dryRun = false } = options;
    
    console.log('📄 Starting document indexing...');
    
    try {
      const documentsResult = await this.env.DB.prepare(`
        SELECT id, title, content, document_type, file_path, embedding_status
        FROM rag_documents
        WHERE embedding_status != 'completed'
        ORDER BY id ASC
      `).all();
      
      const documents = documentsResult.results as any[];
      console.log(`Found ${documents.length} documents to index`);
      
      if (dryRun) {
        return { dryRun: true, wouldProcess: documents.length };
      }
      
      for (const document of documents) {
        this.stats.processed++;
        
        try {
          if (!document.content) {
            console.log(`⏭️  Skipping document ${document.id} (no content)`);
            this.stats.skipped++;
            continue;
          }
          
          // Update status to processing
          await this.env.DB.prepare(`
            UPDATE rag_documents SET embedding_status = 'processing' WHERE id = ?
          `).bind(document.id).run();
          
          // Process document with chunking
          const chunks = await this.documentProcessor.processDocument(
            document.id,
            document.content as string,
            {
              title: document.title as string,
              document_type: document.document_type as string,
              file_path: document.file_path as string
            },
            {
              chunkSize: 512,
              chunkOverlap: 50,
              strategy: 'semantic',
              preserveContext: true
            }
          );
          
          // Store chunks
          await this.vectorize.storeDocumentChunks(document.id, chunks);
          
          // Update status to completed
          await this.env.DB.prepare(`
            UPDATE rag_documents 
            SET embedding_status = 'completed', chunk_count = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(chunks.length, document.id).run();
          
          console.log(`✅ Indexed document ${document.id} with ${chunks.length} chunks`);
          this.stats.successful++;
          
        } catch (error: any) {
          console.error(`❌ Failed to process document ${document.id}:`, error.message);
          
          await this.env.DB.prepare(`
            UPDATE rag_documents SET embedding_status = 'failed' WHERE id = ?
          `).bind(document.id).run();
          
          this.stats.failed++;
        }
      }
      
      console.log('✅ Document indexing completed');
      return this.stats;
      
    } catch (error: any) {
      console.error('❌ Document indexing failed:', error);
      throw error;
    }
  }

  /**
   * Index all namespaces
   */
  async indexAll(options: BatchIndexOptions = {}): Promise<any> {
    console.log('🚀 Starting full index of all namespaces...\n');
    
    const results: any = {
      risks: {},
      incidents: {},
      compliance: {},
      documents: {}
    };
    
    try {
      // Reset stats for each namespace
      this.stats = { processed: 0, successful: 0, failed: 0, skipped: 0 };
      results.risks = await this.indexRisks(options);
      
      this.stats = { processed: 0, successful: 0, failed: 0, skipped: 0 };
      results.incidents = await this.indexIncidents(options);
      
      this.stats = { processed: 0, successful: 0, failed: 0, skipped: 0 };
      results.compliance = await this.indexComplianceControls(options);
      
      this.stats = { processed: 0, successful: 0, failed: 0, skipped: 0 };
      results.documents = await this.indexDocuments(options);
      
      console.log('\n✅ Full indexing completed');
      console.log('Summary:');
      console.log(`   Risks: ${results.risks.successful}/${results.risks.processed}`);
      console.log(`   Incidents: ${results.incidents.successful}/${results.incidents.processed}`);
      console.log(`   Compliance: ${results.compliance.successful}/${results.compliance.processed}`);
      console.log(`   Documents: ${results.documents.successful}/${results.documents.processed}`);
      
      return results;
      
    } catch (error: any) {
      console.error('❌ Full indexing failed:', error);
      throw error;
    }
  }

  /**
   * Get indexing statistics
   */
  getStats() {
    return this.stats;
  }
}

/**
 * CLI entry point
 */
export async function runBatchIndexer(env: MCPEnvironment, namespace: string = 'all', options: BatchIndexOptions = {}) {
  const indexer = new BatchIndexer(env);
  
  try {
    switch (namespace.toLowerCase()) {
      case 'risks':
        return await indexer.indexRisks(options);
      
      case 'incidents':
      case 'threats':
        return await indexer.indexIncidents(options);
      
      case 'compliance':
      case 'controls':
        return await indexer.indexComplianceControls(options);
      
      case 'documents':
      case 'docs':
        return await indexer.indexDocuments(options);
      
      case 'all':
      default:
        return await indexer.indexAll(options);
    }
  } catch (error: any) {
    console.error('❌ Batch indexing failed:', error);
    throw error;
  }
}

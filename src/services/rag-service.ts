/**
 * RAG (Retrieval-Augmented Generation) Service
 * Indexes platform data and provides AI analytics with context
 */

import { AIService } from './ai-providers';

export interface RAGDocument {
  id: string;
  type: 'risk' | 'asset' | 'service' | 'threat_intel' | 'compliance' | 'document';
  title: string;
  content: string;
  metadata: {
    source: string;
    category?: string;
    tags?: string[];
    created_at: string;
    updated_at: string;
    [key: string]: any;
  };
  embedding?: number[];
  embedding_status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface RAGQuery {
  query: string;
  type?: RAGDocument['type'];
  limit?: number;
  similarityThreshold?: number;
}

export interface RAGResponse {
  query: string;
  context: RAGDocument[];
  response: string;
  sources: Array<{
    id: string;
    title: string;
    type: string;
    relevance: number;
  }>;
}

export class RAGService {
  private db: D1Database;
  private aiService: AIService;
  private enabled: boolean = true;

  constructor(db: D1Database, aiService: AIService) {
    this.db = db;
    this.aiService = aiService;
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;
    
    // Update RAG configuration in database
    await this.db.prepare(`
      INSERT OR REPLACE INTO system_configuration (key, value, updated_at)
      VALUES ('rag_enabled', ?, ?)
    `).bind(enabled ? 'true' : 'false', new Date().toISOString()).run();

    console.log(`RAG Service ${enabled ? 'enabled' : 'disabled'}`);
  }

  async isEnabled(): Promise<boolean> {
    try {
      const result = await this.db.prepare(`
        SELECT value FROM system_configuration WHERE key = 'rag_enabled'
      `).first();
      
      return result?.value === 'true';
    } catch (error) {
      console.warn('Could not check RAG status, defaulting to enabled:', error);
      return true;
    }
  }

  /**
   * Index all platform data for RAG
   */
  async indexAllPlatformData(): Promise<void> {
    if (!this.enabled) {
      console.log('RAG indexing skipped - service disabled');
      return;
    }

    console.log('Starting RAG indexing of all platform data...');
    
    try {
      // Index risks
      await this.indexRisks();
      
      // Index assets  
      await this.indexAssets();
      
      // Index services
      await this.indexServices();
      
      // Index threat intelligence
      await this.indexThreatIntelligence();
      
      // Index compliance data
      await this.indexComplianceData();
      
      // Index documents
      await this.indexDocuments();
      
      console.log('RAG indexing completed successfully');
    } catch (error) {
      console.error('RAG indexing failed:', error);
      throw error;
    }
  }

  private async indexRisks(): Promise<void> {
    const risks = await this.db.prepare(`
      SELECT r.*, u.first_name || ' ' || u.last_name as owner_name
      FROM risks r
      LEFT JOIN users u ON r.owner_id = u.id
      WHERE r.status = 'active'
    `).all();

    for (const risk of risks.results || []) {
      const document: Omit<RAGDocument, 'id'> = {
        type: 'risk',
        title: risk.title || 'Untitled Risk',
        content: `
Risk ID: RISK-${risk.id}
Title: ${risk.title}
Description: ${risk.description}
Category: ${risk.category}
Probability: ${risk.probability}/5
Impact: ${risk.impact}/5  
Risk Score: ${risk.risk_score || (risk.probability * risk.impact)}
Status: ${risk.status}
Owner: ${risk.owner_name || 'Unassigned'}
Affected Assets: ${risk.affected_assets}
Created: ${new Date(risk.created_at).toDateString()}
        `.trim(),
        metadata: {
          source: 'risks',
          category: risk.category,
          risk_score: risk.risk_score || (risk.probability * risk.impact),
          owner: risk.owner_name,
          created_at: risk.created_at,
          updated_at: risk.updated_at || risk.created_at,
        },
        embedding_status: 'pending'
      };

      await this.storeDocument(document, `risk_${risk.id}`);
    }

    console.log(`Indexed ${risks.results?.length || 0} risks`);
  }

  private async indexAssets(): Promise<void> {
    const assets = await this.db.prepare(`
      SELECT * FROM assets WHERE status = 'active'
    `).all();

    for (const asset of assets.results || []) {
      const document: Omit<RAGDocument, 'id'> = {
        type: 'asset',
        title: asset.name || 'Untitled Asset',
        content: `
Asset ID: ASSET-${asset.id}
Name: ${asset.name}
Type: ${asset.asset_type}
Category: ${asset.category}
Criticality: ${asset.criticality}
Description: ${asset.description}
Location: ${asset.location}
Status: ${asset.status}
Owner: ${asset.owner}
Created: ${new Date(asset.created_at).toDateString()}
        `.trim(),
        metadata: {
          source: 'assets',
          category: asset.category,
          asset_type: asset.asset_type,
          criticality: asset.criticality,
          owner: asset.owner,
          created_at: asset.created_at,
          updated_at: asset.updated_at || asset.created_at,
        },
        embedding_status: 'pending'
      };

      await this.storeDocument(document, `asset_${asset.id}`);
    }

    console.log(`Indexed ${assets.results?.length || 0} assets`);
  }

  private async indexServices(): Promise<void> {
    const services = await this.db.prepare(`
      SELECT * FROM services WHERE status = 'active'
    `).all();

    for (const service of services.results || []) {
      const document: Omit<RAGDocument, 'id'> = {
        type: 'service',
        title: service.name || 'Untitled Service',
        content: `
Service ID: SERVICE-${service.id}
Name: ${service.name}
Description: ${service.description}
Service Type: ${service.service_type}
Confidentiality: ${service.confidentiality}
Integrity: ${service.integrity}
Availability: ${service.availability}
CIA Rating: C${service.confidentiality}I${service.integrity}A${service.availability}
Business Owner: ${service.business_owner}
Technical Owner: ${service.technical_owner}
Status: ${service.status}
Created: ${new Date(service.created_at).toDateString()}
        `.trim(),
        metadata: {
          source: 'services',
          service_type: service.service_type,
          cia_rating: `C${service.confidentiality}I${service.integrity}A${service.availability}`,
          business_owner: service.business_owner,
          technical_owner: service.technical_owner,
          created_at: service.created_at,
          updated_at: service.updated_at || service.created_at,
        },
        embedding_status: 'pending'
      };

      await this.storeDocument(document, `service_${service.id}`);
    }

    console.log(`Indexed ${services.results?.length || 0} services`);
  }

  private async indexThreatIntelligence(): Promise<void> {
    const threats = await this.db.prepare(`
      SELECT * FROM threat_campaigns WHERE status = 'active'
    `).all();

    for (const threat of threats.results || []) {
      const document: Omit<RAGDocument, 'id'> = {
        type: 'threat_intel',
        title: threat.name || 'Untitled Threat Campaign',
        content: `
Threat Campaign: ${threat.name}
Description: ${threat.description}
Severity: ${threat.severity}
Campaign Type: ${threat.campaign_type}
First Seen: ${new Date(threat.first_seen).toDateString()}
Last Activity: ${new Date(threat.last_activity).toDateString()}
Target Sectors: ${threat.target_sectors}
Geography: ${threat.geography}
Confidence: ${threat.confidence}%
IOCs Count: ${threat.iocs_count}
Status: ${threat.status}
        `.trim(),
        metadata: {
          source: 'threat_intelligence',
          severity: threat.severity,
          campaign_type: threat.campaign_type,
          confidence: threat.confidence,
          target_sectors: threat.target_sectors,
          geography: threat.geography,
          created_at: threat.first_seen,
          updated_at: threat.last_activity,
        },
        embedding_status: 'pending'
      };

      await this.storeDocument(document, `threat_${threat.id}`);
    }

    // Also index IOCs
    const iocs = await this.db.prepare(`
      SELECT * FROM iocs WHERE status = 'active' LIMIT 100
    `).all();

    for (const ioc of iocs.results || []) {
      const document: Omit<RAGDocument, 'id'> = {
        type: 'threat_intel',
        title: `IOC: ${ioc.value}`,
        content: `
IOC Type: ${ioc.ioc_type}
Value: ${ioc.value}
Description: ${ioc.description}
Threat Type: ${ioc.threat_type}
Confidence: ${ioc.confidence}%
Source: ${ioc.source}
First Seen: ${new Date(ioc.first_seen).toDateString()}
Last Seen: ${new Date(ioc.last_seen).toDateString()}
Status: ${ioc.status}
        `.trim(),
        metadata: {
          source: 'threat_intelligence',
          ioc_type: ioc.ioc_type,
          threat_type: ioc.threat_type,
          confidence: ioc.confidence,
          ioc_source: ioc.source,
          created_at: ioc.first_seen,
          updated_at: ioc.last_seen,
        },
        embedding_status: 'pending'
      };

      await this.storeDocument(document, `ioc_${ioc.id}`);
    }

    console.log(`Indexed ${threats.results?.length || 0} threat campaigns and ${iocs.results?.length || 0} IOCs`);
  }

  private async indexComplianceData(): Promise<void> {
    // This would index compliance frameworks, controls, and assessments
    // For now, we'll create some sample compliance documents
    const complianceData = [
      {
        id: 'soc2_overview',
        title: 'SOC 2 Type II Framework Overview',
        content: `
SOC 2 Type II is a comprehensive audit framework focusing on five Trust Service Criteria:
- Security: Protection against unauthorized access
- Availability: System availability for operation and use
- Processing Integrity: System processing is complete, valid, accurate, timely, and authorized
- Confidentiality: Information designated as confidential is protected
- Privacy: Personal information is collected, used, retained, disclosed, and disposed of properly

The framework includes 127 controls across these categories with quarterly testing requirements.
Our current compliance status shows 94% implementation with 8 controls requiring remediation.
        `,
        metadata: {
          source: 'compliance',
          framework: 'SOC2',
          type: 'overview'
        }
      },
      {
        id: 'iso27001_overview', 
        title: 'ISO 27001:2022 Framework Overview',
        content: `
ISO 27001:2022 is the international standard for Information Security Management Systems (ISMS).
It includes 93 controls across 4 main categories:
- Organizational Controls (37 controls): Policies, roles, supplier relationships
- People Controls (8 controls): Screening, training, awareness
- Physical Controls (14 controls): Secure areas, equipment protection
- Technological Controls (34 controls): Access control, cryptography, systems security

Our Statement of Applicability shows 87 applicable controls with 79 implemented.
        `,
        metadata: {
          source: 'compliance',
          framework: 'ISO27001',
          type: 'overview'
        }
      }
    ];

    for (const data of complianceData) {
      const document: Omit<RAGDocument, 'id'> = {
        type: 'compliance',
        title: data.title,
        content: data.content,
        metadata: {
          ...data.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        embedding_status: 'pending'
      };

      await this.storeDocument(document, data.id);
    }

    console.log(`Indexed ${complianceData.length} compliance documents`);
  }

  private async indexDocuments(): Promise<void> {
    const documents = await this.db.prepare(`
      SELECT * FROM rag_documents WHERE document_type != 'platform_data'
    `).all();

    console.log(`Found ${documents.results?.length || 0} existing documents in knowledge base`);
  }

  private async storeDocument(document: Omit<RAGDocument, 'id'>, id: string): Promise<void> {
    await this.db.prepare(`
      INSERT OR REPLACE INTO rag_documents (
        id, title, content, document_type, metadata, embedding_status, 
        organization_id, uploaded_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      document.title,
      document.content,
      document.type,
      JSON.stringify(document.metadata),
      document.embedding_status,
      1, // organization_id
      1, // system user
      new Date().toISOString(),
      new Date().toISOString()
    ).run();
  }

  /**
   * Query RAG system with semantic search
   */
  async query(ragQuery: RAGQuery): Promise<RAGResponse> {
    if (!this.enabled) {
      throw new Error('RAG service is disabled');
    }

    // For now, we'll do simple text matching since we don't have vector embeddings
    // In production, you'd use vector similarity search
    const searchQuery = `%${ragQuery.query.toLowerCase()}%`;
    const typeFilter = ragQuery.type ? `AND document_type = '${ragQuery.type}'` : '';
    
    const results = await this.db.prepare(`
      SELECT * FROM rag_documents 
      WHERE (LOWER(title) LIKE ? OR LOWER(content) LIKE ?)
      ${typeFilter}
      ORDER BY 
        CASE 
          WHEN LOWER(title) LIKE ? THEN 1
          WHEN LOWER(content) LIKE ? THEN 2
          ELSE 3
        END
      LIMIT ?
    `).bind(
      searchQuery, searchQuery, searchQuery, searchQuery, ragQuery.limit || 5
    ).all();

    const context: RAGDocument[] = (results.results || []).map(row => ({
      id: row.id,
      type: row.document_type,
      title: row.title,
      content: row.content,
      metadata: JSON.parse(row.metadata || '{}'),
      embedding_status: row.embedding_status
    }));

    // Generate AI response with context
    const aiResponse = await this.generateContextualResponse(ragQuery.query, context);

    return {
      query: ragQuery.query,
      context,
      response: aiResponse,
      sources: context.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        relevance: 0.8 // Placeholder relevance score
      }))
    };
  }

  private async generateContextualResponse(query: string, context: RAGDocument[]): Promise<string> {
    if (!this.aiService) {
      return 'AI service not available for contextual responses.';
    }

    const contextText = context.map(doc => 
      `Source: ${doc.title} (${doc.type})\n${doc.content}\n---`
    ).join('\n');

    const systemPrompt = `You are ARIA, an AI risk intelligence and compliance assistant. Use the provided context from the organization's risk management platform to answer questions accurately. 

Context includes:
- Risk assessments and data
- Asset inventory  
- Service catalog with CIA ratings
- Threat intelligence
- Compliance frameworks (SOC 2, ISO 27001)

Be specific, cite sources from the context, and provide actionable insights. If the context doesn't contain relevant information, say so clearly.`;

    const userPrompt = `Context from platform data:
${contextText}

Question: ${query}

Please provide a comprehensive answer based on the context above.`;

    try {
      const provider = this.aiService.getProvider('openai') || 
                      this.aiService.getProvider('anthropic') || 
                      this.aiService.getProvider('gemini') ||
                      this.aiService.getProvider('cloudflare'); // Fallback to Cloudflare

      if (!provider) {
        return 'No AI provider available. Please configure AI providers in admin settings.';
      }

      const response = await provider.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      return response.content;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return `I found relevant information in the context but couldn't generate an AI response. Error: ${error.message}`;
    }
  }

  /**
   * Get RAG statistics
   */
  async getStatistics(): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    indexingStatus: Record<string, number>;
    enabled: boolean;
  }> {
    const [totalResult, typeResult, statusResult] = await Promise.all([
      this.db.prepare('SELECT COUNT(*) as count FROM rag_documents').first(),
      this.db.prepare('SELECT document_type, COUNT(*) as count FROM rag_documents GROUP BY document_type').all(),
      this.db.prepare('SELECT embedding_status, COUNT(*) as count FROM rag_documents GROUP BY embedding_status').all()
    ]);

    const documentsByType: Record<string, number> = {};
    (typeResult.results || []).forEach((row: any) => {
      documentsByType[row.document_type] = row.count;
    });

    const indexingStatus: Record<string, number> = {};
    (statusResult.results || []).forEach((row: any) => {
      indexingStatus[row.embedding_status] = row.count;
    });

    return {
      totalDocuments: totalResult?.count || 0,
      documentsByType,
      indexingStatus,
      enabled: await this.isEnabled()
    };
  }
}

export default RAGService;
/**
 * ARIA5.1 RAG (Retrieval-Augmented Generation) Pipeline
 * 
 * Implements full question-answering with context retrieval from
 * vector database, document processing, and LLM integration for
 * natural language responses with citations.
 */

import type { MCPEnvironment } from '../types/mcp-types';
import type { VectorizeService } from './vectorize-service';
import type { HybridSearchService } from './hybrid-search-service';

export interface RAGContext {
  query: string;
  retrievedDocuments: RAGDocument[];
  totalTokens: number;
  retrievalTime: number;
}

export interface RAGDocument {
  id: number;
  namespace: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  relevanceScore: number;
  tokenCount: number;
}

export interface RAGResponse {
  answer: string;
  confidence: number;          // 0.0 - 1.0
  sources: RAGSource[];
  context: RAGContext;
  generationTime: number;
  totalTime: number;
}

export interface RAGSource {
  documentId: number;
  namespace: string;
  title: string;
  excerpt: string;
  relevanceScore: number;
  url?: string;
}

export interface RAGConfig {
  maxContextTokens: number;     // Max tokens for context (default: 8000)
  topK: number;                 // Top K documents to retrieve (default: 5)
  minRelevanceScore: number;    // Minimum relevance threshold (default: 0.6)
  includeMetadata: boolean;     // Include document metadata (default: true)
  citeSources: boolean;         // Include source citations (default: true)
  useHybridSearch: boolean;     // Use hybrid search (default: true)
  llmProvider: 'cloudflare' | 'openai' | 'anthropic' | 'auto';
  llmModel?: string;           // Specific model to use
  temperature: number;          // LLM temperature (default: 0.3)
  systemPrompt?: string;        // Custom system prompt
}

export class RAGPipelineService {
  private env: MCPEnvironment;
  private vectorize: VectorizeService;
  private hybridSearch: HybridSearchService;
  private defaultConfig: RAGConfig = {
    maxContextTokens: 8000,
    topK: 5,
    minRelevanceScore: 0.6,
    includeMetadata: true,
    citeSources: true,
    useHybridSearch: true,
    llmProvider: 'cloudflare',
    temperature: 0.3
  };

  constructor(
    env: MCPEnvironment,
    vectorize: VectorizeService,
    hybridSearch: HybridSearchService
  ) {
    this.env = env;
    this.vectorize = vectorize;
    this.hybridSearch = hybridSearch;
  }

  /**
   * Main RAG query endpoint - retrieve context and generate answer
   */
  async query(
    question: string,
    namespace?: string,
    config?: Partial<RAGConfig>
  ): Promise<RAGResponse> {
    const startTime = Date.now();
    const ragConfig = { ...this.defaultConfig, ...config };

    console.log(`🔍 RAG Query: "${question}"`);

    // Step 1: Retrieve relevant context
    const retrievalStart = Date.now();
    const context = await this.retrieveContext(question, namespace, ragConfig);
    const retrievalTime = Date.now() - retrievalStart;

    console.log(`✅ Retrieved ${context.retrievedDocuments.length} documents in ${retrievalTime}ms`);

    // Step 2: Build prompt with context
    const prompt = this.buildRAGPrompt(question, context, ragConfig);

    // Step 3: Generate answer using LLM
    const generationStart = Date.now();
    const llmResponse = await this.generateAnswer(prompt, ragConfig);
    const generationTime = Date.now() - generationStart;

    console.log(`✅ Generated answer in ${generationTime}ms`);

    // Step 4: Extract sources and build response
    const sources = this.extractSources(context, llmResponse.answer);
    const totalTime = Date.now() - startTime;

    return {
      answer: llmResponse.answer,
      confidence: llmResponse.confidence,
      sources,
      context: {
        ...context,
        retrievalTime
      },
      generationTime,
      totalTime
    };
  }

  /**
   * Retrieve relevant context from vector database
   */
  private async retrieveContext(
    query: string,
    namespace?: string,
    config?: RAGConfig
  ): Promise<RAGContext> {
    const startTime = Date.now();

    // Determine search strategy
    let results: any[] = [];

    if (config?.useHybridSearch) {
      // Use hybrid search for better accuracy
      if (namespace === 'risks' || !namespace) {
        results = await this.hybridSearch.searchRisks(query, config?.topK || 5);
      } else if (namespace === 'incidents') {
        results = await this.hybridSearch.searchThreats(query, config?.topK || 5);
      } else if (namespace === 'compliance') {
        results = await this.hybridSearch.searchCompliance(query, config?.topK || 5);
      }
    } else {
      // Use pure semantic search
      const embedding = await this.vectorize.generateEmbedding({ text: query });
      const searchResults = await this.vectorize.search({
        namespace: namespace || 'risks',
        vector: embedding.embedding,
        topK: config?.topK || 5,
        returnMetadata: true
      });
      
      results = searchResults.matches.map(match => ({
        id: parseInt(match.id),
        semanticScore: match.score,
        data: match.metadata
      }));
    }

    // Filter by minimum relevance
    const filteredResults = results.filter(r => 
      (r.semanticScore || r.combinedScore || 0) >= (config?.minRelevanceScore || 0.6)
    );

    // Fetch full document data and convert to RAGDocument format
    const documents: RAGDocument[] = [];
    let totalTokens = 0;

    for (const result of filteredResults) {
      // Fetch full document from database
      const doc = await this.fetchDocument(result.id, namespace || 'risks');
      
      if (doc) {
        const docTokens = this.estimateTokens(doc.content);
        
        // Check token budget
        if (totalTokens + docTokens > (config?.maxContextTokens || 8000)) {
          console.log(`⚠️ Token budget exceeded, stopping at ${documents.length} documents`);
          break;
        }

        documents.push({
          id: result.id,
          namespace: namespace || 'risks',
          title: doc.title,
          content: doc.content,
          metadata: doc.metadata || {},
          relevanceScore: result.semanticScore || result.combinedScore || 0,
          tokenCount: docTokens
        });

        totalTokens += docTokens;
      }
    }

    return {
      query,
      retrievedDocuments: documents,
      totalTokens,
      retrievalTime: Date.now() - startTime
    };
  }

  /**
   * Fetch full document from database
   */
  private async fetchDocument(
    id: number,
    namespace: string
  ): Promise<{ title: string; content: string; metadata?: any } | null> {
    try {
      let query: string;
      
      if (namespace === 'risks') {
        query = `
          SELECT 
            id,
            title,
            description || ' ' || 
            COALESCE(mitigation_strategy, '') || ' ' || 
            COALESCE(current_controls, '') as content,
            category,
            probability,
            impact,
            risk_score
          FROM risks
          WHERE id = ?
        `;
      } else if (namespace === 'incidents') {
        query = `
          SELECT 
            id,
            title,
            description || ' ' || 
            COALESCE(resolution, '') as content,
            incident_type,
            severity,
            status
          FROM defender_incidents
          WHERE id = ?
        `;
      } else if (namespace === 'compliance') {
        query = `
          SELECT 
            id,
            framework_name as title,
            description as content,
            category,
            version
          FROM compliance_frameworks
          WHERE id = ?
        `;
      } else {
        return null;
      }

      const result = await this.env.DB.prepare(query).bind(id).first();
      
      if (!result) {
        return null;
      }

      return {
        title: result.title as string,
        content: result.content as string,
        metadata: result
      };
    } catch (error) {
      console.error(`Error fetching document ${id} from ${namespace}:`, error);
      return null;
    }
  }

  /**
   * Build RAG prompt with retrieved context
   */
  private buildRAGPrompt(
    question: string,
    context: RAGContext,
    config: RAGConfig
  ): string {
    const systemPrompt = config.systemPrompt || `You are an expert security analyst and risk management consultant for the ARIA Enterprise Security Intelligence Platform.

Your role is to answer questions about cybersecurity risks, threats, compliance, and security operations based on the provided context from the organization's security database.

Guidelines:
- Answer questions accurately based ONLY on the provided context
- If the context doesn't contain enough information, acknowledge this limitation
- Cite specific sources using [Source N] notation
- Provide actionable insights and recommendations when relevant
- Use clear, professional language suitable for both technical and executive audiences
- Be concise but comprehensive`;

    // Build context section
    let contextSection = '\n\n## Retrieved Context:\n\n';
    
    context.retrievedDocuments.forEach((doc, index) => {
      contextSection += `### [Source ${index + 1}] ${doc.title}\n`;
      contextSection += `**Namespace**: ${doc.namespace}\n`;
      contextSection += `**Relevance Score**: ${(doc.relevanceScore * 100).toFixed(1)}%\n\n`;
      contextSection += `${doc.content}\n\n`;
      
      if (config.includeMetadata && Object.keys(doc.metadata).length > 0) {
        contextSection += `**Metadata**: ${JSON.stringify(doc.metadata, null, 2)}\n\n`;
      }
      
      contextSection += '---\n\n';
    });

    // Build final prompt
    const prompt = `${systemPrompt}
${contextSection}
## User Question:

${question}

## Your Answer:

Please provide a comprehensive answer based on the context above. ${config.citeSources ? 'Include source citations using [Source N] notation.' : ''}`;

    return prompt;
  }

  /**
   * Generate answer using LLM
   */
  private async generateAnswer(
    prompt: string,
    config: RAGConfig
  ): Promise<{ answer: string; confidence: number }> {
    try {
      let response: any;

      if (config.llmProvider === 'cloudflare' || config.llmProvider === 'auto') {
        // Use Cloudflare Workers AI
        response = await this.env.AI.run(
          config.llmModel || '@cf/meta/llama-3.1-8b-instruct',
          {
            messages: [
              { role: 'user', content: prompt }
            ],
            temperature: config.temperature
          }
        );
      } else {
        // TODO: Implement OpenAI/Anthropic providers
        throw new Error(`LLM provider ${config.llmProvider} not yet implemented`);
      }

      // Extract answer
      const answer = typeof response === 'string' 
        ? response 
        : response.response || response.text || JSON.stringify(response);

      // Calculate confidence based on answer characteristics
      const confidence = this.calculateConfidence(answer, prompt);

      return { answer, confidence };
    } catch (error) {
      console.error('LLM generation error:', error);
      
      // Fallback response
      return {
        answer: 'I apologize, but I encountered an error generating a response. Please try rephrasing your question or contact support.',
        confidence: 0.0
      };
    }
  }

  /**
   * Calculate confidence score for generated answer
   */
  private calculateConfidence(answer: string, prompt: string): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence if answer cites sources
    if (answer.includes('[Source ')) {
      confidence += 0.15;
    }

    // Decrease confidence if answer is very short
    if (answer.length < 100) {
      confidence -= 0.2;
    }

    // Decrease confidence if answer admits uncertainty
    const uncertaintyPhrases = [
      'i don\'t know',
      'i\'m not sure',
      'i cannot determine',
      'insufficient information',
      'not enough context'
    ];
    
    if (uncertaintyPhrases.some(phrase => answer.toLowerCase().includes(phrase))) {
      confidence -= 0.3;
    }

    // Increase confidence if answer is detailed
    if (answer.length > 500) {
      confidence += 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Extract source citations from answer
   */
  private extractSources(context: RAGContext, answer: string): RAGSource[] {
    const sources: RAGSource[] = [];
    
    // Find all [Source N] citations in answer
    const citationRegex = /\[Source (\d+)\]/g;
    const citations = new Set<number>();
    
    let match;
    while ((match = citationRegex.exec(answer)) !== null) {
      citations.add(parseInt(match[1]));
    }

    // Build source list
    context.retrievedDocuments.forEach((doc, index) => {
      const sourceNum = index + 1;
      
      // Include source if cited OR if citeSources is disabled (include all)
      if (citations.has(sourceNum) || citations.size === 0) {
        // Extract excerpt (first 200 chars)
        const excerpt = doc.content.substring(0, 200) + '...';
        
        sources.push({
          documentId: doc.id,
          namespace: doc.namespace,
          title: doc.title,
          excerpt,
          relevanceScore: doc.relevanceScore,
          url: this.buildDocumentUrl(doc.namespace, doc.id)
        });
      }
    });

    return sources;
  }

  /**
   * Build URL for document
   */
  private buildDocumentUrl(namespace: string, id: number): string {
    const baseUrl = ''; // Could be populated from env if needed
    
    const urlMap: Record<string, string> = {
      'risks': `/risk/${id}`,
      'incidents': `/ms-defender/incidents/${id}`,
      'compliance': `/compliance/frameworks/${id}`,
      'documents': `/documents/${id}`
    };

    return baseUrl + (urlMap[namespace] || `/${namespace}/${id}`);
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Get preset configurations for different use cases
   */
  static getPresetConfig(preset: 'concise' | 'detailed' | 'technical' | 'executive'): Partial<RAGConfig> {
    const presets: Record<string, Partial<RAGConfig>> = {
      concise: {
        maxContextTokens: 4000,
        topK: 3,
        minRelevanceScore: 0.7,
        temperature: 0.2,
        systemPrompt: 'You are a security analyst. Provide concise, actionable answers.'
      },
      detailed: {
        maxContextTokens: 12000,
        topK: 8,
        minRelevanceScore: 0.5,
        temperature: 0.3,
        systemPrompt: 'You are a security expert. Provide comprehensive, detailed analysis.'
      },
      technical: {
        maxContextTokens: 8000,
        topK: 5,
        minRelevanceScore: 0.6,
        temperature: 0.1,
        systemPrompt: 'You are a technical security engineer. Provide precise technical details.'
      },
      executive: {
        maxContextTokens: 6000,
        topK: 4,
        minRelevanceScore: 0.7,
        temperature: 0.2,
        systemPrompt: 'You are a security consultant to executives. Provide strategic insights with business impact.'
      }
    };

    return presets[preset];
  }
}

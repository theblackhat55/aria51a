/**
 * ARIA 5.1 MCP RAG (Retrieval-Augmented Generation) Pipeline
 * 
 * Implements full question-answering pipeline with:
 * 1. Context retrieval using hybrid search
 * 2. LLM integration for natural language responses
 * 3. Answer generation with citations
 * 
 * Phase 4.3 Implementation
 */

import type { MCPEnvironment } from '../types/mcp-types';
import { HybridSearchService, type HybridSearchResult } from './hybrid-search-service';
import { AIProviderService } from '../../lib/ai-providers';

export interface RAGQuery {
  question: string;
  namespace?: string | string[]; // Single or multiple namespaces
  contextDepth?: number; // Number of context documents to retrieve
  modelProvider?: string; // AI provider to use
  temperature?: number; // LLM temperature
  includeSteps?: boolean; // Include reasoning steps in response
  includeCitations?: boolean; // Include source citations
}

export interface RAGResponse {
  answer: string;
  confidence: number;
  sources: RAGSource[];
  reasoning?: string[];
  query: string;
  tokensUsed?: number;
  responseTime: number;
  modelUsed: string;
}

export interface RAGSource {
  id: string;
  namespace: string;
  title: string;
  relevanceScore: number;
  excerpt: string;
  metadata: Record<string, any>;
}

/**
 * RAG Pipeline Service
 * 
 * Provides intelligent question-answering by:
 * 1. Retrieving relevant context from multiple namespaces
 * 2. Constructing optimized prompts with context
 * 3. Generating answers using configured AI providers
 * 4. Post-processing and citation extraction
 */
export class RAGPipelineService {
  private env: MCPEnvironment;
  private hybridSearch: HybridSearchService;
  private aiService: AIProviderService;

  constructor(env: MCPEnvironment) {
    this.env = env;
    this.hybridSearch = new HybridSearchService(env);
    this.aiService = new AIProviderService(env.DB, env);
  }

  /**
   * Process RAG query and generate answer
   */
  async query(query: RAGQuery): Promise<RAGResponse> {
    const startTime = Date.now();
    console.log(`🧠 RAG Query: "${query.question}"`);

    try {
      // Step 1: Retrieve relevant context
      const context = await this.retrieveContext(query);
      console.log(`   Retrieved ${context.length} context documents`);

      // Step 2: Build optimized prompt
      const prompt = this.buildPrompt(query, context);
      
      // Step 3: Generate answer using AI
      const aiResponse = await this.generateAnswer(prompt, query);
      console.log(`   Generated answer (${aiResponse.tokensUsed} tokens)`);

      // Step 4: Post-process and add citations
      const answer = this.postProcessAnswer(aiResponse.answer, context, query);

      // Step 5: Build response
      const response: RAGResponse = {
        answer: answer.text,
        confidence: this.calculateConfidence(context, aiResponse),
        sources: this.buildSources(context, query.includeCitations !== false),
        query: query.question,
        tokensUsed: aiResponse.tokensUsed,
        responseTime: Date.now() - startTime,
        modelUsed: aiResponse.model
      };

      if (query.includeSteps) {
        response.reasoning = this.extractReasoningSteps(aiResponse.answer);
      }

      return response;
    } catch (error) {
      console.error('RAG query error:', error);
      throw new Error(`RAG pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve relevant context using hybrid search
   */
  private async retrieveContext(query: RAGQuery): Promise<HybridSearchResult[]> {
    const namespaces = Array.isArray(query.namespace) 
      ? query.namespace 
      : [query.namespace || 'risks'];
    
    const contextDepth = query.contextDepth || 5;
    const allResults: HybridSearchResult[] = [];

    // Search across all specified namespaces
    for (const namespace of namespaces) {
      try {
        const results = await this.hybridSearch.search({
          query: query.question,
          namespace,
          topK: contextDepth
        });
        allResults.push(...results);
      } catch (error) {
        console.error(`Context retrieval error for namespace ${namespace}:`, error);
      }
    }

    // Sort by relevance across all namespaces
    allResults.sort((a, b) => b.score - a.score);

    // Return top K results
    return allResults.slice(0, contextDepth * namespaces.length);
  }

  /**
   * Build optimized prompt with context
   */
  private buildPrompt(query: RAGQuery, context: HybridSearchResult[]): string {
    // System prompt
    const systemPrompt = `You are an AI security intelligence assistant for the ARIA GRC platform. 
Your role is to provide accurate, helpful answers based on the provided context from our security database.

Key Guidelines:
- Base your answers primarily on the provided context
- If the context doesn't contain enough information, acknowledge the limitation
- Cite specific sources when making claims
- Provide actionable recommendations when appropriate
- Use security industry best practices
- Be concise but comprehensive`;

    // Context section
    const contextSection = context.length > 0 
      ? `\n\nRelevant Context from Security Database:\n\n${context.map((doc, idx) => {
          const metadata = doc.metadata;
          const title = metadata.title || metadata.control_name || `Document ${doc.id}`;
          const content = metadata.description || metadata.content || '';
          return `[Source ${idx + 1}] ${title}\n${content}\nRelevance: ${(doc.score * 100).toFixed(1)}%\n`;
        }).join('\n')}`
      : '\n\nNo directly relevant context found in database.';

    // Question section
    const questionSection = `\n\nUser Question: ${query.question}`;

    // Instructions
    const instructions = query.includeCitations !== false
      ? `\n\nInstructions: Answer the question based on the context provided. Include citations to specific sources using [Source N] notation.`
      : `\n\nInstructions: Answer the question based on the context provided.`;

    return systemPrompt + contextSection + questionSection + instructions;
  }

  /**
   * Generate answer using AI provider
   */
  private async generateAnswer(
    prompt: string,
    query: RAGQuery
  ): Promise<{ answer: string; tokensUsed: number; model: string }> {
    try {
      // Initialize AI service
      await this.aiService.initialize();

      // Generate completion
      const response = await this.aiService.generateCompletion(
        prompt,
        query.modelProvider,
        {
          temperature: query.temperature || 0.7,
          max_tokens: 1500,
          top_p: 0.9
        }
      );

      return {
        answer: response.content,
        tokensUsed: response.usage?.total_tokens || 0,
        model: response.model || 'unknown'
      };
    } catch (error) {
      console.error('AI generation error:', error);
      
      // Fallback to intelligent response based on context
      return {
        answer: this.generateFallbackAnswer(prompt, query),
        tokensUsed: 0,
        model: 'fallback-rules-engine'
      };
    }
  }

  /**
   * Generate fallback answer when AI fails
   */
  private generateFallbackAnswer(prompt: string, query: RAGQuery): string {
    // Extract context from prompt
    const contextMatch = prompt.match(/Relevant Context from Security Database:(.*?)User Question:/s);
    
    if (contextMatch) {
      const context = contextMatch[1];
      const sourceCount = (context.match(/\[Source \d+\]/g) || []).length;
      
      if (sourceCount > 0) {
        return `Based on ${sourceCount} relevant source${sourceCount > 1 ? 's' : ''} in our security database:\n\n` +
               `I found information related to your question "${query.question}". ` +
               `The context suggests multiple relevant security controls, risks, or documents. ` +
               `For detailed information, please review the cited sources below.\n\n` +
               `Note: This is a fallback response. For AI-generated insights, please configure an AI provider in Admin Settings.`;
      }
    }

    return `I understand you're asking about: "${query.question}"\n\n` +
           `However, I couldn't find directly relevant information in our security database. ` +
           `This could mean:\n` +
           `- The topic isn't currently covered in our risk register or compliance frameworks\n` +
           `- The question requires rephrasing for better matching\n` +
           `- Additional data needs to be imported into the system\n\n` +
           `Please try:\n` +
           `1. Rephrasing your question with more specific keywords\n` +
           `2. Searching in a different namespace (risks, compliance, incidents)\n` +
           `3. Contacting your security team for manual assistance`;
  }

  /**
   * Post-process answer and add citations
   */
  private postProcessAnswer(
    answer: string,
    context: HybridSearchResult[],
    query: RAGQuery
  ): { text: string; citations: number[] } {
    const citations: number[] = [];

    // Extract citation references
    const citationRegex = /\[Source (\d+)\]/g;
    let match;
    while ((match = citationRegex.exec(answer)) !== null) {
      citations.push(parseInt(match[1]));
    }

    return {
      text: answer,
      citations
    };
  }

  /**
   * Build source citations
   */
  private buildSources(
    context: HybridSearchResult[],
    includeCitations: boolean
  ): RAGSource[] {
    if (!includeCitations) {
      return [];
    }

    return context.map((doc, idx) => {
      const metadata = doc.metadata;
      const title = metadata.title || metadata.control_name || `Document ${doc.id}`;
      const description = metadata.description || metadata.content || '';
      
      // Extract first 200 chars as excerpt
      const excerpt = description.length > 200 
        ? description.substring(0, 200) + '...'
        : description;

      return {
        id: doc.id,
        namespace: metadata.category || metadata.framework || 'unknown',
        title,
        relevanceScore: doc.score,
        excerpt,
        metadata: {
          semanticScore: doc.semanticScore,
          keywordScore: doc.keywordScore,
          fusionMethod: doc.fusionMethod
        }
      };
    });
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    context: HybridSearchResult[],
    aiResponse: { answer: string; tokensUsed: number; model: string }
  ): number {
    // Base confidence on multiple factors
    let confidence = 0.5; // Start at 50%

    // Factor 1: Context relevance (0-30%)
    if (context.length > 0) {
      const avgRelevance = context.reduce((sum, doc) => sum + doc.score, 0) / context.length;
      confidence += avgRelevance * 0.3;
    }

    // Factor 2: Number of sources (0-10%)
    const sourceBonus = Math.min(context.length / 10, 1) * 0.1;
    confidence += sourceBonus;

    // Factor 3: Answer length (0-10%)
    if (aiResponse.answer.length > 100 && aiResponse.answer.length < 2000) {
      confidence += 0.1;
    }

    // Factor 4: Model quality (0-10%)
    if (aiResponse.model.includes('gpt-4') || aiResponse.model.includes('claude-3')) {
      confidence += 0.1;
    } else if (aiResponse.model.includes('gpt-3.5') || aiResponse.model.includes('llama')) {
      confidence += 0.05;
    }

    // Clamp between 0-1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Extract reasoning steps from answer
   */
  private extractReasoningSteps(answer: string): string[] {
    const steps: string[] = [];

    // Look for numbered lists or step patterns
    const patterns = [
      /\d+\.\s+(.+?)(?=\n\d+\.|\n\n|$)/gs,
      /Step \d+:\s+(.+?)(?=\nStep \d+:|\n\n|$)/gs,
      /First,?\s+(.+?)(?=\nSecond,?|\nNext,?|\n\n|$)/s,
      /Second,?\s+(.+?)(?=\nThird,?|\nThen,?|\n\n|$)/s
    ];

    for (const pattern of patterns) {
      const matches = answer.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          steps.push(match[1].trim());
        }
      }
      if (steps.length > 0) break;
    }

    // If no structured steps found, create high-level steps
    if (steps.length === 0) {
      const sentences = answer.split(/\. /).filter(s => s.length > 20);
      steps.push(...sentences.slice(0, 3).map(s => s.trim()));
    }

    return steps;
  }

  /**
   * Batch query processing for multiple questions
   */
  async batchQuery(queries: RAGQuery[]): Promise<RAGResponse[]> {
    const responses: RAGResponse[] = [];

    for (const query of queries) {
      try {
        const response = await this.query(query);
        responses.push(response);
      } catch (error) {
        console.error(`Batch query error for: ${query.question}`, error);
        responses.push({
          answer: `Error processing question: ${error instanceof Error ? error.message : 'Unknown error'}`,
          confidence: 0,
          sources: [],
          query: query.question,
          responseTime: 0,
          modelUsed: 'error'
        });
      }
    }

    return responses;
  }

  /**
   * Stream answer generation (for real-time responses)
   */
  async *streamQuery(query: RAGQuery): AsyncGenerator<string, void, unknown> {
    // Retrieve context
    const context = await this.retrieveContext(query);
    
    // Build prompt
    const prompt = this.buildPrompt(query, context);
    
    // Stream from AI service if available
    yield `Analyzing question: "${query.question}"\n\n`;
    yield `Found ${context.length} relevant sources...\n\n`;
    
    try {
      const response = await this.generateAnswer(prompt, query);
      yield response.answer;
    } catch (error) {
      yield this.generateFallbackAnswer(prompt, query);
    }
  }
}

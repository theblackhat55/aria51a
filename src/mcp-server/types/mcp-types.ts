/**
 * MCP (Model Context Protocol) Type Definitions for ARIA5.1
 * 
 * This file defines the core types for the MCP server implementation
 * that provides semantic search and RAG capabilities.
 */

import { D1Database } from '@cloudflare/workers-types';

// ========================================
// Core MCP Environment
// ========================================

export interface MCPEnvironment {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  AI: any; // Cloudflare Workers AI binding
  R2: R2Bucket;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_AI_API_KEY?: string;
}

export interface VectorizeIndex {
  query(vector: number[], options?: VectorizeQueryOptions): Promise<VectorizeMatches>;
  insert(vectors: VectorizeVector[]): Promise<VectorizeInsertResult>;
  upsert(vectors: VectorizeVector[]): Promise<VectorizeInsertResult>;
  getByIds(ids: string[]): Promise<VectorizeVector[]>;
  deleteByIds(ids: string[]): Promise<void>;
}

export interface VectorizeQueryOptions {
  topK?: number;
  filter?: Record<string, any>;
  returnValues?: boolean;
  returnMetadata?: boolean;
}

export interface VectorizeMatches {
  matches: VectorizeMatch[];
  count: number;
}

export interface VectorizeMatch {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, any>;
}

export interface VectorizeVector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
  namespace?: string;
}

export interface VectorizeInsertResult {
  ids: string[];
  count: number;
}

export interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(key: string, value: string | ArrayBuffer, options?: R2PutOptions): Promise<R2Object>;
  delete(key: string): Promise<void>;
  list(options?: R2ListOptions): Promise<R2ObjectList>;
}

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  uploaded: Date;
  body: ReadableStream;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface R2PutOptions {
  httpMetadata?: {
    contentType?: string;
  };
  customMetadata?: Record<string, string>;
}

export interface R2ListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface R2ObjectList {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}

// ========================================
// MCP Tool Definitions
// ========================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: MCPToolInputSchema;
  execute: (args: any, env: MCPEnvironment) => Promise<any>;
}

export interface MCPToolInputSchema {
  type: 'object';
  properties: Record<string, MCPToolProperty>;
  required?: string[];
}

export interface MCPToolProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  items?: MCPToolProperty;
  properties?: Record<string, MCPToolProperty>;
  enum?: any[];
  default?: any;
}

// ========================================
// MCP Resource Definitions
// ========================================

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  fetch: (env: MCPEnvironment) => Promise<MCPResourceContent>;
}

export interface MCPResourceContent {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: ArrayBuffer;
  metadata?: Record<string, any>;
}

// ========================================
// MCP Prompt Definitions
// ========================================

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: MCPPromptArgument[];
  template: (args: Record<string, any>) => string;
}

export interface MCPPromptArgument {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean';
}

// ========================================
// Semantic Search Types
// ========================================

export interface SemanticSearchOptions {
  query: string;
  topK?: number;
  filters?: SearchFilters;
  namespace?: string;
  includeMetadata?: boolean;
}

export interface SearchFilters {
  category?: string[];
  severity?: string[];
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  customFilters?: Record<string, any>;
}

export interface SemanticSearchResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
  source: string;
}

// ========================================
// Document Processing Types
// ========================================

export interface DocumentChunk {
  id: string;
  documentId: number;
  chunkIndex: number;
  content: string;
  embedding?: number[];
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  documentType: string;
  title: string;
  pageNumber?: number;
  section?: string;
  startChar: number;
  endChar: number;
  tokens: number;
  createdAt: string;
}

export interface DocumentProcessingOptions {
  chunkSize: number;
  chunkOverlap: number;
  strategy: 'fixed' | 'semantic' | 'paragraph';
  preserveContext: boolean;
}

// ========================================
// Correlation Types
// ========================================

export interface CorrelationRequest {
  entityId: number;
  entityType: 'risk' | 'threat' | 'asset' | 'control' | 'incident';
  includeRelated: boolean;
  maxDepth: number;
}

export interface CorrelationResult {
  entity: any;
  relatedRisks: RelatedEntity[];
  relatedThreats: RelatedEntity[];
  relatedAssets: RelatedEntity[];
  relatedControls: RelatedEntity[];
  correlationScore: number;
  recommendations: string[];
}

export interface RelatedEntity {
  id: number;
  type: string;
  name: string;
  relevanceScore: number;
  metadata: Record<string, any>;
}

// ========================================
// Embedding Types
// ========================================

export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  tokensUsed: number;
}

// ========================================
// Query Optimization Types
// ========================================

export interface QueryIntent {
  primaryIntent: 'search' | 'correlate' | 'analyze' | 'recommend';
  entityTypes: string[];
  filters: SearchFilters;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface OptimizedQuery {
  semantic: {
    query: string;
    namespaces: string[];
    topK: number;
  };
  structured: {
    tables: string[];
    filters: Record<string, any>;
    joins: string[];
  };
  aggregations: string[];
}

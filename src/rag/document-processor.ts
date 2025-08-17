// Document Processing and Chunking System
// Handles text extraction, chunking, and preparation for RAG

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source_id: string;
    source_type: string;
    chunk_index: number;
    total_chunks: number;
    title: string;
    start_char: number;
    end_char: number;
    token_count: number;
  };
}

export interface ChunkingOptions {
  maxTokens?: number;
  overlapTokens?: number;
  preserveSentences?: boolean;
  minChunkSize?: number;
}

export interface ProcessingResult {
  chunks: DocumentChunk[];
  metadata: {
    total_chars: number;
    total_tokens: number;
    total_chunks: number;
    processing_time: number;
  };
}

export class DocumentProcessor {
  constructor() {}

  // Process GRC entity (risk, incident, service, asset) into chunks
  async processGRCEntity(
    entity: any,
    entityType: 'risk' | 'incident' | 'service' | 'asset',
    options: ChunkingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    // Extract text content from entity
    const textContent = this.extractGRCEntityContent(entity, entityType);
    
    // Create chunks
    const chunks = await this.chunkText(textContent, {
      sourceId: entity.id || entity.risk_id || entity.incident_id || 'unknown',
      sourceType: entityType,
      title: entity.title || entity.name || `${entityType} ${entity.id}`,
      ...options
    });

    return {
      chunks,
      metadata: {
        total_chars: textContent.length,
        total_tokens: this.estimateTokens(textContent),
        total_chunks: chunks.length,
        processing_time: Date.now() - startTime
      }
    };
  }

  // Process uploaded document
  async processDocument(
    file: File | { name: string; content: string },
    options: ChunkingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    let textContent: string;
    let fileName: string;

    if (file instanceof File) {
      textContent = await this.extractTextFromFile(file);
      fileName = file.name;
    } else {
      textContent = file.content;
      fileName = file.name;
    }

    // Create chunks
    const chunks = await this.chunkText(textContent, {
      sourceId: this.generateDocumentId(fileName),
      sourceType: 'document',
      title: fileName,
      ...options
    });

    return {
      chunks,
      metadata: {
        total_chars: textContent.length,
        total_tokens: this.estimateTokens(textContent),
        total_chunks: chunks.length,
        processing_time: Date.now() - startTime
      }
    };
  }

  // Chunk text into manageable pieces
  async chunkText(
    text: string,
    metadata: {
      sourceId: string;
      sourceType: string;
      title: string;
    },
    options: ChunkingOptions = {}
  ): Promise<DocumentChunk[]> {
    const {
      maxTokens = 512,
      overlapTokens = 50,
      preserveSentences = true,
      minChunkSize = 100
    } = options;

    const chunks: DocumentChunk[] = [];
    
    // Clean and normalize text
    const cleanText = this.cleanText(text);
    
    if (preserveSentences) {
      return this.chunkBySentences(cleanText, metadata, {
        maxTokens,
        overlapTokens,
        minChunkSize
      });
    } else {
      return this.chunkByTokens(cleanText, metadata, {
        maxTokens,
        overlapTokens,
        minChunkSize
      });
    }
  }

  // Extract content from GRC entities
  private extractGRCEntityContent(entity: any, entityType: string): string {
    const parts: string[] = [];

    switch (entityType) {
      case 'risk':
        parts.push(`Title: ${entity.title || 'Untitled Risk'}`);
        if (entity.description) parts.push(`Description: ${entity.description}`);
        if (entity.impact_description) parts.push(`Impact: ${entity.impact_description}`);
        if (entity.likelihood_description) parts.push(`Likelihood: ${entity.likelihood_description}`);
        if (entity.mitigation_strategy) parts.push(`Mitigation: ${entity.mitigation_strategy}`);
        if (entity.current_controls) parts.push(`Current Controls: ${entity.current_controls}`);
        if (entity.risk_category) parts.push(`Category: ${entity.risk_category}`);
        parts.push(`Risk Score: ${entity.risk_score || 0}`);
        parts.push(`Status: ${entity.status || 'Active'}`);
        break;

      case 'incident':
        parts.push(`Title: ${entity.title || 'Untitled Incident'}`);
        if (entity.description) parts.push(`Description: ${entity.description}`);
        if (entity.severity) parts.push(`Severity: ${entity.severity}`);
        if (entity.status) parts.push(`Status: ${entity.status}`);
        if (entity.affected_systems) parts.push(`Affected Systems: ${entity.affected_systems}`);
        if (entity.root_cause) parts.push(`Root Cause: ${entity.root_cause}`);
        if (entity.resolution_steps) parts.push(`Resolution: ${entity.resolution_steps}`);
        if (entity.lessons_learned) parts.push(`Lessons Learned: ${entity.lessons_learned}`);
        break;

      case 'service':
        parts.push(`Name: ${entity.name || entity.service_name || 'Untitled Service'}`);
        if (entity.description) parts.push(`Description: ${entity.description}`);
        if (entity.service_type) parts.push(`Type: ${entity.service_type}`);
        if (entity.criticality) parts.push(`Criticality: ${entity.criticality}`);
        if (entity.owner) parts.push(`Owner: ${entity.owner}`);
        if (entity.dependencies) parts.push(`Dependencies: ${entity.dependencies}`);
        if (entity.compliance_requirements) parts.push(`Compliance: ${entity.compliance_requirements}`);
        break;

      case 'asset':
        parts.push(`Name: ${entity.name || entity.asset_name || 'Untitled Asset'}`);
        if (entity.description) parts.push(`Description: ${entity.description}`);
        if (entity.asset_type) parts.push(`Type: ${entity.asset_type}`);
        if (entity.location) parts.push(`Location: ${entity.location}`);
        if (entity.owner) parts.push(`Owner: ${entity.owner}`);
        if (entity.criticality) parts.push(`Criticality: ${entity.criticality}`);
        if (entity.security_classification) parts.push(`Classification: ${entity.security_classification}`);
        break;

      default:
        parts.push(JSON.stringify(entity));
    }

    return parts.join('\n\n');
  }

  // Extract text from file (basic implementation)
  private async extractTextFromFile(file: File): Promise<string> {
    if (file.type.startsWith('text/')) {
      return await file.text();
    }
    
    // For other file types, return filename and basic info
    return `Document: ${file.name}\nSize: ${file.size} bytes\nType: ${file.type}`;
  }

  // Clean and normalize text
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')           // Normalize line endings
      .replace(/\n\s*\n/g, '\n\n')     // Remove excessive blank lines
      .replace(/\s+/g, ' ')            // Normalize whitespace
      .trim();
  }

  // Chunk by sentences while respecting token limits
  private chunkBySentences(
    text: string,
    metadata: { sourceId: string; sourceType: string; title: string },
    options: { maxTokens: number; overlapTokens: number; minChunkSize: number }
  ): DocumentChunk[] {
    const sentences = this.splitIntoSentences(text);
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    let chunkIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceTokens = this.estimateTokens(sentence);

      if (currentTokens + sentenceTokens > options.maxTokens && currentChunk.length >= options.minChunkSize) {
        // Create chunk
        chunks.push(this.createChunk(
          currentChunk,
          metadata,
          chunkIndex++,
          sentences.length,
          text.indexOf(currentChunk),
          text.indexOf(currentChunk) + currentChunk.length
        ));

        // Start new chunk with overlap
        if (options.overlapTokens > 0) {
          const overlapStart = Math.max(0, i - 2); // Include previous 2 sentences for context
          currentChunk = sentences.slice(overlapStart, i + 1).join(' ');
          currentTokens = this.estimateTokens(currentChunk);
        } else {
          currentChunk = sentence;
          currentTokens = sentenceTokens;
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentTokens += sentenceTokens;
      }
    }

    // Add final chunk
    if (currentChunk.length >= options.minChunkSize) {
      chunks.push(this.createChunk(
        currentChunk,
        metadata,
        chunkIndex,
        sentences.length,
        text.lastIndexOf(currentChunk),
        text.lastIndexOf(currentChunk) + currentChunk.length
      ));
    }

    return chunks;
  }

  // Chunk by token count
  private chunkByTokens(
    text: string,
    metadata: { sourceId: string; sourceType: string; title: string },
    options: { maxTokens: number; overlapTokens: number; minChunkSize: number }
  ): DocumentChunk[] {
    const words = text.split(/\s+/);
    const chunks: DocumentChunk[] = [];
    let chunkIndex = 0;
    const wordsPerToken = 0.75; // Rough estimation
    const wordsPerChunk = Math.floor(options.maxTokens * wordsPerToken);
    const overlapWords = Math.floor(options.overlapTokens * wordsPerToken);

    for (let i = 0; i < words.length; i += wordsPerChunk - overlapWords) {
      const chunkWords = words.slice(i, i + wordsPerChunk);
      const chunkText = chunkWords.join(' ');

      if (chunkText.length >= options.minChunkSize) {
        chunks.push(this.createChunk(
          chunkText,
          metadata,
          chunkIndex++,
          Math.ceil(words.length / wordsPerChunk),
          text.indexOf(chunkText),
          text.indexOf(chunkText) + chunkText.length
        ));
      }
    }

    return chunks;
  }

  // Split text into sentences
  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  // Create document chunk
  private createChunk(
    content: string,
    metadata: { sourceId: string; sourceType: string; title: string },
    chunkIndex: number,
    totalChunks: number,
    startChar: number,
    endChar: number
  ): DocumentChunk {
    return {
      id: `${metadata.sourceId}-chunk-${chunkIndex}`,
      content,
      metadata: {
        source_id: metadata.sourceId,
        source_type: metadata.sourceType,
        chunk_index: chunkIndex,
        total_chunks: totalChunks,
        title: metadata.title,
        start_char: startChar,
        end_char: endChar,
        token_count: this.estimateTokens(content)
      }
    };
  }

  // Generate document ID from filename
  private generateDocumentId(filename: string): string {
    const timestamp = Date.now();
    const sanitized = filename.replace(/[^\w.-]/g, '_');
    return `doc_${timestamp}_${sanitized}`;
  }

  // Estimate token count
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

// Singleton instance
export const documentProcessor = new DocumentProcessor();
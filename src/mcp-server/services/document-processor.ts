/**
 * Document Processor for ARIA5.1 MCP Server
 * 
 * Handles intelligent document chunking and processing for RAG.
 * Converts documents into semantically meaningful chunks for embedding.
 */

import type { 
  DocumentChunk,
  DocumentProcessingOptions,
  ChunkMetadata 
} from '../types/mcp-types';

export class DocumentProcessor {
  private defaultOptions: DocumentProcessingOptions = {
    chunkSize: 512,
    chunkOverlap: 50,
    strategy: 'semantic',
    preserveContext: true
  };

  /**
   * Process document content into chunks
   */
  async processDocument(
    documentId: number,
    content: string,
    metadata: { title: string; documentType: string },
    options?: Partial<DocumentProcessingOptions>
  ): Promise<DocumentChunk[]> {
    const opts = { ...this.defaultOptions, ...options };

    // Clean and normalize content
    const cleanedContent = this.cleanContent(content);

    // Choose chunking strategy
    let chunks: string[];
    switch (opts.strategy) {
      case 'semantic':
        chunks = this.semanticChunking(cleanedContent, opts);
        break;
      case 'paragraph':
        chunks = this.paragraphChunking(cleanedContent, opts);
        break;
      case 'fixed':
      default:
        chunks = this.fixedSizeChunking(cleanedContent, opts);
    }

    // Convert chunks to DocumentChunk objects
    return chunks.map((chunkContent, index) => {
      const startChar = content.indexOf(chunkContent);
      const endChar = startChar + chunkContent.length;

      const chunkMetadata: ChunkMetadata = {
        documentType: metadata.documentType,
        title: metadata.title,
        section: this.detectSection(chunkContent),
        startChar,
        endChar,
        tokens: this.estimateTokens(chunkContent),
        createdAt: new Date().toISOString()
      };

      return {
        id: `doc_${documentId}_chunk_${index}`,
        documentId,
        chunkIndex: index,
        content: chunkContent,
        metadata: chunkMetadata
      };
    });
  }

  /**
   * Semantic chunking - splits on natural boundaries while preserving meaning
   */
  private semanticChunking(content: string, options: DocumentProcessingOptions): string[] {
    const chunks: string[] = [];
    
    // Split into paragraphs first
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    
    let currentChunk = '';
    let currentSize = 0;

    for (const paragraph of paragraphs) {
      const paragraphSize = paragraph.length;
      
      // If adding this paragraph exceeds chunk size
      if (currentSize + paragraphSize > options.chunkSize && currentChunk) {
        // Save current chunk
        chunks.push(currentChunk.trim());
        
        // Start new chunk with overlap
        if (options.preserveContext) {
          // Include last sentence of previous chunk for context
          const sentences = currentChunk.split(/[.!?]+/).filter(s => s.trim());
          const lastSentence = sentences[sentences.length - 1] || '';
          currentChunk = lastSentence + '\n\n' + paragraph;
          currentSize = currentChunk.length;
        } else {
          currentChunk = paragraph;
          currentSize = paragraphSize;
        }
      } else {
        // Add paragraph to current chunk
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        currentSize = currentChunk.length;
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Paragraph-based chunking - respects paragraph boundaries
   */
  private paragraphChunking(content: string, options: DocumentProcessingOptions): string[] {
    const chunks: string[] = [];
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      
      // If paragraph is too large, split it further
      if (paragraph.length > options.chunkSize) {
        const subChunks = this.splitLargeParagraph(paragraph, options.chunkSize);
        chunks.push(...subChunks);
      } else {
        chunks.push(paragraph);
      }
    }

    return chunks;
  }

  /**
   * Fixed-size chunking with overlap
   */
  private fixedSizeChunking(content: string, options: DocumentProcessingOptions): string[] {
    const chunks: string[] = [];
    const { chunkSize, chunkOverlap } = options;
    
    let startIndex = 0;
    
    while (startIndex < content.length) {
      let endIndex = startIndex + chunkSize;
      
      // Try to break at a sentence boundary
      if (endIndex < content.length) {
        const nextPeriod = content.indexOf('. ', endIndex);
        const nextNewline = content.indexOf('\n', endIndex);
        
        if (nextPeriod !== -1 && nextPeriod < endIndex + 100) {
          endIndex = nextPeriod + 1;
        } else if (nextNewline !== -1 && nextNewline < endIndex + 50) {
          endIndex = nextNewline;
        }
      }
      
      const chunk = content.substring(startIndex, endIndex).trim();
      if (chunk) {
        chunks.push(chunk);
      }
      
      // Move start index with overlap
      startIndex = endIndex - chunkOverlap;
    }

    return chunks;
  }

  /**
   * Split large paragraph into smaller chunks
   */
  private splitLargeParagraph(paragraph: string, maxSize: number): string[] {
    const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Clean and normalize document content
   */
  private cleanContent(content: string): string {
    return content
      // Remove multiple consecutive spaces
      .replace(/[ \t]+/g, ' ')
      // Normalize newlines
      .replace(/\r\n/g, '\n')
      // Remove excessive newlines (keep max 2)
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim();
  }

  /**
   * Detect section from content (e.g., heading, list, code)
   */
  private detectSection(content: string): string {
    const firstLine = content.split('\n')[0].trim();
    
    // Check for common section patterns
    if (/^#+\s/.test(firstLine)) {
      return 'heading';
    } else if (/^[-*]\s/.test(firstLine)) {
      return 'list';
    } else if (/^```/.test(firstLine)) {
      return 'code';
    } else if (/^>\s/.test(firstLine)) {
      return 'quote';
    } else if (/^\d+\.\s/.test(firstLine)) {
      return 'numbered_list';
    }
    
    return 'paragraph';
  }

  /**
   * Estimate token count for chunk (rough approximation)
   */
  private estimateTokens(content: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(content.length / 4);
  }

  /**
   * Process evidence file content
   */
  async processEvidenceDocument(
    evidenceId: number,
    fileContent: string,
    fileName: string,
    fileType: string
  ): Promise<DocumentChunk[]> {
    const documentMetadata = {
      title: fileName,
      documentType: this.mapFileTypeToDocType(fileType)
    };

    return this.processDocument(
      evidenceId,
      fileContent,
      documentMetadata,
      {
        chunkSize: 600, // Slightly larger chunks for evidence
        chunkOverlap: 75,
        strategy: 'semantic'
      }
    );
  }

  /**
   * Process policy document
   */
  async processPolicyDocument(
    policyId: number,
    content: string,
    policyName: string
  ): Promise<DocumentChunk[]> {
    return this.processDocument(
      policyId,
      content,
      { title: policyName, documentType: 'policy' },
      {
        chunkSize: 512,
        chunkOverlap: 50,
        strategy: 'semantic',
        preserveContext: true
      }
    );
  }

  /**
   * Process threat intelligence report
   */
  async processThreatReport(
    reportId: number,
    content: string,
    reportTitle: string
  ): Promise<DocumentChunk[]> {
    return this.processDocument(
      reportId,
      content,
      { title: reportTitle, documentType: 'threat_report' },
      {
        chunkSize: 400, // Smaller chunks for precision in threat data
        chunkOverlap: 50,
        strategy: 'semantic'
      }
    );
  }

  /**
   * Map file type to document type category
   */
  private mapFileTypeToDocType(fileType: string): string {
    const typeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'text/plain': 'text',
      'application/msword': 'word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
      'application/vnd.ms-excel': 'excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
      'text/csv': 'csv',
      'text/markdown': 'markdown',
      'text/html': 'html'
    };

    return typeMap[fileType] || 'unknown';
  }

  /**
   * Extract text from different file formats (placeholder for future implementation)
   */
  async extractText(fileContent: ArrayBuffer, mimeType: string): Promise<string> {
    // For Phase 1, we'll handle text-based formats
    // Future: Implement PDF extraction, DOCX parsing, etc.
    
    const decoder = new TextDecoder('utf-8');
    
    if (mimeType.startsWith('text/')) {
      return decoder.decode(fileContent);
    }
    
    // For binary formats, return placeholder
    console.warn(`⚠️ Binary format ${mimeType} not yet supported for text extraction`);
    return '[Binary content - extraction not implemented]';
  }

  /**
   * Validate chunk quality
   */
  validateChunk(chunk: DocumentChunk): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!chunk.content || chunk.content.trim().length === 0) {
      issues.push('Empty content');
    }
    
    if (chunk.content.length < 50) {
      issues.push('Content too short for meaningful embedding');
    }
    
    if (chunk.content.length > 2000) {
      issues.push('Content exceeds recommended chunk size');
    }
    
    if (chunk.metadata.tokens > 500) {
      issues.push('Chunk may exceed LLM context efficiency threshold');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}

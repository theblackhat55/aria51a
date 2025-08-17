// Local Embeddings Service
// Provides embeddings without external API dependencies using local models

export interface EmbeddingOptions {
  model?: 'local' | 'openai' | 'gemini';
  dimensions?: number;
  batchSize?: number;
}

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  model: string;
}

export class LocalEmbeddingService {
  private cache: Map<string, EmbeddingResult> = new Map();

  constructor() {}

  // Generate embedding for text
  async generateEmbedding(
    text: string, 
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult> {
    const { model = 'local', dimensions = 384 } = options;
    
    // Check cache first
    const cacheKey = `${model}:${text}:${dimensions}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let embedding: number[];
    
    switch (model) {
      case 'local':
        embedding = await this.generateLocalEmbedding(text, dimensions);
        break;
      case 'openai':
        embedding = await this.generateOpenAIEmbedding(text);
        break;
      case 'gemini':
        embedding = await this.generateGeminiEmbedding(text);
        break;
      default:
        embedding = await this.generateLocalEmbedding(text, dimensions);
    }

    const result: EmbeddingResult = {
      embedding,
      tokens: this.estimateTokens(text),
      model
    };

    // Cache the result
    this.cache.set(cacheKey, result);
    
    return result;
  }

  // Generate embeddings for multiple texts
  async generateEmbeddings(
    texts: string[], 
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult[]> {
    const { batchSize = 10 } = options;
    const results: EmbeddingResult[] = [];

    // Process in batches
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.generateEmbedding(text, options));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  // Local embedding generation using simple TF-IDF + dimensionality reduction
  private async generateLocalEmbedding(text: string, dimensions: number): Promise<number[]> {
    // Preprocessing
    const tokens = this.tokenize(text.toLowerCase());
    const vocabulary = this.buildVocabulary(tokens);
    
    // Create TF-IDF vector
    const tfIdfVector = this.calculateTfIdf(tokens, vocabulary);
    
    // Reduce dimensionality and normalize
    const embedding = this.reduceDimensions(tfIdfVector, dimensions);
    return this.normalizeVector(embedding);
  }

  // Generate embedding using OpenAI API (requires API key from settings)
  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
    const aiSettings = JSON.parse(localStorage.getItem('dmt_ai_settings') || '{}');
    const openaiSettings = aiSettings.openai;

    if (!openaiSettings?.enabled || !openaiSettings?.apiKey) {
      console.warn('OpenAI not configured, falling back to local embedding');
      return this.generateLocalEmbedding(text, 1536); // OpenAI default dimension
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiSettings.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-3-small'
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.warn('OpenAI embedding failed, falling back to local:', error);
      return this.generateLocalEmbedding(text, 1536);
    }
  }

  // Generate embedding using Google Gemini API
  private async generateGeminiEmbedding(text: string): Promise<number[]> {
    const aiSettings = JSON.parse(localStorage.getItem('dmt_ai_settings') || '{}');
    const geminiSettings = aiSettings.gemini;

    if (!geminiSettings?.enabled || !geminiSettings?.apiKey) {
      console.warn('Gemini not configured, falling back to local embedding');
      return this.generateLocalEmbedding(text, 768); // Gemini default dimension
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${geminiSettings.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: { parts: [{ text }] },
            taskType: 'RETRIEVAL_DOCUMENT'
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding.values;
    } catch (error) {
      console.warn('Gemini embedding failed, falling back to local:', error);
      return this.generateLocalEmbedding(text, 768);
    }
  }

  // Simple tokenization
  private tokenize(text: string): string[] {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  // Build vocabulary from tokens
  private buildVocabulary(tokens: string[]): Map<string, number> {
    const vocabulary = new Map<string, number>();
    tokens.forEach(token => {
      vocabulary.set(token, (vocabulary.get(token) || 0) + 1);
    });
    return vocabulary;
  }

  // Calculate TF-IDF vector
  private calculateTfIdf(tokens: string[], vocabulary: Map<string, number>): number[] {
    const vector: number[] = [];
    const totalTokens = tokens.length;
    const uniqueTokens = Array.from(vocabulary.keys());

    for (const token of uniqueTokens) {
      const tf = (vocabulary.get(token) || 0) / totalTokens;
      const idf = Math.log(1 + 1 / (vocabulary.get(token) || 1)); // Simplified IDF
      vector.push(tf * idf);
    }

    return vector;
  }

  // Reduce dimensions using simple truncation/padding
  private reduceDimensions(vector: number[], targetDimensions: number): number[] {
    if (vector.length === targetDimensions) {
      return vector;
    }

    if (vector.length > targetDimensions) {
      // Truncate
      return vector.slice(0, targetDimensions);
    } else {
      // Pad with zeros
      const padded = [...vector];
      while (padded.length < targetDimensions) {
        padded.push(0);
      }
      return padded;
    }
  }

  // Normalize vector to unit length
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(val => val / magnitude);
  }

  // Estimate token count
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  // Clear embedding cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Track hit rate
    };
  }
}

// Singleton instance
export const embeddingService = new LocalEmbeddingService();
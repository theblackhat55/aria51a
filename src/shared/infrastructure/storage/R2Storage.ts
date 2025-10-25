/**
 * R2 Storage Manager
 * 
 * Provides a type-safe wrapper around Cloudflare R2 object storage
 * for file uploads, evidence storage, and document management.
 */

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  customMetadata?: Record<string, string>;
  httpMetadata?: R2HTTPMetadata;
}

export interface DownloadOptions {
  range?: R2Range;
}

export class R2Storage {
  private static instance: R2Storage | null = null;
  private r2: R2Bucket | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): R2Storage {
    if (!R2Storage.instance) {
      R2Storage.instance = new R2Storage();
    }
    return R2Storage.instance;
  }

  /**
   * Initialize the R2 bucket
   */
  public initialize(bucket: R2Bucket): void {
    this.r2 = bucket;
  }

  /**
   * Get the R2 bucket
   * @throws Error if R2 not initialized
   */
  private getR2(): R2Bucket {
    if (!this.r2) {
      throw new Error('R2 not initialized. Call initialize() first.');
    }
    return this.r2;
  }

  /**
   * Upload a file to R2
   */
  public async upload(
    key: string,
    data: ArrayBuffer | ReadableStream | string,
    options?: UploadOptions
  ): Promise<R2Object | null> {
    const r2 = this.getR2();
    
    const putOptions: R2PutOptions = {};
    
    if (options?.contentType) {
      putOptions.httpMetadata = putOptions.httpMetadata || {};
      putOptions.httpMetadata.contentType = options.contentType;
    }
    
    if (options?.httpMetadata) {
      putOptions.httpMetadata = { ...putOptions.httpMetadata, ...options.httpMetadata };
    }
    
    if (options?.customMetadata) {
      putOptions.customMetadata = options.customMetadata;
    }

    return await r2.put(key, data, putOptions);
  }

  /**
   * Download a file from R2
   */
  public async download(
    key: string,
    options?: DownloadOptions
  ): Promise<R2ObjectBody | null> {
    const r2 = this.getR2();
    
    const getOptions: R2GetOptions = {};
    if (options?.range) {
      getOptions.range = options.range;
    }

    return await r2.get(key, getOptions);
  }

  /**
   * Get file metadata without downloading
   */
  public async head(key: string): Promise<R2Object | null> {
    const r2 = this.getR2();
    return await r2.head(key);
  }

  /**
   * Delete a file from R2
   */
  public async delete(key: string): Promise<void> {
    const r2 = this.getR2();
    await r2.delete(key);
  }

  /**
   * Delete multiple files
   */
  public async deleteMultiple(keys: string[]): Promise<void> {
    const r2 = this.getR2();
    await r2.delete(keys);
  }

  /**
   * Check if a file exists
   */
  public async exists(key: string): Promise<boolean> {
    const object = await this.head(key);
    return object !== null;
  }

  /**
   * List objects with prefix
   */
  public async list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<R2Objects> {
    const r2 = this.getR2();
    
    const listOptions: R2ListOptions = {};
    if (options?.prefix) {
      listOptions.prefix = options.prefix;
    }
    if (options?.limit) {
      listOptions.limit = options.limit;
    }
    if (options?.cursor) {
      listOptions.cursor = options.cursor;
    }

    return await r2.list(listOptions);
  }

  /**
   * Generate a presigned URL for temporary access
   * Note: R2 doesn't support presigned URLs natively yet
   * This method would need to use a proxy or signed URL service
   */
  public async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // TODO: Implement signed URL generation
    // For now, return a placeholder
    throw new Error('Signed URLs not yet implemented for R2');
  }

  /**
   * Copy an object to a new key
   */
  public async copy(sourceKey: string, destinationKey: string): Promise<R2Object | null> {
    // R2 doesn't have native copy, so we download and re-upload
    const object = await this.download(sourceKey);
    if (!object) {
      return null;
    }

    const body = await object.arrayBuffer();
    return await this.upload(destinationKey, body, {
      contentType: object.httpMetadata?.contentType,
      httpMetadata: object.httpMetadata,
      customMetadata: object.customMetadata
    });
  }

  /**
   * Get file size
   */
  public async getSize(key: string): Promise<number | null> {
    const object = await this.head(key);
    return object?.size || null;
  }

  /**
   * Check if R2 is initialized
   */
  public isInitialized(): boolean {
    return this.r2 !== null;
  }
}

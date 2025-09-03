/**
 * Cloudflare R2 File Storage Service for ARIA5.1
 * 
 * Provides enterprise-grade file storage capabilities for:
 * - Document uploads and attachments
 * - Evidence storage for security incidents
 * - Report storage and archival
 * - Compliance document management
 * - Risk assessment artifacts
 * 
 * Features:
 * - Secure file upload with validation
 * - Metadata management and indexing
 * - Access control and permissions
 * - File versioning and lifecycle management
 * - Integration with ARIA5 data models
 */

export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
  uploadedBy: number;
  uploadedAt: string;
  category: 'evidence' | 'report' | 'document' | 'attachment' | 'compliance';
  tags: string[];
  relatedRiskId?: number;
  relatedComplianceId?: number;
  accessLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  expiresAt?: string;
  version: number;
  isDeleted: boolean;
}

export interface FileUploadRequest {
  file: File | ArrayBuffer;
  filename: string;
  mimeType: string;
  category: FileMetadata['category'];
  tags?: string[];
  relatedRiskId?: number;
  relatedComplianceId?: number;
  accessLevel?: FileMetadata['accessLevel'];
  expiresAt?: string;
}

export interface FileSearchQuery {
  query?: string;
  category?: FileMetadata['category'];
  tags?: string[];
  relatedRiskId?: number;
  relatedComplianceId?: number;
  accessLevel?: FileMetadata['accessLevel'];
  uploadedBy?: number;
  dateFrom?: string;
  dateTo?: string;
  mimeTypes?: string[];
  limit?: number;
  offset?: number;
}

export interface FileStorageConfig {
  bucketName: string;
  maxFileSize: number; // in bytes
  allowedMimeTypes: string[];
  retentionDays: number;
  enableVersioning: boolean;
  enableEncryption: boolean;
}

export class FileStorageService {
  private r2: R2Bucket | null = null;
  private db: any;
  private config: FileStorageConfig;

  constructor(r2Bucket?: R2Bucket, database?: any, config?: Partial<FileStorageConfig>) {
    this.r2 = r2Bucket || null;
    this.db = database;
    this.config = {
      bucketName: 'aria5-storage',
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        'image/png',
        'image/jpeg',
        'image/gif',
        'application/json',
        'application/xml',
        'application/zip',
        'application/x-zip-compressed'
      ],
      retentionDays: 2555, // 7 years for compliance
      enableVersioning: true,
      enableEncryption: true,
      ...config
    };

    if (this.db) {
      this.initializeDatabase();
    }
  }

  /**
   * Initialize database tables for file metadata
   */
  private async initializeDatabase(): Promise<void> {
    try {
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS file_storage (
          id TEXT PRIMARY KEY,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size INTEGER NOT NULL,
          checksum TEXT NOT NULL,
          uploaded_by INTEGER NOT NULL,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          category TEXT NOT NULL CHECK (category IN ('evidence', 'report', 'document', 'attachment', 'compliance')),
          tags TEXT, -- JSON array
          related_risk_id INTEGER,
          related_compliance_id INTEGER,
          access_level TEXT NOT NULL DEFAULT 'internal' CHECK (access_level IN ('public', 'internal', 'confidential', 'restricted')),
          expires_at DATETIME,
          version INTEGER DEFAULT 1,
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (uploaded_by) REFERENCES users(id),
          FOREIGN KEY (related_risk_id) REFERENCES risks(id),
          FOREIGN KEY (related_compliance_id) REFERENCES compliance_items(id)
        )
      `).run();

      // Create indexes for better performance
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_file_storage_category ON file_storage(category)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_file_storage_uploaded_by ON file_storage(uploaded_by)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_file_storage_related_risk ON file_storage(related_risk_id)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_file_storage_access_level ON file_storage(access_level)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_file_storage_uploaded_at ON file_storage(uploaded_at)
      `).run();

    } catch (error) {
      console.error('Failed to initialize file storage database:', error);
    }
  }

  /**
   * Upload a file to R2 storage
   */
  async uploadFile(request: FileUploadRequest, uploadedBy: number): Promise<{ success: boolean; fileId?: string; url?: string; error?: string }> {
    try {
      // Validate request
      const validation = this.validateFileUpload(request);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate file ID and key
      const fileId = this.generateFileId();
      const fileKey = this.generateFileKey(fileId, request.filename);

      // Calculate checksum
      const fileBuffer = request.file instanceof File ? 
        await request.file.arrayBuffer() : request.file;
      const checksum = await this.calculateChecksum(fileBuffer);

      // Development mode fallback
      if (!this.r2) {
        console.log('🗄️ File Storage (Development Mode):', {
          action: 'upload',
          fileId,
          filename: request.filename,
          size: fileBuffer.byteLength,
          category: request.category,
          checksum
        });

        // Store metadata in database
        if (this.db) {
          await this.storeFileMetadata({
            id: fileId,
            filename: fileKey,
            originalName: request.filename,
            mimeType: request.mimeType,
            size: fileBuffer.byteLength,
            checksum,
            uploadedBy,
            uploadedAt: new Date().toISOString(),
            category: request.category,
            tags: request.tags || [],
            relatedRiskId: request.relatedRiskId,
            relatedComplianceId: request.relatedComplianceId,
            accessLevel: request.accessLevel || 'internal',
            expiresAt: request.expiresAt,
            version: 1,
            isDeleted: false
          });
        }

        return {
          success: true,
          fileId,
          url: `/api/files/${fileId}` // Mock URL for development
        };
      }

      // Upload to R2
      const uploadResult = await this.r2.put(fileKey, fileBuffer, {
        httpMetadata: {
          contentType: request.mimeType,
          contentDisposition: `attachment; filename="${request.filename}"`
        },
        customMetadata: {
          originalName: request.filename,
          category: request.category,
          uploadedBy: uploadedBy.toString(),
          checksum,
          version: '1'
        }
      });

      // Store metadata in database
      if (this.db) {
        await this.storeFileMetadata({
          id: fileId,
          filename: fileKey,
          originalName: request.filename,
          mimeType: request.mimeType,
          size: fileBuffer.byteLength,
          checksum,
          uploadedBy,
          uploadedAt: new Date().toISOString(),
          category: request.category,
          tags: request.tags || [],
          relatedRiskId: request.relatedRiskId,
          relatedComplianceId: request.relatedComplianceId,
          accessLevel: request.accessLevel || 'internal',
          expiresAt: request.expiresAt,
          version: 1,
          isDeleted: false
        });
      }

      return {
        success: true,
        fileId,
        url: `/api/files/${fileId}`
      };

    } catch (error) {
      console.error('File upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Retrieve a file from R2 storage
   */
  async getFile(fileId: string, userId?: number): Promise<{ success: boolean; file?: R2Object; metadata?: FileMetadata; error?: string }> {
    try {
      // Get metadata from database
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        return { success: false, error: 'File not found' };
      }

      // Check access permissions
      if (userId && !this.checkFileAccess(metadata, userId)) {
        return { success: false, error: 'Access denied' };
      }

      // Check if file is expired or deleted
      if (metadata.isDeleted) {
        return { success: false, error: 'File has been deleted' };
      }

      if (metadata.expiresAt && new Date(metadata.expiresAt) < new Date()) {
        return { success: false, error: 'File has expired' };
      }

      // Development mode fallback
      if (!this.r2) {
        console.log('🗄️ File Storage (Development Mode):', {
          action: 'retrieve',
          fileId,
          filename: metadata.originalName,
          size: metadata.size
        });

        return {
          success: true,
          metadata,
          file: null // Mock file object
        };
      }

      // Retrieve from R2
      const file = await this.r2.get(metadata.filename);
      if (!file) {
        return { success: false, error: 'File not found in storage' };
      }

      return {
        success: true,
        file,
        metadata
      };

    } catch (error) {
      console.error('File retrieval failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Retrieval failed'
      };
    }
  }

  /**
   * Search files based on criteria
   */
  async searchFiles(query: FileSearchQuery, userId?: number): Promise<{ success: boolean; files?: FileMetadata[]; total?: number; error?: string }> {
    try {
      if (!this.db) {
        return { success: false, error: 'Database not configured' };
      }

      let sql = `
        SELECT * FROM file_storage 
        WHERE is_deleted = FALSE
      `;
      const params: any[] = [];

      // Build where clauses
      if (query.query) {
        sql += ` AND (original_name LIKE ? OR tags LIKE ?)`;
        params.push(`%${query.query}%`, `%${query.query}%`);
      }

      if (query.category) {
        sql += ` AND category = ?`;
        params.push(query.category);
      }

      if (query.relatedRiskId) {
        sql += ` AND related_risk_id = ?`;
        params.push(query.relatedRiskId);
      }

      if (query.relatedComplianceId) {
        sql += ` AND related_compliance_id = ?`;
        params.push(query.relatedComplianceId);
      }

      if (query.uploadedBy) {
        sql += ` AND uploaded_by = ?`;
        params.push(query.uploadedBy);
      }

      if (query.dateFrom) {
        sql += ` AND uploaded_at >= ?`;
        params.push(query.dateFrom);
      }

      if (query.dateTo) {
        sql += ` AND uploaded_at <= ?`;
        params.push(query.dateTo);
      }

      if (query.mimeTypes && query.mimeTypes.length > 0) {
        sql += ` AND mime_type IN (${query.mimeTypes.map(() => '?').join(',')})`;
        params.push(...query.mimeTypes);
      }

      // Access control
      if (userId) {
        sql += ` AND (access_level IN ('public', 'internal') OR uploaded_by = ?)`;
        params.push(userId);
      }

      // Pagination
      sql += ` ORDER BY uploaded_at DESC`;
      if (query.limit) {
        sql += ` LIMIT ?`;
        params.push(query.limit);
      }
      if (query.offset) {
        sql += ` OFFSET ?`;
        params.push(query.offset);
      }

      const result = await this.db.prepare(sql).bind(...params).all();
      const files = result.results?.map((row: any) => this.mapRowToFileMetadata(row)) || [];

      // Get total count
      let countSql = `SELECT COUNT(*) as total FROM file_storage WHERE is_deleted = FALSE`;
      const countParams: any[] = [];

      if (query.query) {
        countSql += ` AND (original_name LIKE ? OR tags LIKE ?)`;
        countParams.push(`%${query.query}%`, `%${query.query}%`);
      }

      if (query.category) {
        countSql += ` AND category = ?`;
        countParams.push(query.category);
      }

      if (userId) {
        countSql += ` AND (access_level IN ('public', 'internal') OR uploaded_by = ?)`;
        countParams.push(userId);
      }

      const countResult = await this.db.prepare(countSql).bind(...countParams).first();
      const total = countResult?.total || 0;

      return {
        success: true,
        files,
        total
      };

    } catch (error) {
      console.error('File search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Delete a file (soft delete)
   */
  async deleteFile(fileId: string, userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        return { success: false, error: 'File not found' };
      }

      // Check permissions
      if (metadata.uploadedBy !== userId) {
        return { success: false, error: 'Access denied' };
      }

      // Soft delete in database
      if (this.db) {
        await this.db.prepare(`
          UPDATE file_storage 
          SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).bind(fileId).run();
      }

      return { success: true };

    } catch (error) {
      console.error('File deletion failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deletion failed'
      };
    }
  }

  /**
   * Get file statistics
   */
  async getStorageStatistics(userId?: number): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      if (!this.db) {
        return { success: false, error: 'Database not configured' };
      }

      let whereClause = 'WHERE is_deleted = FALSE';
      const params: any[] = [];

      if (userId) {
        whereClause += ' AND uploaded_by = ?';
        params.push(userId);
      }

      const stats = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_files,
          SUM(size) as total_size,
          COUNT(CASE WHEN category = 'evidence' THEN 1 END) as evidence_files,
          COUNT(CASE WHEN category = 'report' THEN 1 END) as report_files,
          COUNT(CASE WHEN category = 'document' THEN 1 END) as document_files,
          COUNT(CASE WHEN category = 'attachment' THEN 1 END) as attachment_files,
          COUNT(CASE WHEN category = 'compliance' THEN 1 END) as compliance_files
        FROM file_storage ${whereClause}
      `).bind(...params).first();

      return {
        success: true,
        stats: {
          totalFiles: stats?.total_files || 0,
          totalSize: stats?.total_size || 0,
          totalSizeFormatted: this.formatFileSize(stats?.total_size || 0),
          byCategory: {
            evidence: stats?.evidence_files || 0,
            report: stats?.report_files || 0,
            document: stats?.document_files || 0,
            attachment: stats?.attachment_files || 0,
            compliance: stats?.compliance_files || 0
          }
        }
      };

    } catch (error) {
      console.error('Storage statistics failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Statistics failed'
      };
    }
  }

  // Helper methods

  private validateFileUpload(request: FileUploadRequest): { valid: boolean; error?: string } {
    if (!request.file || !request.filename) {
      return { valid: false, error: 'File and filename are required' };
    }

    const fileSize = request.file instanceof File ? request.file.size : request.file.byteLength;
    if (fileSize > this.config.maxFileSize) {
      return { valid: false, error: `File too large. Maximum size: ${this.formatFileSize(this.config.maxFileSize)}` };
    }

    if (!this.config.allowedMimeTypes.includes(request.mimeType)) {
      return { valid: false, error: 'File type not allowed' };
    }

    return { valid: true };
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateFileKey(fileId: string, filename: string): string {
    const timestamp = new Date().toISOString().substring(0, 10);
    const extension = filename.substring(filename.lastIndexOf('.'));
    return `files/${timestamp}/${fileId}${extension}`;
  }

  private async calculateChecksum(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async storeFileMetadata(metadata: FileMetadata): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT INTO file_storage (
        id, filename, original_name, mime_type, size, checksum,
        uploaded_by, uploaded_at, category, tags, related_risk_id,
        related_compliance_id, access_level, expires_at, version, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      metadata.id,
      metadata.filename,
      metadata.originalName,
      metadata.mimeType,
      metadata.size,
      metadata.checksum,
      metadata.uploadedBy,
      metadata.uploadedAt,
      metadata.category,
      JSON.stringify(metadata.tags),
      metadata.relatedRiskId,
      metadata.relatedComplianceId,
      metadata.accessLevel,
      metadata.expiresAt,
      metadata.version,
      metadata.isDeleted ? 1 : 0
    ).run();
  }

  private async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    if (!this.db) return null;

    const result = await this.db.prepare(`
      SELECT * FROM file_storage WHERE id = ? AND is_deleted = FALSE
    `).bind(fileId).first();

    return result ? this.mapRowToFileMetadata(result) : null;
  }

  private mapRowToFileMetadata(row: any): FileMetadata {
    return {
      id: row.id,
      filename: row.filename,
      originalName: row.original_name,
      mimeType: row.mime_type,
      size: row.size,
      checksum: row.checksum,
      uploadedBy: row.uploaded_by,
      uploadedAt: row.uploaded_at,
      category: row.category,
      tags: JSON.parse(row.tags || '[]'),
      relatedRiskId: row.related_risk_id,
      relatedComplianceId: row.related_compliance_id,
      accessLevel: row.access_level,
      expiresAt: row.expires_at,
      version: row.version,
      isDeleted: Boolean(row.is_deleted)
    };
  }

  private checkFileAccess(metadata: FileMetadata, userId: number): boolean {
    // Owner can always access
    if (metadata.uploadedBy === userId) {
      return true;
    }

    // Check access level
    switch (metadata.accessLevel) {
      case 'public':
      case 'internal':
        return true;
      case 'confidential':
      case 'restricted':
        return false;
      default:
        return false;
    }
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

// Export helper functions
export const FileStorageHelpers = {
  /**
   * Create file attachment for risk
   */
  createRiskAttachment: (riskId: number, category: FileMetadata['category'] = 'evidence'): Partial<FileUploadRequest> => ({
    category,
    relatedRiskId: riskId,
    accessLevel: 'internal',
    tags: ['risk-attachment']
  }),

  /**
   * Create file attachment for compliance item
   */
  createComplianceAttachment: (complianceId: number): Partial<FileUploadRequest> => ({
    category: 'compliance',
    relatedComplianceId: complianceId,
    accessLevel: 'confidential',
    tags: ['compliance-document']
  }),

  /**
   * Create report storage request
   */
  createReportStorage: (reportType: string): Partial<FileUploadRequest> => ({
    category: 'report',
    accessLevel: 'internal',
    tags: ['generated-report', reportType]
  }),

  /**
   * Validate file type for security
   */
  isSecureFileType: (mimeType: string): boolean => {
    const dangerousTypes = [
      'application/javascript',
      'text/javascript',
      'application/x-executable',
      'application/x-msdownload',
      'application/vnd.microsoft.portable-executable'
    ];
    return !dangerousTypes.includes(mimeType);
  },

  /**
   * Generate secure filename
   */
  generateSecureFilename: (originalName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.substring(originalName.lastIndexOf('.'));
    const basename = originalName.substring(0, originalName.lastIndexOf('.'))
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    
    return `${basename}_${timestamp}_${random}${extension}`;
  }
};
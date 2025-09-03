// Advanced Report Generation Service for ARIA5.1
// Supports PDF and Excel generation using web-compatible libraries

export interface ReportOptions {
  title: string;
  subtitle?: string;
  author?: string;
  organization?: string;
  generatedBy: string;
  includeCharts?: boolean;
  includeRawData?: boolean;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  template?: 'executive' | 'technical' | 'compliance' | 'risk' | 'incident';
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area';
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }>;
  options?: any;
}

export interface ReportSection {
  title: string;
  content: string;
  type: 'text' | 'table' | 'chart' | 'list' | 'metrics';
  data?: any;
  chart?: ChartData;
}

export interface ReportData {
  sections: ReportSection[];
  summary?: {
    totalItems: number;
    criticalItems: number;
    highItems: number;
    mediumItems: number;
    lowItems: number;
    complianceScore?: number;
    riskScore?: number;
  };
  metadata: {
    generatedAt: string;
    dataRange?: {
      from: string;
      to: string;
    };
    filters?: any;
  };
}

export class ReportGeneratorService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(options?: { baseUrl?: string; apiKey?: string }) {
    this.baseUrl = options?.baseUrl || '';
    this.apiKey = options?.apiKey;
  }

  /**
   * Generate a comprehensive report
   */
  async generateReport(
    reportData: ReportData,
    options: ReportOptions
  ): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    try {
      switch (options.format) {
        case 'pdf':
          return await this.generatePDFReport(reportData, options);
        case 'excel':
          return await this.generateExcelReport(reportData, options);
        case 'csv':
          return await this.generateCSVReport(reportData, options);
        case 'json':
          return await this.generateJSONReport(reportData, options);
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate PDF report using a PDF generation service
   */
  private async generatePDFReport(
    reportData: ReportData,
    options: ReportOptions
  ): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    // Generate HTML content for PDF conversion
    const htmlContent = this.generateHTMLReport(reportData, options);
    
    // In development mode, return HTML preview
    if (!this.apiKey) {
      console.log('📄 PDF Report Generated (Development Mode)', {
        title: options.title,
        sections: reportData.sections.length,
        format: options.format
      });
      
      return {
        success: true,
        downloadUrl: `data:text/html;base64,${btoa(htmlContent)}`
      };
    }

    // For production, use a PDF generation service like Puppeteer Cloud API
    try {
      const response = await fetch(`${this.baseUrl}/pdf/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          html: htmlContent,
          options: {
            format: 'A4',
            printBackground: true,
            margin: {
              top: '20mm',
              right: '20mm',
              bottom: '20mm',
              left: '20mm'
            },
            displayHeaderFooter: true,
            headerTemplate: this.generatePDFHeader(options),
            footerTemplate: this.generatePDFFooter(options),
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`PDF generation failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        downloadUrl: result.downloadUrl
      };
    } catch (error) {
      return {
        success: false,
        error: `PDF generation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate Excel report
   */
  private async generateExcelReport(
    reportData: ReportData,
    options: ReportOptions
  ): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    // In development mode, return structured data
    if (!this.apiKey) {
      console.log('📊 Excel Report Generated (Development Mode)', {
        title: options.title,
        sections: reportData.sections.length,
        format: options.format
      });

      const excelData = this.generateExcelData(reportData, options);
      return {
        success: true,
        downloadUrl: `data:application/json;base64,${btoa(JSON.stringify(excelData))}`
      };
    }

    // For production, use an Excel generation service
    try {
      const excelData = this.generateExcelData(reportData, options);
      
      const response = await fetch(`${this.baseUrl}/excel/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          data: excelData,
          options: {
            title: options.title,
            author: options.author,
            includeCharts: options.includeCharts
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Excel generation failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        downloadUrl: result.downloadUrl
      };
    } catch (error) {
      return {
        success: false,
        error: `Excel generation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate CSV report
   */
  private async generateCSVReport(
    reportData: ReportData,
    options: ReportOptions
  ): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    try {
      const csvContent = this.generateCSVContent(reportData, options);
      
      const blob = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
      
      return {
        success: true,
        downloadUrl: blob
      };
    } catch (error) {
      return {
        success: false,
        error: `CSV generation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(
    reportData: ReportData,
    options: ReportOptions
  ): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    try {
      const jsonContent = JSON.stringify({
        report: options,
        data: reportData,
        generatedAt: new Date().toISOString()
      }, null, 2);
      
      const blob = `data:application/json;charset=utf-8,${encodeURIComponent(jsonContent)}`;
      
      return {
        success: true,
        downloadUrl: blob
      };
    } catch (error) {
      return {
        success: false,
        error: `JSON generation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate HTML report for PDF conversion
   */
  private generateHTMLReport(reportData: ReportData, options: ReportOptions): string {
    const template = this.getHTMLTemplate(options.template || 'technical');
    
    return template
      .replace('{{TITLE}}', options.title)
      .replace('{{SUBTITLE}}', options.subtitle || '')
      .replace('{{ORGANIZATION}}', options.organization || 'ARIA5.1 Platform')
      .replace('{{AUTHOR}}', options.author || options.generatedBy)
      .replace('{{GENERATED_DATE}}', new Date().toLocaleDateString())
      .replace('{{GENERATED_TIME}}', new Date().toLocaleTimeString())
      .replace('{{SUMMARY}}', this.generateSummaryHTML(reportData.summary))
      .replace('{{CONTENT}}', this.generateContentHTML(reportData.sections, options))
      .replace('{{METADATA}}', this.generateMetadataHTML(reportData.metadata));
  }

  /**
   * Get HTML template based on report type
   */
  private getHTMLTemplate(template: string): string {
    const baseCSS = `
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #007acc;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title { color: #007acc; font-size: 28px; margin: 0; }
        .subtitle { color: #666; font-size: 16px; margin: 5px 0; }
        .meta { color: #888; font-size: 14px; }
        .summary {
          background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #007acc;
        }
        .metric { 
          display: inline-block;
          margin: 10px 15px 10px 0;
          padding: 8px 12px;
          background: white;
          border-radius: 6px;
          border: 1px solid #ddd;
        }
        .metric-value { font-size: 20px; font-weight: bold; color: #007acc; }
        .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .section {
          margin: 30px 0;
          padding: 20px;
          border: 1px solid #eee;
          border-radius: 8px;
        }
        .section-title {
          font-size: 20px;
          color: #333;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #f0f0f0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background: #f8f9fa;
          font-weight: 600;
          color: #495057;
        }
        .critical { color: #dc3545; font-weight: bold; }
        .high { color: #fd7e14; font-weight: bold; }
        .medium { color: #ffc107; }
        .low { color: #28a745; }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #888;
          text-align: center;
        }
      </style>
    `;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>{{TITLE}}</title>
      ${baseCSS}
    </head>
    <body>
      <div class="header">
        <h1 class="title">{{TITLE}}</h1>
        <p class="subtitle">{{SUBTITLE}}</p>
        <p class="meta">Generated by {{AUTHOR}} for {{ORGANIZATION}} on {{GENERATED_DATE}} at {{GENERATED_TIME}}</p>
      </div>
      
      <div class="summary">
        {{SUMMARY}}
      </div>
      
      <div class="content">
        {{CONTENT}}
      </div>
      
      <div class="footer">
        {{METADATA}}
        <p>This report was automatically generated by ARIA5.1 Risk Intelligence Platform.</p>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate summary HTML
   */
  private generateSummaryHTML(summary?: ReportData['summary']): string {
    if (!summary) return '<p>No summary data available.</p>';

    return `
      <h3>Executive Summary</h3>
      <div class="metrics">
        <div class="metric">
          <div class="metric-value">${summary.totalItems}</div>
          <div class="metric-label">Total Items</div>
        </div>
        <div class="metric">
          <div class="metric-value critical">${summary.criticalItems}</div>
          <div class="metric-label">Critical</div>
        </div>
        <div class="metric">
          <div class="metric-value high">${summary.highItems}</div>
          <div class="metric-label">High</div>
        </div>
        <div class="metric">
          <div class="metric-value medium">${summary.mediumItems}</div>
          <div class="metric-label">Medium</div>
        </div>
        <div class="metric">
          <div class="metric-value low">${summary.lowItems}</div>
          <div class="metric-label">Low</div>
        </div>
        ${summary.complianceScore !== undefined ? `
        <div class="metric">
          <div class="metric-value">${summary.complianceScore}%</div>
          <div class="metric-label">Compliance Score</div>
        </div>
        ` : ''}
        ${summary.riskScore !== undefined ? `
        <div class="metric">
          <div class="metric-value">${summary.riskScore}</div>
          <div class="metric-label">Risk Score</div>
        </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate content HTML from sections
   */
  private generateContentHTML(sections: ReportSection[], options: ReportOptions): string {
    return sections.map(section => {
      let content = '';
      
      switch (section.type) {
        case 'text':
          content = `<p>${section.content}</p>`;
          break;
        case 'table':
          content = this.generateTableHTML(section.data);
          break;
        case 'list':
          content = this.generateListHTML(section.data);
          break;
        case 'metrics':
          content = this.generateMetricsHTML(section.data);
          break;
        case 'chart':
          content = options.includeCharts ? 
            `<p><em>Chart: ${section.chart?.title || 'Untitled Chart'}</em></p>` :
            '<p><em>Chart data available in interactive version</em></p>';
          break;
        default:
          content = `<p>${section.content}</p>`;
      }

      return `
        <div class="section">
          <h2 class="section-title">${section.title}</h2>
          ${content}
        </div>
      `;
    }).join('');
  }

  /**
   * Generate table HTML
   */
  private generateTableHTML(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) {
      return '<p>No data available.</p>';
    }

    const headers = Object.keys(data[0]);
    
    return `
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${this.formatHeader(header)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(header => `<td>${this.formatCellValue(row[header], header)}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Generate list HTML
   */
  private generateListHTML(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) {
      return '<p>No items found.</p>';
    }

    return `
      <ul>
        ${data.map(item => `<li>${typeof item === 'string' ? item : JSON.stringify(item)}</li>`).join('')}
      </ul>
    `;
  }

  /**
   * Generate metrics HTML
   */
  private generateMetricsHTML(data: any): string {
    if (!data || typeof data !== 'object') {
      return '<p>No metrics available.</p>';
    }

    return `
      <div class="metrics">
        ${Object.entries(data).map(([key, value]) => `
          <div class="metric">
            <div class="metric-value">${value}</div>
            <div class="metric-label">${this.formatHeader(key)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Generate metadata HTML
   */
  private generateMetadataHTML(metadata: ReportData['metadata']): string {
    return `
      <div class="metadata">
        <p><strong>Generated:</strong> ${new Date(metadata.generatedAt).toLocaleString()}</p>
        ${metadata.dataRange ? `
          <p><strong>Data Range:</strong> ${new Date(metadata.dataRange.from).toLocaleDateString()} - ${new Date(metadata.dataRange.to).toLocaleDateString()}</p>
        ` : ''}
        ${metadata.filters ? `
          <p><strong>Filters Applied:</strong> ${JSON.stringify(metadata.filters)}</p>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate Excel data structure
   */
  private generateExcelData(reportData: ReportData, options: ReportOptions): any {
    return {
      worksheets: [
        {
          name: 'Summary',
          data: reportData.summary ? [reportData.summary] : []
        },
        ...reportData.sections.filter(section => section.type === 'table').map(section => ({
          name: section.title.substring(0, 31), // Excel worksheet name limit
          data: section.data || []
        }))
      ],
      metadata: {
        title: options.title,
        author: options.author,
        generated: reportData.metadata.generatedAt
      }
    };
  }

  /**
   * Generate CSV content
   */
  private generateCSVContent(reportData: ReportData, options: ReportOptions): string {
    let csv = `"${options.title}"\n`;
    csv += `"Generated: ${reportData.metadata.generatedAt}"\n\n`;

    // Add summary if available
    if (reportData.summary) {
      csv += 'Summary\n';
      csv += Object.entries(reportData.summary)
        .map(([key, value]) => `"${this.formatHeader(key)}","${value}"`)
        .join('\n');
      csv += '\n\n';
    }

    // Add table data from sections
    reportData.sections.filter(section => section.type === 'table').forEach(section => {
      csv += `"${section.title}"\n`;
      
      if (section.data && Array.isArray(section.data) && section.data.length > 0) {
        const headers = Object.keys(section.data[0]);
        csv += headers.map(h => `"${this.formatHeader(h)}"`).join(',') + '\n';
        
        section.data.forEach(row => {
          csv += headers.map(header => `"${row[header] || ''}"`).join(',') + '\n';
        });
      }
      
      csv += '\n';
    });

    return csv;
  }

  /**
   * Generate PDF header template
   */
  private generatePDFHeader(options: ReportOptions): string {
    return `
      <div style="font-size: 10px; padding: 10px; border-bottom: 1px solid #ddd;">
        <span>${options.title}</span>
        <span style="float: right;">${options.organization || 'ARIA5.1'}</span>
      </div>
    `;
  }

  /**
   * Generate PDF footer template
   */
  private generatePDFFooter(options: ReportOptions): string {
    return `
      <div style="font-size: 10px; padding: 10px; border-top: 1px solid #ddd;">
        <span>Generated by ${options.generatedBy}</span>
        <span style="float: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;
  }

  /**
   * Format header text
   */
  private formatHeader(header: string): string {
    return header
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Format cell value based on column type
   */
  private formatCellValue(value: any, header: string): string {
    if (value === null || value === undefined) return '';
    
    // Format severity/priority values with colors
    if (header.toLowerCase().includes('severity') || header.toLowerCase().includes('priority')) {
      const severity = String(value).toLowerCase();
      switch (severity) {
        case 'critical': return `<span class="critical">${value}</span>`;
        case 'high': return `<span class="high">${value}</span>`;
        case 'medium': return `<span class="medium">${value}</span>`;
        case 'low': return `<span class="low">${value}</span>`;
        default: return String(value);
      }
    }
    
    // Format dates
    if (header.toLowerCase().includes('date') || header.toLowerCase().includes('time')) {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return String(value);
      }
    }
    
    return String(value);
  }
}
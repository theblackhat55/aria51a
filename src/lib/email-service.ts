// Email Service using Resend API (Cloudflare Workers compatible)
// Fallback to console logging for development

export interface EmailTemplate {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface NotificationData {
  user: {
    email: string;
    name: string;
  };
  type: 'security' | 'compliance' | 'risk' | 'incident' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class EmailService {
  private apiKey: string | undefined;
  private fromEmail: string;
  private isDevelopment: boolean;

  constructor(apiKey?: string, fromEmail: string = 'noreply@aria5.com') {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
    this.isDevelopment = !apiKey || apiKey === 'dev';
  }

  /**
   * Send a raw email
   */
  async sendEmail(template: EmailTemplate): Promise<boolean> {
    if (this.isDevelopment) {
      console.log('📧 EMAIL (Development Mode)', {
        to: template.to,
        subject: template.subject,
        preview: template.html.substring(0, 100) + '...'
      });
      return true;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: Array.isArray(template.to) ? template.to : [template.to],
          subject: template.subject,
          html: template.html,
          text: template.text
        }),
      });

      if (!response.ok) {
        console.error('Email send failed:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  /**
   * Send a notification email using predefined templates
   */
  async sendNotification(data: NotificationData): Promise<boolean> {
    const template = this.generateNotificationTemplate(data);
    return this.sendEmail(template);
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlert(userEmail: string, userName: string, alertTitle: string, alertDetails: string, actionUrl?: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: userEmail,
      subject: `🚨 Security Alert: ${alertTitle}`,
      html: this.generateSecurityAlertHtml(userName, alertTitle, alertDetails, actionUrl),
      text: `Security Alert: ${alertTitle}\n\n${alertDetails}\n\n${actionUrl ? `Action Required: ${actionUrl}` : ''}`
    };

    return this.sendEmail(template);
  }

  /**
   * Send risk assessment notification
   */
  async sendRiskNotification(userEmail: string, userName: string, riskTitle: string, riskLevel: string, actionUrl?: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: userEmail,
      subject: `⚠️ Risk Alert: ${riskTitle}`,
      html: this.generateRiskNotificationHtml(userName, riskTitle, riskLevel, actionUrl),
      text: `Risk Alert: ${riskTitle}\n\nRisk Level: ${riskLevel}\n\n${actionUrl ? `Review: ${actionUrl}` : ''}`
    };

    return this.sendEmail(template);
  }

  /**
   * Send compliance reminder
   */
  async sendComplianceReminder(userEmail: string, userName: string, frameworkName: string, dueDate: string, actionUrl?: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: userEmail,
      subject: `📋 Compliance Reminder: ${frameworkName}`,
      html: this.generateComplianceReminderHtml(userName, frameworkName, dueDate, actionUrl),
      text: `Compliance Reminder: ${frameworkName}\n\nDue Date: ${dueDate}\n\n${actionUrl ? `Complete Assessment: ${actionUrl}` : ''}`
    };

    return this.sendEmail(template);
  }

  /**
   * Send incident notification
   */
  async sendIncidentNotification(userEmail: string, userName: string, incidentTitle: string, severity: string, actionUrl?: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: userEmail,
      subject: `🔥 Incident Alert: ${incidentTitle}`,
      html: this.generateIncidentNotificationHtml(userName, incidentTitle, severity, actionUrl),
      text: `Incident Alert: ${incidentTitle}\n\nSeverity: ${severity}\n\n${actionUrl ? `View Incident: ${actionUrl}` : ''}`
    };

    return this.sendEmail(template);
  }

  /**
   * Generate notification template based on type
   */
  private generateNotificationTemplate(data: NotificationData): EmailTemplate {
    const priorityEmojis = {
      low: '💙',
      medium: '💛', 
      high: '🧡',
      critical: '🔴'
    };

    const typeEmojis = {
      security: '🛡️',
      compliance: '📋',
      risk: '⚠️',
      incident: '🔥',
      system: '⚙️'
    };

    return {
      to: data.user.email,
      subject: `${priorityEmojis[data.priority]} ${typeEmojis[data.type]} ${data.title}`,
      html: this.generateGenericNotificationHtml(data),
      text: `${data.title}\n\n${data.message}\n\n${data.actionUrl ? `Action: ${data.actionUrl}` : ''}`
    };
  }

  /**
   * Generate HTML templates
   */
  private generateGenericNotificationHtml(data: NotificationData): string {
    const priorityColors = {
      low: '#3B82F6',
      medium: '#F59E0B',
      high: '#F97316', 
      critical: '#EF4444'
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ARIA5.1 Notification</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .priority { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛡️ ARIA5.1 Security Platform</h1>
          <p>Risk Intelligence & Compliance Management</p>
        </div>
        <div class="content">
          <div class="priority" style="background-color: ${priorityColors[data.priority]}; color: white;">
            ${data.priority.toUpperCase()} PRIORITY
          </div>
          <h2 style="margin-top: 20px; color: #1f2937;">${data.title}</h2>
          <p style="color: #4b5563; line-height: 1.6;">${data.message}</p>
          
          ${data.actionUrl ? `
          <div style="margin-top: 30px;">
            <a href="${data.actionUrl}" class="button">Take Action</a>
          </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 6px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              <strong>Recipient:</strong> ${data.user.name} (${data.user.email})<br>
              <strong>Notification Type:</strong> ${data.type}<br>
              <strong>Sent:</strong> ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated notification from ARIA5.1 Security Platform.</p>
          <p>If you believe this was sent in error, please contact your system administrator.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  private generateSecurityAlertHtml(userName: string, alertTitle: string, alertDetails: string, actionUrl?: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Security Alert</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Security Alert</h1>
          <p>ARIA5.1 Security Platform</p>
        </div>
        <div class="content">
          <h2 style="color: #1f2937;">Hello ${userName},</h2>
          <div class="alert-box">
            <h3 style="margin-top: 0; color: #dc2626;">${alertTitle}</h3>
            <p style="color: #991b1b;">${alertDetails}</p>
          </div>
          
          ${actionUrl ? `
          <div style="margin-top: 30px;">
            <a href="${actionUrl}" class="button">Review Security Alert</a>
          </div>
          ` : ''}
          
          <p style="margin-top: 30px; color: #4b5563;">
            Please review this alert immediately and take appropriate action.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated security notification from ARIA5.1.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  private generateRiskNotificationHtml(userName: string, riskTitle: string, riskLevel: string, actionUrl?: string): string {
    const riskColors: Record<string, string> = {
      'low': '#10b981',
      'medium': '#f59e0b',
      'high': '#f97316',
      'critical': '#ef4444'
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Risk Alert</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .risk-level { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; text-transform: uppercase; color: white; }
        .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Risk Alert</h1>
          <p>ARIA5.1 Risk Management</p>
        </div>
        <div class="content">
          <h2 style="color: #1f2937;">Hello ${userName},</h2>
          <p style="color: #4b5563;">A risk requiring your attention has been identified:</p>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #1f2937;">${riskTitle}</h3>
            <div class="risk-level" style="background-color: ${riskColors[riskLevel.toLowerCase()] || '#6b7280'};">
              ${riskLevel} Risk
            </div>
          </div>
          
          ${actionUrl ? `
          <div style="margin-top: 30px;">
            <a href="${actionUrl}" class="button">Review Risk</a>
          </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>This is an automated risk notification from ARIA5.1.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  private generateComplianceReminderHtml(userName: string, frameworkName: string, dueDate: string, actionUrl?: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Compliance Reminder</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .due-date { background: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 6px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Compliance Reminder</h1>
          <p>ARIA5.1 Compliance Management</p>
        </div>
        <div class="content">
          <h2 style="color: #1f2937;">Hello ${userName},</h2>
          <p style="color: #4b5563;">You have a compliance assessment that requires attention:</p>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #1f2937;">${frameworkName}</h3>
            <div class="due-date">
              <strong>Due Date:</strong> ${dueDate}
            </div>
          </div>
          
          ${actionUrl ? `
          <div style="margin-top: 30px;">
            <a href="${actionUrl}" class="button">Complete Assessment</a>
          </div>
          ` : ''}
          
          <p style="margin-top: 30px; color: #4b5563;">
            Please complete your assessment to maintain compliance status.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated compliance notification from ARIA5.1.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  private generateIncidentNotificationHtml(userName: string, incidentTitle: string, severity: string, actionUrl?: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Incident Alert</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .severity { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; text-transform: uppercase; background: #dc2626; color: white; }
        .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔥 Incident Alert</h1>
          <p>ARIA5.1 Incident Management</p>
        </div>
        <div class="content">
          <h2 style="color: #1f2937;">Hello ${userName},</h2>
          <p style="color: #4b5563;">An incident has been reported that requires your immediate attention:</p>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #1f2937;">${incidentTitle}</h3>
            <div class="severity">
              ${severity} Severity
            </div>
          </div>
          
          ${actionUrl ? `
          <div style="margin-top: 30px;">
            <a href="${actionUrl}" class="button">View Incident</a>
          </div>
          ` : ''}
          
          <p style="margin-top: 30px; color: #4b5563;">
            Please respond to this incident promptly according to your incident response procedures.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated incident notification from ARIA5.1.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}

// Notification service that integrates with the database
export class NotificationService {
  private emailService: EmailService;
  private db: any; // DatabaseService instance

  constructor(emailService: EmailService, db: any) {
    this.emailService = emailService;
    this.db = db;
  }

  /**
   * Send notification for high/critical risks
   */
  async notifyHighRisk(riskId: number, userId: number) {
    try {
      const risk = await this.db.getRiskById(riskId);
      const user = await this.db.getUserById(userId);
      
      if (!risk || !user) return false;

      if (risk.risk_score >= 15) { // High or Critical risk
        const riskLevel = risk.risk_score >= 20 ? 'Critical' : 'High';
        
        return await this.emailService.sendRiskNotification(
          user.email,
          user.first_name || user.username,
          risk.title,
          riskLevel,
          `/risks/${riskId}`
        );
      }
      
      return true;
    } catch (error) {
      console.error('Risk notification error:', error);
      return false;
    }
  }

  /**
   * Send notification for new incidents
   */
  async notifyIncident(incidentId: number, assignedUserId: number) {
    try {
      const incident = await this.db.getIncidentById ? await this.db.getIncidentById(incidentId) : null;
      const user = await this.db.getUserById(assignedUserId);
      
      if (!incident || !user) return false;

      return await this.emailService.sendIncidentNotification(
        user.email,
        user.first_name || user.username,
        incident.title,
        incident.severity,
        `/incidents/${incidentId}`
      );
    } catch (error) {
      console.error('Incident notification error:', error);
      return false;
    }
  }

  /**
   * Send security alerts
   */
  async sendSecurityAlert(userIds: number[], alertTitle: string, alertDetails: string) {
    try {
      const users = await Promise.all(
        userIds.map(id => this.db.getUserById(id))
      );

      const notifications = users
        .filter(user => user && user.email)
        .map(user => 
          this.emailService.sendSecurityAlert(
            user.email,
            user.first_name || user.username,
            alertTitle,
            alertDetails,
            '/dashboard'
          )
        );

      const results = await Promise.all(notifications);
      return results.every(result => result);
    } catch (error) {
      console.error('Security alert error:', error);
      return false;
    }
  }
}
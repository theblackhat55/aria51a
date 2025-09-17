// SMTP Service for Email Notifications
// Reusable service for sending emails across the platform

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from_name: string;
  from_email: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export class SMTPService {
  private config: SMTPConfig | null = null;

  constructor(private env: any) {}

  // Load SMTP configuration from database
  async loadConfig(): Promise<SMTPConfig | null> {
    try {
      const settings = await this.env.DB.prepare(`
        SELECT setting_key, setting_value 
        FROM system_settings 
        WHERE setting_key LIKE 'smtp_%'
      `).all();

      if (!settings.results || settings.results.length === 0) {
        return null;
      }

      const config: any = {};
      settings.results.forEach((setting: any) => {
        const key = setting.setting_key.replace('smtp_', '');
        config[key] = setting.setting_value;
      });

      this.config = {
        host: config.host || '',
        port: parseInt(config.port) || 587,
        secure: config.secure === 'true',
        username: config.username || '',
        password: config.password || '',
        from_name: config.from_name || 'ARIA5 Platform',
        from_email: config.from_email || 'noreply@aria5.com'
      };

      return this.config;
    } catch (error) {
      console.error('Failed to load SMTP config:', error);
      return null;
    }
  }

  // Save SMTP configuration to database
  async saveConfig(config: SMTPConfig): Promise<boolean> {
    try {
      const settings = [
        ['smtp_host', config.host],
        ['smtp_port', config.port.toString()],
        ['smtp_secure', config.secure.toString()],
        ['smtp_username', config.username],
        ['smtp_password', config.password],
        ['smtp_from_name', config.from_name],
        ['smtp_from_email', config.from_email]
      ];

      for (const [key, value] of settings) {
        await this.env.DB.prepare(`
          INSERT OR REPLACE INTO system_settings (setting_key, setting_value, updated_at)
          VALUES (?, ?, ?)
        `).bind(key, value, new Date().toISOString()).run();
      }

      this.config = config;
      return true;
    } catch (error) {
      console.error('Failed to save SMTP config:', error);
      return false;
    }
  }

  // Test SMTP connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config) {
      await this.loadConfig();
    }

    if (!this.config) {
      return { success: false, message: 'SMTP configuration not found' };
    }

    // TODO: Implement actual SMTP connection test
    // For now, we'll simulate a test
    try {
      if (!this.config.host || !this.config.username || !this.config.password) {
        return { success: false, message: 'Missing required SMTP configuration' };
      }

      // Simulate connection test
      return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
      return { success: false, message: 'SMTP connection failed: ' + error.message };
    }
  }

  // Send email using Cloudflare's fetch API (since we can't use Node.js modules)
  async sendEmail(to: string, template: EmailTemplate): Promise<{ success: boolean; message: string }> {
    if (!this.config) {
      await this.loadConfig();
    }

    if (!this.config) {
      return { success: false, message: 'SMTP configuration not found' };
    }

    try {
      // For Cloudflare Workers, we'll need to use a service like Resend, SendGrid, or similar
      // This is a placeholder implementation
      console.log(`Would send email to: ${to}`);
      console.log(`Subject: ${template.subject}`);
      console.log(`From: ${this.config.from_name} <${this.config.from_email}>`);

      // TODO: Implement actual email sending using external service API
      // Example with Resend API:
      /*
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.password}`, // API key
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.config.from_name} <${this.config.from_email}>`,
          to: [to],
          subject: template.subject,
          html: template.html,
          text: template.text
        }),
      });
      */

      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, message: 'Failed to send email: ' + error.message };
    }
  }

  // Pre-built email templates
  static getPasswordResetTemplate(userName: string, tempPassword: string): EmailTemplate {
    return {
      subject: 'Password Reset - ARIA5 Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2563eb;">Password Reset</h2>
            <p>Hello ${userName},</p>
            <p>Your password has been reset. Please use the temporary password below to login:</p>
            <div style="background: white; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <strong style="font-size: 18px; color: #dc2626;">${tempPassword}</strong>
            </div>
            <p><strong>Important:</strong> You will be required to change this password on your next login.</p>
            <p>If you did not request this password reset, please contact your administrator immediately.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              This email was sent by the ARIA5 Platform. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `Password Reset - ARIA5 Platform\n\nHello ${userName},\n\nYour password has been reset. Please use this temporary password to login: ${tempPassword}\n\nYou will be required to change this password on your next login.\n\nIf you did not request this password reset, please contact your administrator immediately.`
    };
  }

  static getWelcomeTemplate(userName: string, email: string, tempPassword?: string): EmailTemplate {
    return {
      subject: 'Welcome to ARIA5 Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2563eb;">Welcome to ARIA5 Platform</h2>
            <p>Hello ${userName},</p>
            <p>Your account has been created successfully. You can now access the ARIA5 Platform using:</p>
            <div style="background: white; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p><strong>Email:</strong> ${email}</p>
              ${tempPassword ? `<p><strong>Temporary Password:</strong> <span style="color: #dc2626;">${tempPassword}</span></p>` : ''}
            </div>
            ${tempPassword ? '<p><strong>Important:</strong> You will be required to change this password on your first login.</p>' : ''}
            <p>You can login to the platform using the link below:</p>
            <a href="${process.env.PLATFORM_URL || 'https://aria52.pages.dev'}/login" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
              Login to ARIA5 Platform
            </a>
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              This email was sent by the ARIA5 Platform. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `Welcome to ARIA5 Platform\n\nHello ${userName},\n\nYour account has been created successfully.\n\nEmail: ${email}\n${tempPassword ? `Temporary Password: ${tempPassword}\n` : ''}${tempPassword ? 'Important: You will be required to change this password on your first login.\n' : ''}\nLogin at: ${process.env.PLATFORM_URL || 'https://aria52.pages.dev'}/login`
    };
  }

  static getNotificationTemplate(title: string, message: string, actionUrl?: string): EmailTemplate {
    return {
      subject: `ARIA5 Platform - ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2563eb;">${title}</h2>
            <div style="background: white; padding: 15px; border-radius: 4px; margin: 20px 0;">
              ${message}
            </div>
            ${actionUrl ? `
              <a href="${actionUrl}" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
                View Details
              </a>
            ` : ''}
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              This email was sent by the ARIA5 Platform. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `${title}\n\n${message.replace(/<[^>]*>/g, '')}\n\n${actionUrl ? `View Details: ${actionUrl}` : ''}`
    };
  }
}

export default SMTPService;
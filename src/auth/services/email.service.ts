import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const useTestSmtp = this.configService.get('USE_TEST_SMTP', 'true') === 'true';

    if (useTestSmtp) {
      // Mailtrap SMTP server configuration for testing
      this.transporter = nodemailer.createTransport({
        host: 'sandbox.smtp.mailtrap.io',
        port: 587,
        secure: false,
        auth: {
          user: '30466c28cd5bdb',
          pass: 'ffdd5ada375bc9',
        },
      });
      this.logger.log('Email service initialized with Mailtrap (test mode)');
    } else {
      // SMTP2Go configuration for production
      const smtp2goUser = this.configService.get('SMTP2GO_USER');
      const smtp2goPassword = this.configService.get('SMTP2GO_PASSWORD');

      if (!smtp2goUser || !smtp2goPassword) {
        this.logger.warn('SMTP2Go credentials not configured. Email sending may fail.');
      }

      this.transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP2GO_HOST', 'mail.smtp2go.com'),
        port: parseInt(this.configService.get('SMTP2GO_PORT', '2525'), 10),
        secure: false, // TLS on port 2525
        auth: {
          user: smtp2goUser,
          pass: smtp2goPassword,
        },
      });
      this.logger.log('Email service initialized with SMTP2Go');
    }
  }

  async sendOtpEmail(
    email: string,
    otpCode: string,
    type: 'signin' | 'signup',
  ): Promise<boolean> {
    try {
      const subject =
        type === 'signup'
          ? 'Welcome to Fashionfy - Verify Your Email'
          : 'Fashionfy - Sign In Verification Code';

      const html = this.generateOtpEmailTemplate(email, otpCode, type);

      // Always log the OTP for debugging (in development/testing)
      if (this.configService.get('NODE_ENV') !== 'production') {
        this.logger.log(`
          ═══════════════════════════════════════
          📧 OTP EMAIL (${this.configService.get('NODE_ENV', 'development').toUpperCase()} Mode)
          ═══════════════════════════════════════
          To: ${email}
          Subject: ${subject}
          OTP Code: ${otpCode}
          Type: ${type.toUpperCase()}
          ═══════════════════════════════════════
        `);
      }

      // Send email via SMTP
      await this.sendEmailViaSmtp({
        to: email,
        subject,
        html,
      });

      this.logger.log(`OTP email sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}:`, error);
      return false;
    }
  }

  private generateOtpEmailTemplate(
    email: string,
    otpCode: string,
    type: 'signin' | 'signup',
  ): string {
    const isSignup = type === 'signup';
    const title = isSignup ? 'Welcome to Fashionfy!' : 'Sign In to Fashionfy';
    const message = isSignup
      ? 'Thank you for joining Fashionfy! Please verify your email address to complete your registration.'
      : 'Please use the verification code below to sign in to your Fashionfy account.';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #6366f1;
            margin-bottom: 10px;
          }
          .otp-code {
            background-color: #f3f4f6;
            border: 2px dashed #6366f1;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #6366f1;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background-color: #fef3cd;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">👗 Fashionfy</div>
            <h1>${title}</h1>
          </div>
          
          <p>Hello,</p>
          <p>${message}</p>
          
          <div class="otp-code">
            <p><strong>Your verification code is:</strong></p>
            <div class="code">${otpCode}</div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This code will expire in <strong>10 minutes</strong></li>
              <li>This code can only be used <strong>once</strong></li>
              <li>Never share this code with anyone</li>
              <li>If you didn't request this code, please ignore this email</li>
            </ul>
          </div>
          
          <p>If you have any questions or need help, please contact our support team.</p>
          
          <div class="footer">
            <p>This email was sent to <strong>${email}</strong></p>
            <p>© ${new Date().getFullYear()} Fashionfy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async sendEmailViaSmtp(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('SMTP_FROM', 'noreply@fashly.com'),
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // Log email sending success
      const useTestSmtp = this.configService.get('USE_TEST_SMTP', 'true') === 'true';
      if (useTestSmtp) {
        this.logger.log(`📧 Email sent via Mailtrap to ${options.to}`);
        this.logger.log(`📧 Subject: ${options.subject}`);
        this.logger.log(`📧 Message ID: ${info.messageId}`);
      } else {
        this.logger.log(`📧 Email sent via SMTP2Go to ${options.to}`);
        this.logger.log(`📧 Message ID: ${info.messageId}`);
      }
    } catch (error) {
      this.logger.error(`SMTP send failed:`, error);
      
      // In development, don't throw error, just log it
      if (this.configService.get('NODE_ENV') === 'development') {
        this.logger.warn('Email sending failed in development mode - continuing anyway');
        return;
      }
      
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
    try {
      const subject = 'Welcome to Fashionfy!';
      const html = this.generateWelcomeEmailTemplate(email, name);

      await this.sendEmailViaSmtp({
        to: email,
        subject,
        html,
      });

      this.logger.log(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      return false;
    }
  }

  private generateWelcomeEmailTemplate(email: string, name?: string): string {
    const displayName = name || email.split('@')[0];
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Fashionfy!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #6366f1; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">👗 Fashionfy</div>
            <h1>Welcome to Fashionfy!</h1>
          </div>
          
          <p>Hi ${displayName},</p>
          <p>Welcome to Fashionfy! Your account has been successfully created and verified.</p>
          <p>You can now enjoy all the features of our platform, including virtual try-on and personalized fashion recommendations.</p>
          
          <p>Happy shopping!</p>
          <p>The Fashionfy Team</p>
        </div>
      </body>
      </html>
    `;
  }
}

/**
 * Email Sender with SendGrid Integration
 * Handles sending, tracking, and logging
 */

import sgMail from '@sendgrid/mail';
import * as fs from 'fs';
import * as path from 'path';
import { EMAIL_CONFIG } from './email-config';
import { GeneratedEmail } from './email-generator';

export interface SendResult {
  success: boolean;
  society: string;
  email: string;
  subject: string;
  sentAt: Date;
  error?: string;
  messageId?: string;
}

export interface SendStats {
  totalAttempted: number;
  successfulSends: number;
  failedSends: number;
  startTime: Date;
  endTime?: Date;
  results: SendResult[];
}

export class EmailSender {
  private apiKey: string;
  private logDir: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    sgMail.setApiKey(apiKey);

    // Setup logging directory
    this.logDir = path.join(__dirname, '../data/logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Send a single email
   */
  async sendEmail(generatedEmail: GeneratedEmail): Promise<SendResult> {
    const { society, subject, fullEmail } = generatedEmail;

    if (EMAIL_CONFIG.DRY_RUN_MODE) {
      console.log(`[DRY RUN] Would send to: ${society.email}`);
      return {
        success: true,
        society: society.name,
        email: society.email!,
        subject,
        sentAt: new Date(),
        messageId: 'dry-run-' + Date.now(),
      };
    }

    try {
      const msg = {
        to: society.email!,
        from: {
          email: EMAIL_CONFIG.FROM_EMAIL,
          name: EMAIL_CONFIG.FROM_NAME,
        },
        replyTo: EMAIL_CONFIG.REPLY_TO_EMAIL,
        subject,
        text: fullEmail,
        trackingSettings: {
          clickTracking: {
            enable: EMAIL_CONFIG.TRACK_CLICKS,
          },
          openTracking: {
            enable: EMAIL_CONFIG.TRACK_OPENS,
          },
        },
      };

      const response = await sgMail.send(msg);
      const messageId = response[0].headers['x-message-id'] as string;

      return {
        success: true,
        society: society.name,
        email: society.email!,
        subject,
        sentAt: new Date(),
        messageId,
      };
    } catch (error: any) {
      console.error(`Failed to send to ${society.name}:`, error.message);

      return {
        success: false,
        society: society.name,
        email: society.email!,
        subject,
        sentAt: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Send batch of emails with delay between each
   */
  async sendBatch(generatedEmails: GeneratedEmail[]): Promise<SendStats> {
    const stats: SendStats = {
      totalAttempted: generatedEmails.length,
      successfulSends: 0,
      failedSends: 0,
      startTime: new Date(),
      results: [],
    };

    for (let i = 0; i < generatedEmails.length; i++) {
      const email = generatedEmails[i];

      console.log(`  [${i + 1}/${generatedEmails.length}] Sending to ${email.society.name}...`);

      const result = await this.sendEmail(email);
      stats.results.push(result);

      if (result.success) {
        stats.successfulSends++;
        console.log(`    ✓ Sent successfully`);
      } else {
        stats.failedSends++;
        console.log(`    ✗ Failed: ${result.error}`);
      }

      // Delay between emails (except after last one)
      if (i < generatedEmails.length - 1) {
        await new Promise(resolve =>
          setTimeout(resolve, EMAIL_CONFIG.DELAY_BETWEEN_EMAILS_MS)
        );
      }
    }

    stats.endTime = new Date();

    // Log results
    if (EMAIL_CONFIG.LOG_TO_FILE) {
      this.logSendResults(stats);
    }

    return stats;
  }

  /**
   * Log sending results to file
   */
  private logSendResults(stats: SendStats): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(this.logDir, `send-log-${timestamp}.json`);

    const logData = {
      ...stats,
      config: {
        dryRunMode: EMAIL_CONFIG.DRY_RUN_MODE,
        fromEmail: EMAIL_CONFIG.FROM_EMAIL,
        fromName: EMAIL_CONFIG.FROM_NAME,
      },
    };

    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));

    // Also create a summary CSV
    const csvFile = path.join(this.logDir, `send-log-${timestamp}.csv`);
    const csvRows = [
      'Society,Email,Subject,Status,Sent At,Message ID,Error',
      ...stats.results.map(r =>
        [
          r.society,
          r.email,
          `"${r.subject}"`,
          r.success ? 'Success' : 'Failed',
          r.sentAt.toISOString(),
          r.messageId || '',
          r.error || '',
        ].join(',')
      ),
    ];

    fs.writeFileSync(csvFile, csvRows.join('\n'));

    console.log(`\n✓ Logs saved:`);
    console.log(`  JSON: ${logFile}`);
    console.log(`  CSV: ${csvFile}`);
  }

  /**
   * Get sending statistics summary
   */
  printStats(stats: SendStats): void {
    const duration = stats.endTime
      ? ((stats.endTime.getTime() - stats.startTime.getTime()) / 1000).toFixed(1)
      : 'N/A';

    console.log('\n' + '='.repeat(60));
    console.log('SENDING STATISTICS');
    console.log('='.repeat(60));
    console.log(`Total Attempted: ${stats.totalAttempted}`);
    console.log(`Successful: ${stats.successfulSends} ✓`);
    console.log(`Failed: ${stats.failedSends} ✗`);
    console.log(`Success Rate: ${((stats.successfulSends / stats.totalAttempted) * 100).toFixed(1)}%`);
    console.log(`Duration: ${duration}s`);
    console.log('='.repeat(60));
  }
}

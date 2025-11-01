/**
 * Email Campaign Orchestrator
 * Main script to run the complete email outreach campaign
 *
 * Usage: pnpm run campaign
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as readline from 'readline';
import { EmailGenerator, GeneratedEmail } from './email-generator';
import { EmailSender, SendStats } from './email-sender';
import { CategorizedSociety } from './types';
import { EMAIL_CONFIG } from './email-config';

dotenv.config();

class EmailCampaign {
  private generator: EmailGenerator;
  private sender: EmailSender;
  private societies: CategorizedSociety[] = [];

  constructor() {
    const geminiKey = process.env.GOOGLE_GENAI_API_KEY;
    const sendgridKey = process.env.SENDGRID_API_KEY;

    if (!geminiKey) throw new Error('GOOGLE_GENAI_API_KEY not found in .env');
    if (!sendgridKey) throw new Error('SENDGRID_API_KEY not found in .env');

    this.generator = new EmailGenerator(geminiKey);
    this.sender = new EmailSender(sendgridKey);
  }

  /**
   * Load categorized societies
   */
  loadSocieties(): void {
    const file = path.join(__dirname, '../data/output/imperial_societies_lsn_categorized.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    this.societies = data.categorizedSocieties.filter((s: CategorizedSociety) => s.email);

    console.log(`\n✓ Loaded ${this.societies.length} societies with emails`);
  }

  /**
   * Display campaign overview
   */
  displayOverview(): void {
    const high = this.societies.filter(s => s.outreachPriority === 'high').length;
    const medium = this.societies.filter(s => s.outreachPriority === 'medium').length;
    const low = this.societies.filter(s => s.outreachPriority === 'low').length;

    console.log('\n' + '='.repeat(70));
    console.log('EMAIL CAMPAIGN OVERVIEW');
    console.log('='.repeat(70));
    console.log('\n📊 Society Breakdown:');
    console.log(`   🔴 High Priority:   ${high} societies`);
    console.log(`   🟡 Medium Priority: ${medium} societies`);
    console.log(`   🟢 Low Priority:    ${low} societies`);
    console.log(`   📧 Total:           ${this.societies.length} societies`);

    console.log('\n⚙️  Configuration:');
    console.log(`   From: ${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`);
    console.log(`   Batch Size: ${EMAIL_CONFIG.BATCH_SIZE} emails`);
    console.log(`   Delay Between Emails: ${EMAIL_CONFIG.DELAY_BETWEEN_EMAILS_MS}ms`);
    console.log(`   Dry Run Mode: ${EMAIL_CONFIG.DRY_RUN_MODE ? 'ON ⚠️' : 'OFF'}`);
    console.log(`   Track Opens: ${EMAIL_CONFIG.TRACK_OPENS ? 'Yes' : 'No'}`);
    console.log(`   Track Clicks: ${EMAIL_CONFIG.TRACK_CLICKS ? 'Yes' : 'No'}`);

    console.log('\n📝 Email Style:');
    console.log(`   Tone: ${EMAIL_CONFIG.EMAIL_STYLE.TONE}`);
    console.log(`   Length: ${EMAIL_CONFIG.EMAIL_STYLE.LENGTH}`);
    console.log(`   Style: ${EMAIL_CONFIG.EMAIL_STYLE.STYLE}`);
  }

  /**
   * Filter societies for campaign
   */
  async selectSocieties(): Promise<CategorizedSociety[]> {
    console.log('\n' + '='.repeat(70));
    console.log('SELECT SOCIETIES TO CONTACT');
    console.log('='.repeat(70));

    const answer = await this.prompt(
      '\nWhich societies do you want to contact?\n' +
      '  1. All societies (360)\n' +
      '  2. High priority only (60)\n' +
      '  3. High + Medium priority (291)\n' +
      '  4. Custom filter\n' +
      '  5. Test with single society (Neurotechnology)\n\n' +
      'Enter choice [1-5]: '
    );

    switch (answer.trim()) {
      case '1':
        return this.societies;
      case '2':
        return this.societies.filter(s => s.outreachPriority === 'high');
      case '3':
        return this.societies.filter(s =>
          s.outreachPriority === 'high' || s.outreachPriority === 'medium'
        );
      case '4':
        return await this.customFilter();
      case '5':
        const neurotech = this.societies.find(s => s.name === 'Neurotechnology');
        return neurotech ? [neurotech] : [];
      default:
        console.log('Invalid choice, defaulting to High priority only');
        return this.societies.filter(s => s.outreachPriority === 'high');
    }
  }

  /**
   * Custom filtering (interactive)
   */
  private async customFilter(): Promise<CategorizedSociety[]> {
    const minScore = await this.prompt('Minimum relevance score (1-10): ');
    const score = parseInt(minScore) || 5;

    return this.societies.filter(s => s.relevanceScore >= score);
  }

  /**
   * Generate and review emails for a batch
   */
  async generateAndReviewBatch(
    societies: CategorizedSociety[],
    batchNum: number
  ): Promise<GeneratedEmail[]> {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`BATCH ${batchNum}: GENERATING ${societies.length} EMAILS`);
    console.log('='.repeat(70));

    console.log('\n⏳ Generating emails with AI...\n');

    const generatedEmails = await this.generator.generateBatch(societies);

    console.log(`\n✓ Generated ${generatedEmails.length} emails`);

    // Display for review
    console.log('\n' + '='.repeat(70));
    console.log('EMAIL PREVIEW');
    console.log('='.repeat(70));

    for (let i = 0; i < generatedEmails.length; i++) {
      const email = generatedEmails[i];
      console.log(`\n[${i + 1}/${generatedEmails.length}] ${email.society.name}`);
      console.log(`To: ${email.society.email}`);
      console.log(`Subject: ${email.subject}`);
      console.log(`\n${email.fullEmail}`);
      console.log('\n' + '-'.repeat(70));
    }

    return generatedEmails;
  }

  /**
   * Run the complete campaign
   */
  async run(): Promise<void> {
    console.clear();
    console.log('╔' + '═'.repeat(68) + '╗');
    console.log('║' + ' '.repeat(15) + 'LSN EMAIL OUTREACH CAMPAIGN' + ' '.repeat(26) + '║');
    console.log('╚' + '═'.repeat(68) + '╝');

    this.loadSocieties();
    this.displayOverview();

    // Select societies
    const selectedSocieties = await this.selectSocieties();
    console.log(`\n✓ Selected ${selectedSocieties.length} societies for outreach`);

    if (selectedSocieties.length === 0) {
      console.log('\n⚠️  No societies selected. Exiting.');
      return;
    }

    // Confirm to proceed
    if (EMAIL_CONFIG.REQUIRE_INITIAL_APPROVAL) {
      const confirm = await this.prompt(
        `\n⚠️  About to generate and send ${selectedSocieties.length} emails.\n` +
        `Proceed? [yes/no]: `
      );

      if (confirm.toLowerCase() !== 'yes') {
        console.log('\n❌ Campaign cancelled.');
        return;
      }
    }

    // Process in batches
    const batchSize = EMAIL_CONFIG.BATCH_SIZE;
    const batches: CategorizedSociety[][] = [];

    for (let i = 0; i < selectedSocieties.length; i += batchSize) {
      batches.push(selectedSocieties.slice(i, i + batchSize));
    }

    console.log(`\n📦 Processing ${batches.length} batches of up to ${batchSize} emails`);

    const allStats: SendStats[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNum = i + 1;

      // Generate emails
      const generatedEmails = await this.generateAndReviewBatch(batch, batchNum);

      // Confirm sending
      const sendConfirm = await this.prompt(
        `\n📧 Send batch ${batchNum}/${batches.length} (${generatedEmails.length} emails)? [yes/no]: `
      );

      if (sendConfirm.toLowerCase() !== 'yes') {
        console.log(`\n⏭️  Skipped batch ${batchNum}`);
        continue;
      }

      // Send batch
      console.log(`\n📨 Sending batch ${batchNum}...`);
      const stats = await this.sender.sendBatch(generatedEmails);
      allStats.push(stats);

      this.sender.printStats(stats);

      // Delay before next batch (if not last batch)
      if (i < batches.length - 1 && EMAIL_CONFIG.DELAY_BETWEEN_BATCHES_MS > 0) {
        const delaySeconds = EMAIL_CONFIG.DELAY_BETWEEN_BATCHES_MS / 1000;
        console.log(`\n⏳ Waiting ${delaySeconds}s before next batch...`);
        await new Promise(resolve =>
          setTimeout(resolve, EMAIL_CONFIG.DELAY_BETWEEN_BATCHES_MS)
        );
      }
    }

    // Final summary
    this.printCampaignSummary(allStats);
  }

  /**
   * Print final campaign summary
   */
  private printCampaignSummary(allStats: SendStats[]): void {
    const totalAttempted = allStats.reduce((sum, s) => sum + s.totalAttempted, 0);
    const totalSuccess = allStats.reduce((sum, s) => sum + s.successfulSends, 0);
    const totalFailed = allStats.reduce((sum, s) => sum + s.failedSends, 0);

    console.log('\n\n');
    console.log('╔' + '═'.repeat(68) + '╗');
    console.log('║' + ' '.repeat(20) + 'CAMPAIGN COMPLETE' + ' '.repeat(31) + '║');
    console.log('╚' + '═'.repeat(68) + '╝');

    console.log('\n📊 Final Statistics:');
    console.log(`   Total Emails Attempted: ${totalAttempted}`);
    console.log(`   Successful Sends: ${totalSuccess} ✓`);
    console.log(`   Failed Sends: ${totalFailed} ✗`);
    console.log(`   Success Rate: ${((totalSuccess / totalAttempted) * 100).toFixed(1)}%`);

    console.log('\n📁 Logs saved to: data/logs/');
    console.log('\n✅ Campaign finished!\n');
  }

  /**
   * Helper: prompt user for input
   */
  private prompt(question: string): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise(resolve => {
      rl.question(question, answer => {
        rl.close();
        resolve(answer);
      });
    });
  }
}

// Main execution
if (require.main === module) {
  const campaign = new EmailCampaign();
  campaign.run().catch(console.error);
}

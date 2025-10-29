/**
 * Main Pipeline for Imperial Society Email Scraping & Categorization
 *
 * This script orchestrates:
 * 1. Scraping all Imperial College societies
 * 2. Extracting emails and metadata
 * 3. AI-powered categorization for targeted outreach
 * 4. Export to structured files
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { ImperialSocietyScraper } from './scraper';
import { SocietyCategorizer } from './categorizer';

// Load environment variables
dotenv.config();

async function main() {
  console.log('='.repeat(60));
  console.log('IMPERIAL COLLEGE SOCIETY EMAIL SCRAPER');
  console.log('London Student Network - Cold Outreach Campaign');
  console.log('='.repeat(60));

  // Ensure output directory exists
  const outputDir = path.join(__dirname, '../data/output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // ========================================
    // PHASE 1: SCRAPING
    // ========================================
    console.log('\n[PHASE 1] Scraping Imperial College Societies');
    console.log('-'.repeat(60));

    const scraper = new ImperialSocietyScraper();

    // Scrape all societies (or limit with maxSocieties option)
    const scrapingResult = await scraper.scrapeAll({
      // maxSocieties: 10, // Uncomment to test with limited societies
      delayMs: 1500, // 1.5s delay between requests
    });

    // Save raw scraping results
    const scrapingFile = path.join(outputDir, 'imperial_societies_raw.json');
    fs.writeFileSync(scrapingFile, JSON.stringify(scrapingResult, null, 2));
    console.log(`\n✓ Raw results saved to: ${scrapingFile}`);

    if (!scrapingResult.success) {
      console.error('\n✗ Scraping failed. Exiting pipeline.');
      process.exit(1);
    }

    // ========================================
    // PHASE 2: AI CATEGORIZATION
    // ========================================
    console.log('\n[PHASE 2] AI-Powered Categorization');
    console.log('-'.repeat(60));

    const apiKey = process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      console.warn('\n⚠ No GOOGLE_GENAI_API_KEY found. Skipping AI categorization.');
      console.warn('Set the API key in .env file to enable smart categorization.');

      // Save societies without categorization
      const basicFile = path.join(outputDir, 'imperial_societies_basic.json');
      fs.writeFileSync(
        basicFile,
        JSON.stringify({
          societies: scrapingResult.societies,
          metadata: {
            total: scrapingResult.societiesScraped,
            withEmails: scrapingResult.societiesWithEmails,
            timestamp: scrapingResult.timestamp,
          },
        }, null, 2)
      );
      console.log(`✓ Basic results saved to: ${basicFile}`);
      process.exit(0);
    }

    const categorizer = new SocietyCategorizer(apiKey);

    // Filter to societies with emails only for categorization
    const societiesWithEmails = scrapingResult.societies.filter(s => s.email !== null);
    console.log(`\nCategorizing ${societiesWithEmails.length} societies with emails...`);

    const categorizationResult = await categorizer.categorizeSocieties(societiesWithEmails);

    // Save categorized results
    const categorizedFile = path.join(outputDir, 'imperial_societies_categorized.json');
    fs.writeFileSync(categorizedFile, JSON.stringify(categorizationResult, null, 2));
    console.log(`✓ Categorized results saved to: ${categorizedFile}`);

    // ========================================
    // PHASE 3: GENERATE OUTREACH STRATEGY
    // ========================================
    console.log('\n[PHASE 3] Generating Outreach Strategy');
    console.log('-'.repeat(60));

    const segments = categorizer.generateOutreachSegments(
      categorizationResult.categorizedSocieties
    );

    // Save segmented lists for outreach
    const tier1File = path.join(outputDir, 'tier1_high_priority.json');
    const tier2File = path.join(outputDir, 'tier2_medium_priority.json');
    const tier3File = path.join(outputDir, 'tier3_low_priority.json');

    fs.writeFileSync(tier1File, JSON.stringify(segments.tier1, null, 2));
    fs.writeFileSync(tier2File, JSON.stringify(segments.tier2, null, 2));
    fs.writeFileSync(tier3File, JSON.stringify(segments.tier3, null, 2));

    console.log(`✓ Tier 1 (High Priority): ${segments.tier1.length} societies → ${tier1File}`);
    console.log(`✓ Tier 2 (Medium Priority): ${segments.tier2.length} societies → ${tier2File}`);
    console.log(`✓ Tier 3 (Low Priority): ${segments.tier3.length} societies → ${tier3File}`);

    // Generate and save CSV for easy email client import
    const csvFile = path.join(outputDir, 'outreach_contacts.csv');
    const csvContent = generateCSV(categorizationResult.categorizedSocieties);
    fs.writeFileSync(csvFile, csvContent);
    console.log(`✓ CSV export saved to: ${csvFile}`);

    // Generate summary report
    const report = categorizer.generateSummaryReport(categorizationResult.categorizedSocieties);
    const reportFile = path.join(outputDir, 'OUTREACH_STRATEGY.md');
    fs.writeFileSync(reportFile, report);
    console.log(`✓ Strategy report saved to: ${reportFile}`);

    // ========================================
    // PHASE 4: SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('PIPELINE COMPLETE');
    console.log('='.repeat(60));
    console.log('\n📊 Final Statistics:');
    console.log(`   Total Societies: ${scrapingResult.totalSocieties}`);
    console.log(`   Successfully Scraped: ${scrapingResult.societiesScraped}`);
    console.log(`   With Email Addresses: ${scrapingResult.societiesWithEmails}`);
    console.log(`   High Priority Targets: ${segments.tier1.length}`);
    console.log(`   Medium Priority: ${segments.tier2.length}`);
    console.log(`   Low Priority: ${segments.tier3.length}`);

    console.log('\n📁 Output Files:');
    console.log(`   1. ${scrapingFile}`);
    console.log(`   2. ${categorizedFile}`);
    console.log(`   3. ${tier1File}`);
    console.log(`   4. ${tier2File}`);
    console.log(`   5. ${tier3File}`);
    console.log(`   6. ${csvFile}`);
    console.log(`   7. ${reportFile}`);

    console.log('\n🎯 Next Steps:');
    console.log('   1. Review OUTREACH_STRATEGY.md for prioritized contact list');
    console.log('   2. Start with Tier 1 societies (high priority)');
    console.log('   3. Use suggested approaches for personalized outreach');
    console.log('   4. Import outreach_contacts.csv into your email client');

    console.log('\n✓ All done! Happy networking!\n');

  } catch (error) {
    console.error('\n✗ Pipeline failed with error:');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Generate CSV file for email client import
 */
function generateCSV(societies: any[]): string {
  const headers = [
    'Name',
    'Email',
    'Category',
    'Priority',
    'Relevance Score',
    'Target Audience',
    'Suggested Approach',
    'Member Count',
    'URL',
  ];

  const rows = societies
    .filter(s => s.email !== null)
    .map(s => [
      escapeCSV(s.name),
      s.email,
      escapeCSV(s.category),
      s.outreachPriority,
      s.relevanceScore,
      escapeCSV(s.targetAudience.join('; ')),
      escapeCSV(s.suggestedApproach),
      s.memberCount || '',
      s.url,
    ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Escape CSV values
 */
function escapeCSV(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Run the pipeline
if (require.main === module) {
  main().catch(console.error);
}

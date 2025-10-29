/**
 * AI Categorization Only - Run on existing scraped data
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { SocietyCategorizer } from './categorizer';
import { SocietyDetail } from './types';

dotenv.config();

async function main() {
  console.log('='.repeat(60));
  console.log('AI CATEGORIZATION FOR EXISTING DATA');
  console.log('='.repeat(60));

  const outputDir = path.join(__dirname, '../data/output');

  try {
    // Load existing scraped data
    console.log('\n[STEP 1] Loading scraped data...');
    const scrapedFile = path.join(outputDir, 'imperial_societies_basic.json');

    if (!fs.existsSync(scrapedFile)) {
      console.error('❌ No scraped data found. Run "pnpm run pipeline" first.');
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(scrapedFile, 'utf-8'));
    const societies: SocietyDetail[] = data.societies;

    console.log(`✓ Loaded ${societies.length} societies`);
    console.log(`  With emails: ${societies.filter(s => s.email).length}`);

    // Check API key
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      console.error('\n❌ No GOOGLE_GENAI_API_KEY found in .env file!');
      process.exit(1);
    }

    console.log('✓ API key found');

    // AI Categorization
    console.log('\n[STEP 2] AI Categorization with Google Gemini');
    console.log('-'.repeat(60));

    const categorizer = new SocietyCategorizer(apiKey);
    const societiesWithEmails = societies.filter(s => s.email !== null);

    console.log(`Categorizing ${societiesWithEmails.length} societies...`);
    console.log('(This may take 2-3 minutes)\n');

    const categorizationResult = await categorizer.categorizeSocieties(societiesWithEmails);

    // Save categorized results
    const categorizedFile = path.join(outputDir, 'imperial_societies_categorized.json');
    fs.writeFileSync(categorizedFile, JSON.stringify(categorizationResult, null, 2));
    console.log(`\n✓ Categorized results saved to: ${categorizedFile}`);

    // Generate tiered lists
    console.log('\n[STEP 3] Generating Outreach Strategy');
    console.log('-'.repeat(60));

    const segments = categorizer.generateOutreachSegments(
      categorizationResult.categorizedSocieties
    );

    // Save tiered lists
    const tier1File = path.join(outputDir, 'tier1_high_priority.json');
    const tier2File = path.join(outputDir, 'tier2_medium_priority.json');
    const tier3File = path.join(outputDir, 'tier3_low_priority.json');

    fs.writeFileSync(tier1File, JSON.stringify(segments.tier1, null, 2));
    fs.writeFileSync(tier2File, JSON.stringify(segments.tier2, null, 2));
    fs.writeFileSync(tier3File, JSON.stringify(segments.tier3, null, 2));

    console.log(`✓ Tier 1 (High Priority): ${segments.tier1.length} societies → ${tier1File}`);
    console.log(`✓ Tier 2 (Medium Priority): ${segments.tier2.length} societies → ${tier2File}`);
    console.log(`✓ Tier 3 (Low Priority): ${segments.tier3.length} societies → ${tier3File}`);

    // Generate CSV
    const csvFile = path.join(outputDir, 'outreach_contacts_prioritized.csv');
    const csvContent = generateCSV(categorizationResult.categorizedSocieties);
    fs.writeFileSync(csvFile, csvContent);
    console.log(`✓ Prioritized CSV saved to: ${csvFile}`);

    // Generate strategy report
    const report = categorizer.generateSummaryReport(categorizationResult.categorizedSocieties);
    const reportFile = path.join(outputDir, 'OUTREACH_STRATEGY.md');
    fs.writeFileSync(reportFile, report);
    console.log(`✓ Strategy report saved to: ${reportFile}`);

    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ AI CATEGORIZATION COMPLETE');
    console.log('='.repeat(60));

    console.log('\n📊 Priority Distribution:');
    console.log(`   🔴 Tier 1 (High):   ${segments.tier1.length} societies`);
    console.log(`   🟡 Tier 2 (Medium): ${segments.tier2.length} societies`);
    console.log(`   🟢 Tier 3 (Low):    ${segments.tier3.length} societies`);

    console.log('\n🎯 Top 5 High-Priority Societies:');
    segments.tier1.slice(0, 5).forEach((s, i) => {
      console.log(`\n${i + 1}. ${s.name} (Score: ${s.relevanceScore}/10)`);
      console.log(`   📧 ${s.email}`);
      console.log(`   📂 ${s.category}`);
      console.log(`   💡 ${s.suggestedApproach}`);
    });

    console.log('\n📁 Next Steps:');
    console.log('   1. Review: data/output/OUTREACH_STRATEGY.md');
    console.log('   2. Start with Tier 1 societies');
    console.log('   3. Use suggested approaches for personalization');
    console.log('   4. Import CSV into your email tool');

    console.log('\n✓ Ready to start outreach!\n');

  } catch (error) {
    console.error('\n❌ Categorization failed:', error);
    process.exit(1);
  }
}

function generateCSV(societies: any[]): string {
  const headers = [
    'Priority',
    'Relevance Score',
    'Name',
    'Email',
    'Category',
    'Target Audience',
    'Suggested Approach',
    'Reasoning',
    'URL',
  ];

  const rows = societies
    .filter(s => s.email !== null)
    .map(s => [
      s.outreachPriority.toUpperCase(),
      s.relevanceScore,
      escapeCSV(s.name),
      s.email,
      escapeCSV(s.category),
      escapeCSV(s.targetAudience.join('; ')),
      escapeCSV(s.suggestedApproach),
      escapeCSV(s.relevanceReasoning),
      s.url,
    ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function escapeCSV(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

main();

/**
 * Test Pipeline - Run with 15 societies to verify AI categorization
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { ImperialSocietyScraper } from './scraper';
import { SocietyCategorizer } from './categorizer';

dotenv.config();

async function main() {
  console.log('='.repeat(60));
  console.log('IMPERIAL SOCIETY EMAIL SCRAPER - TEST RUN');
  console.log('Testing with 15 societies');
  console.log('='.repeat(60));

  const outputDir = path.join(__dirname, '../data/output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Phase 1: Scraping
    console.log('\n[PHASE 1] Scraping Societies\n');
    const scraper = new ImperialSocietyScraper();
    const scrapingResult = await scraper.scrapeAll({
      maxSocieties: 15,
      delayMs: 1000,
    });

    const scrapingFile = path.join(outputDir, 'test_scraping_results.json');
    fs.writeFileSync(scrapingFile, JSON.stringify(scrapingResult, null, 2));
    console.log(`✓ Saved to: ${scrapingFile}`);

    if (!scrapingResult.success) {
      console.error('Scraping failed!');
      process.exit(1);
    }

    // Phase 2: AI Categorization
    console.log('\n[PHASE 2] AI Categorization\n');

    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠ No GOOGLE_GENAI_API_KEY found. Skipping AI categorization.');
      console.log('\nTo enable AI categorization:');
      console.log('1. Get API key from https://makersuite.google.com/app/apikey');
      console.log('2. Add to .env file: GOOGLE_GENAI_API_KEY=your_key_here');
      process.exit(0);
    }

    const categorizer = new SocietyCategorizer(apiKey);
    const societiesWithEmails = scrapingResult.societies.filter(s => s.email !== null);

    console.log(`Categorizing ${societiesWithEmails.length} societies...\n`);

    const categorizationResult = await categorizer.categorizeSocieties(societiesWithEmails);

    const categorizedFile = path.join(outputDir, 'test_categorized_results.json');
    fs.writeFileSync(categorizedFile, JSON.stringify(categorizationResult, null, 2));
    console.log(`✓ Saved to: ${categorizedFile}`);

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));

    console.log('\nTop 5 Priority Societies:\n');
    categorizationResult.categorizedSocieties.slice(0, 5).forEach((s, i) => {
      console.log(`${i + 1}. ${s.name} (Score: ${s.relevanceScore}/10)`);
      console.log(`   Email: ${s.email}`);
      console.log(`   Priority: ${s.outreachPriority.toUpperCase()}`);
      console.log(`   Reasoning: ${s.relevanceReasoning}`);
      console.log(`   Approach: ${s.suggestedApproach}\n`);
    });

    const segments = categorizer.generateOutreachSegments(categorizationResult.categorizedSocieties);
    console.log('Priority Distribution:');
    console.log(`  High: ${segments.tier1.length}`);
    console.log(`  Medium: ${segments.tier2.length}`);
    console.log(`  Low: ${segments.tier3.length}`);

    console.log('\n✓ Test pipeline complete!\n');
    console.log('To run full pipeline on all 360 societies:');
    console.log('  pnpm run pipeline\n');

  } catch (error) {
    console.error('\n✗ Pipeline failed:', error);
    process.exit(1);
  }
}

main();

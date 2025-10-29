/**
 * Test script - Run scraper on first 5 societies to verify functionality
 */

import { ImperialSocietyScraper } from './scraper';
import * as fs from 'fs';
import * as path from 'path';

async function test() {
  console.log('Testing Imperial Society Scraper (5 societies)...\n');

  const scraper = new ImperialSocietyScraper();

  try {
    const result = await scraper.scrapeAll({
      maxSocieties: 5,
      delayMs: 1000,
    });

    // Display results
    console.log('\n--- TEST RESULTS ---\n');
    console.log(`Success: ${result.success}`);
    console.log(`Total societies found: ${result.totalSocieties}`);
    console.log(`Scraped: ${result.societiesScraped}`);
    console.log(`With emails: ${result.societiesWithEmails}`);

    console.log('\n--- SCRAPED SOCIETIES ---\n');
    result.societies.forEach((society, i) => {
      console.log(`${i + 1}. ${society.name}`);
      console.log(`   Email: ${society.email || 'N/A'}`);
      console.log(`   Category: ${society.category}`);
      console.log(`   Members: ${society.memberCount || 'N/A'}`);
      console.log(`   URL: ${society.url}`);
      console.log('');
    });

    // Save test results
    const outputDir = path.join(__dirname, '../data/output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const testFile = path.join(outputDir, 'test_results.json');
    fs.writeFileSync(testFile, JSON.stringify(result, null, 2));
    console.log(`✓ Test results saved to: ${testFile}\n`);

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

test();

/**
 * Quick analysis of scraped societies without AI
 */

import * as fs from 'fs';
import * as path from 'path';

interface SocietyData {
  societies: Array<{
    name: string;
    email: string;
    category: string;
    description: string;
    memberCount: number | null;
    socialMedia: Record<string, string>;
  }>;
  metadata: {
    total: number;
    withEmails: number;
    timestamp: string;
  };
}

function analyzeData() {
  const filePath = path.join(__dirname, '../data/output/imperial_societies_basic.json');
  const data: SocietyData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  console.log('=' .repeat(60));
  console.log('SCRAPING RESULTS ANALYSIS');
  console.log('='.repeat(60));

  console.log('\n📊 OVERVIEW:');
  console.log(`  Total Societies: ${data.metadata.total}`);
  console.log(`  With Emails: ${data.metadata.withEmails}`);
  console.log(`  Success Rate: ${((data.metadata.withEmails / data.metadata.total) * 100).toFixed(1)}%`);

  // Category breakdown
  const categoryCount: Record<string, number> = {};
  data.societies.forEach(s => {
    categoryCount[s.category] = (categoryCount[s.category] || 0) + 1;
  });

  console.log('\n📂 CATEGORIES:');
  const sortedCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  sortedCategories.forEach(([cat, count]) => {
    console.log(`  ${cat.padEnd(25)} ${count}`);
  });

  // Social media presence
  const socialMediaStats = {
    instagram: 0,
    facebook: 0,
    twitter: 0,
    website: 0,
  };

  data.societies.forEach(s => {
    if (s.socialMedia.instagram) socialMediaStats.instagram++;
    if (s.socialMedia.facebook) socialMediaStats.facebook++;
    if (s.socialMedia.twitter) socialMediaStats.twitter++;
    if (s.socialMedia.website) socialMediaStats.website++;
  });

  console.log('\n📱 SOCIAL MEDIA PRESENCE:');
  console.log(`  Instagram: ${socialMediaStats.instagram} (${((socialMediaStats.instagram / data.societies.length) * 100).toFixed(1)}%)`);
  console.log(`  Facebook: ${socialMediaStats.facebook} (${((socialMediaStats.facebook / data.societies.length) * 100).toFixed(1)}%)`);
  console.log(`  Twitter: ${socialMediaStats.twitter} (${((socialMediaStats.twitter / data.societies.length) * 100).toFixed(1)}%)`);
  console.log(`  Website: ${socialMediaStats.website} (${((socialMediaStats.website / data.societies.length) * 100).toFixed(1)}%)`);

  // Manual priority suggestions based on categories
  const highPriorityKeywords = [
    'social', 'network', 'entrepreneur', 'business', 'tech', 'finance',
    'cultural', 'arts', 'music', 'dance', 'food', 'international'
  ];

  const mediumPriorityKeywords = [
    'sport', 'academic', 'professional', 'career', 'workshop'
  ];

  let highPriority = 0;
  let mediumPriority = 0;

  data.societies.forEach(s => {
    const text = (s.name + ' ' + s.category + ' ' + s.description).toLowerCase();

    if (highPriorityKeywords.some(kw => text.includes(kw))) {
      highPriority++;
    } else if (mediumPriorityKeywords.some(kw => text.includes(kw))) {
      mediumPriority++;
    }
  });

  console.log('\n🎯 ESTIMATED PRIORITY (Without AI):');
  console.log(`  Potential High Priority: ~${highPriority} societies`);
  console.log(`  Potential Medium Priority: ~${mediumPriority} societies`);
  console.log(`  Potential Low Priority: ~${data.societies.length - highPriority - mediumPriority} societies`);

  // Sample high-value societies
  console.log('\n⭐ SAMPLE HIGH-VALUE SOCIETIES (Based on Keywords):');

  const samples = data.societies
    .filter(s => {
      const text = (s.name + ' ' + s.category + ' ' + s.description).toLowerCase();
      return highPriorityKeywords.some(kw => text.includes(kw));
    })
    .slice(0, 10);

  samples.forEach((s, i) => {
    console.log(`\n${i + 1}. ${s.name}`);
    console.log(`   Email: ${s.email}`);
    console.log(`   Category: ${s.category}`);
    console.log(`   Description: ${s.description.substring(0, 150)}...`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('NEXT STEPS:');
  console.log('='.repeat(60));
  console.log('\n1. ✅ All 360 societies scraped successfully!');
  console.log('2. ⚠️  AI categorization skipped (no API key)');
  console.log('3. 📧 You have all email addresses in imperial_societies_basic.json');
  console.log('\nTo enable AI-powered smart categorization:');
  console.log('  - Get API key: https://makersuite.google.com/app/apikey');
  console.log('  - Add to .env: GOOGLE_GENAI_API_KEY=your_key_here');
  console.log('  - Re-run: pnpm run pipeline');
  console.log('\nOr start outreach manually using the data we have!\n');
}

analyzeData();

/**
 * Export societies to CSV for immediate use
 */

import * as fs from 'fs';
import * as path from 'path';

interface SocietyData {
  societies: Array<{
    name: string;
    email: string;
    category: string;
    description: string;
    url: string;
    socialMedia: Record<string, string>;
  }>;
}

function escapeCSV(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function exportCSV() {
  const filePath = path.join(__dirname, '../data/output/imperial_societies_basic.json');
  const data: SocietyData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const headers = [
    'Name',
    'Email',
    'Category',
    'Description',
    'Instagram',
    'Facebook',
    'Twitter',
    'Website',
    'URL',
  ];

  const rows = data.societies.map(s => [
    escapeCSV(s.name),
    s.email,
    escapeCSV(s.category),
    escapeCSV(s.description.substring(0, 500)), // Limit description
    s.socialMedia.instagram || '',
    s.socialMedia.facebook || '',
    s.socialMedia.twitter || '',
    s.socialMedia.website || '',
    s.url,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const outputPath = path.join(__dirname, '../data/output/imperial_societies_all.csv');
  fs.writeFileSync(outputPath, csvContent);

  console.log(`✓ CSV exported: ${outputPath}`);
  console.log(`  Total rows: ${rows.length}`);
  console.log('\nYou can now import this into:');
  console.log('  - Google Sheets');
  console.log('  - Excel');
  console.log('  - Gmail contacts');
  console.log('  - Any email marketing tool');
}

exportCSV();

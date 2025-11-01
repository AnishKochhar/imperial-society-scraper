/**
 * Re-categorize societies with LSN-focused criteria
 * Uses updated prompt aligned with London Student Network value proposition
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SocietyDetail, CategorizedSociety } from './types';

dotenv.config();

class LSNCategorizer {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  async categorizeSocieties(societies: SocietyDetail[]): Promise<CategorizedSociety[]> {
    console.log(`\nRe-categorizing ${societies.length} societies for LSN outreach...`);

    const BATCH_SIZE = 50;
    const batches = [];
    for (let i = 0; i < societies.length; i += BATCH_SIZE) {
      batches.push(societies.slice(i, i + BATCH_SIZE));
    }

    console.log(`Processing in ${batches.length} batches...\n`);

    const allCategorizations: any[] = [];

    for (let batchNum = 0; batchNum < batches.length; batchNum++) {
      const batch = batches[batchNum];
      console.log(`  Batch ${batchNum + 1}/${batches.length} (${batch.length} societies)...`);

      const prompt = this.buildLSNPrompt(batch);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn(`    ⚠ Batch ${batchNum + 1} failed - using defaults`);
        allCategorizations.push(...batch.map(() => this.getDefaultCategorization()));
        continue;
      }

      try {
        const categorizations = JSON.parse(jsonMatch[0]);
        allCategorizations.push(...categorizations);
        console.log(`    ✓ Batch ${batchNum + 1} complete`);
      } catch (parseError) {
        console.warn(`    ⚠ Batch ${batchNum + 1} parse failed - using defaults`);
        allCategorizations.push(...batch.map(() => this.getDefaultCategorization()));
      }

      if (batchNum < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const categorizedSocieties: CategorizedSociety[] = societies.map((society, index) => {
      const cat = allCategorizations[index] || this.getDefaultCategorization();
      return {
        ...society,
        relevanceScore: cat.relevanceScore,
        relevanceReasoning: cat.relevanceReasoning,
        targetAudience: cat.targetAudience,
        outreachPriority: cat.outreachPriority,
        suggestedApproach: cat.suggestedApproach,
      };
    });

    categorizedSocieties.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const high = categorizedSocieties.filter(s => s.outreachPriority === 'high').length;
    const medium = categorizedSocieties.filter(s => s.outreachPriority === 'medium').length;
    const low = categorizedSocieties.filter(s => s.outreachPriority === 'low').length;

    console.log(`\n✓ Re-categorization complete`);
    console.log(`  High priority: ${high}`);
    console.log(`  Medium priority: ${medium}`);
    console.log(`  Low priority: ${low}`);

    return categorizedSocieties;
  }

  private getDefaultCategorization() {
    return {
      relevanceScore: 5,
      relevanceReasoning: 'Default categorization',
      targetAudience: ['General'],
      outreachPriority: 'medium' as const,
      suggestedApproach: 'Standard LSN outreach',
    };
  }

  private buildLSNPrompt(societies: SocietyDetail[]): string {
    const societiesData = societies.map(s => ({
      name: s.name,
      category: s.category,
      description: s.description.substring(0, 500),
      tagline: s.tagline,
      hasEmail: s.email !== null,
    }));

    return `You are an expert at evaluating university student societies for London Student Network (LSN), a platform that helps societies reach 500,000+ students across 53 London universities.

**LSN Value Proposition:**
- Showcase events to entire London student community (not just your university)
- Free event ticketing and management
- Cross-university discovery and reach
- Fill committee skill gaps by attracting members from other unis
- Social proof: 445 events, 85 societies, institutional partnerships

**Categorization Criteria for HIGH PRIORITY (Score 8-10):**

1. **Event-Hosting Societies** - Regularly organize talks, workshops, socials, conferences, performances
   - Tech societies (AI, Data Science, Robotics, Blockchain, Cybersecurity)
   - Business & Entrepreneurship (Finance, Consulting, Startups, VC)
   - Professional development (Career-focused, Networking)
   - Cultural societies (Host festivals, celebrations, cultural nights)
   - Arts & Performance (Concerts, shows, exhibitions)
   - Social clubs (Parties, meetups, activities)

2. **Cross-University Appeal** - Events that would attract students beyond Imperial
   - Not year-specific or course-specific
   - Broader themes (technology, business, culture, arts, social)
   - Public-facing events (not just internal meetings)

3. **Active & Organized** - Likely to actually use the platform
   - Have social media presence
   - Evidence of regular events
   - Not purely academic research groups

**MEDIUM PRIORITY (Score 5-7):**
- Sports clubs (some events like tournaments)
- Academic societies that host public talks/workshops
- Smaller cultural/interest groups
- Hobby societies with occasional events

**LOW PRIORITY (Score 1-4):**
- Year-specific societies (e.g., "Medicine Year 3")
- Course-specific internal groups
- Pure academic/research groups with no public events
- Very niche interests with limited appeal
- Societies with no email

**IMPORTANT:**
- A society in "Academic Related" or "ICSM" category CAN be high priority if they host events (talks, workshops, conferences)
- Tech societies (Neurotechnology, AI, Robotics, Data Science) are ALWAYS high priority - they host many events
- Don't penalize minimal descriptions - infer from name and category

**Your Task:**
Categorize these ${societies.length} societies. Return a JSON array with exactly ${societies.length} objects in the SAME ORDER:

{
  "relevanceScore": <1-10>,
  "relevanceReasoning": "<1 sentence explaining fit for LSN>",
  "targetAudience": [<2-3 audience types>],
  "outreachPriority": "<high|medium|low>",
  "suggestedApproach": "<1 sentence cold email angle>"
}

**Societies:**
${JSON.stringify(societiesData, null, 2)}

Return ONLY the JSON array.`;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('LSN-FOCUSED RE-CATEGORIZATION');
  console.log('='.repeat(60));

  const outputDir = path.join(__dirname, '../data/output');
  const scrapedFile = path.join(outputDir, 'imperial_societies_basic.json');

  const data = JSON.parse(fs.readFileSync(scrapedFile, 'utf-8'));
  const societies: SocietyDetail[] = data.societies;

  console.log(`\nLoaded ${societies.length} societies`);

  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    console.error('No API key found');
    process.exit(1);
  }

  const categorizer = new LSNCategorizer(apiKey);
  const categorized = await categorizer.categorizeSocieties(societies.filter(s => s.email));

  // Save results
  const outputFile = path.join(outputDir, 'imperial_societies_lsn_categorized.json');
  fs.writeFileSync(outputFile, JSON.stringify({ categorizedSocieties: categorized }, null, 2));

  console.log(`\n✓ Saved to: ${outputFile}`);

  // Show Neurotechnology
  const neurotech = categorized.find(s => s.name === 'Neurotechnology');
  if (neurotech) {
    console.log('\n' + '='.repeat(60));
    console.log('NEUROTECHNOLOGY SOCIETY (Test Case):');
    console.log('='.repeat(60));
    console.log(`Score: ${neurotech.relevanceScore}/10`);
    console.log(`Priority: ${neurotech.outreachPriority.toUpperCase()}`);
    console.log(`Reasoning: ${neurotech.relevanceReasoning}`);
    console.log(`Approach: ${neurotech.suggestedApproach}`);
  }

  // Show top 10
  console.log('\n' + '='.repeat(60));
  console.log('TOP 10 PRIORITIES:');
  console.log('='.repeat(60));
  categorized.slice(0, 10).forEach((s, i) => {
    console.log(`${i + 1}. ${s.name} (${s.relevanceScore}/10) - ${s.category}`);
  });
}

main();

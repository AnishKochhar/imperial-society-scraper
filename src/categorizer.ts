/**
 * AI-Powered Society Categorization Service
 * Uses Google Gemini to intelligently categorize societies for targeted outreach
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { SocietyDetail, CategorizedSociety, CategorizationResult } from './types';

export class SocietyCategorizer {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Categorize societies based on relevance to London Student Network
   *
   * Context: LSN posts events for societies to increase their reach.
   * We want to prioritize societies that:
   * 1. Host public events (social, networking, workshops, talks)
   * 2. Have broader appeal beyond niche academic interests
   * 3. Would benefit from cross-university audience
   * 4. Are active and have good member engagement
   */
  async categorizeSocieties(societies: SocietyDetail[]): Promise<CategorizationResult> {
    console.log(`\nCategorizing ${societies.length} societies with AI...`);

    // Process in batches of 50 to avoid token limits and JSON parsing issues
    const BATCH_SIZE = 50;
    const batches = [];
    for (let i = 0; i < societies.length; i += BATCH_SIZE) {
      batches.push(societies.slice(i, i + BATCH_SIZE));
    }

    console.log(`Processing in ${batches.length} batches of up to ${BATCH_SIZE} societies...\n`);

    const allCategorizations: any[] = [];

    try {
      for (let batchNum = 0; batchNum < batches.length; batchNum++) {
        const batch = batches[batchNum];
        console.log(`  Batch ${batchNum + 1}/${batches.length} (${batch.length} societies)...`);

        const prompt = this.buildCategorizationPrompt(batch);
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.warn(`    ⚠ Batch ${batchNum + 1} failed - using defaults`);
          // Add default categorizations for this batch
          const defaults = batch.map(() => ({
            relevanceScore: 5,
            relevanceReasoning: 'AI categorization failed - default priority',
            targetAudience: ['General'],
            outreachPriority: 'medium',
            suggestedApproach: 'Standard outreach email',
          }));
          allCategorizations.push(...defaults);
          continue;
        }

        try {
          const categorizations = JSON.parse(jsonMatch[0]);
          allCategorizations.push(...categorizations);
          console.log(`    ✓ Batch ${batchNum + 1} complete`);
        } catch (parseError) {
          console.warn(`    ⚠ Batch ${batchNum + 1} JSON parse failed - using defaults`);
          const defaults = batch.map(() => ({
            relevanceScore: 5,
            relevanceReasoning: 'AI categorization failed - default priority',
            targetAudience: ['General'],
            outreachPriority: 'medium',
            suggestedApproach: 'Standard outreach email',
          }));
          allCategorizations.push(...defaults);
        }

        // Small delay between batches to avoid rate limits
        if (batchNum < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const categorizations = allCategorizations;

      // Map categorizations back to societies
      const categorizedSocieties: CategorizedSociety[] = societies.map((society, index) => {
        const cat = categorizations[index] || {
          relevanceScore: 5,
          relevanceReasoning: 'Default categorization',
          targetAudience: ['General'],
          outreachPriority: 'medium',
          suggestedApproach: 'Standard outreach email',
        };

        return {
          ...society,
          relevanceScore: cat.relevanceScore,
          relevanceReasoning: cat.relevanceReasoning,
          targetAudience: cat.targetAudience,
          outreachPriority: cat.outreachPriority,
          suggestedApproach: cat.suggestedApproach,
        };
      });

      // Sort by relevance score (descending)
      categorizedSocieties.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Calculate statistics
      const highPriority = categorizedSocieties.filter(s => s.outreachPriority === 'high').length;
      const mediumPriority = categorizedSocieties.filter(s => s.outreachPriority === 'medium').length;
      const lowPriority = categorizedSocieties.filter(s => s.outreachPriority === 'low').length;

      console.log('\n✓ Categorization complete');
      console.log(`  High priority: ${highPriority}`);
      console.log(`  Medium priority: ${mediumPriority}`);
      console.log(`  Low priority: ${lowPriority}`);

      return {
        success: true,
        timestamp: new Date(),
        totalProcessed: categorizedSocieties.length,
        highPriority,
        mediumPriority,
        lowPriority,
        categorizedSocieties,
      };

    } catch (error) {
      console.error(`Categorization failed: ${error}`);

      // Fallback: return societies with default medium priority
      const categorizedSocieties: CategorizedSociety[] = societies.map(society => ({
        ...society,
        relevanceScore: 5,
        relevanceReasoning: 'Categorization failed - default priority assigned',
        targetAudience: ['General'],
        outreachPriority: 'medium' as const,
        suggestedApproach: 'Standard outreach email',
      }));

      return {
        success: false,
        timestamp: new Date(),
        totalProcessed: societies.length,
        highPriority: 0,
        mediumPriority: societies.length,
        lowPriority: 0,
        categorizedSocieties,
      };
    }
  }

  /**
   * Build the AI prompt for categorization
   */
  private buildCategorizationPrompt(societies: SocietyDetail[]): string {
    const societiesData = societies.map(s => ({
      name: s.name,
      category: s.category,
      description: s.description.substring(0, 500), // Limit description length
      tagline: s.tagline,
      memberCount: s.memberCount,
      hasEmail: s.email !== null,
    }));

    return `You are an expert at categorizing university student societies for a targeted cold outreach campaign.

**Context:**
London Student Network (LSN) is a startup that posts events from various London university societies to increase their reach across universities. We need to strategically prioritize which Imperial College societies to contact first based on their likelihood to:
1. Host events that appeal to students beyond Imperial (cross-university appeal)
2. Benefit from wider audience reach
3. Regularly organize public-facing events
4. Have active engagement and good organization

**Categorization Strategy:**

**HIGH PRIORITY (Score 8-10):**
- Social societies (social clubs, cultural groups, food/drink societies)
- Networking and professional development societies
- Large-scale event organizers (balls, festivals, conferences)
- Technology, entrepreneurship, business societies
- Arts, music, and performance groups
- Societies with high member counts (50+)
- Cross-disciplinary appeal

**MEDIUM PRIORITY (Score 5-7):**
- Sports clubs (some events are spectator-friendly)
- Academic societies that host public talks/workshops
- Hobby and interest groups with regular events
- Smaller cultural societies
- Moderate member counts (20-50)

**LOW PRIORITY (Score 1-4):**
- Highly specialized academic/research groups
- Internal course societies (year groups, specific degrees)
- Societies without clear event focus
- Very small or inactive societies (<20 members)
- Societies without emails (can't contact them)

**Your Task:**
Analyze the following ${societies.length} societies and return a JSON array with exactly ${societies.length} objects in the SAME ORDER, each containing:

{
  "relevanceScore": <1-10 integer>,
  "relevanceReasoning": "<1-2 sentence explanation>",
  "targetAudience": [<array of 2-4 audience types like "Social students", "Tech enthusiasts", "Business students", etc>],
  "outreachPriority": "<high|medium|low>",
  "suggestedApproach": "<1 sentence personalized outreach suggestion>"
}

**Societies to categorize:**
${JSON.stringify(societiesData, null, 2)}

Return ONLY the JSON array, no other text.`;
  }

  /**
   * Generate personalized outreach segments
   */
  generateOutreachSegments(categorized: CategorizedSociety[]): {
    tier1: CategorizedSociety[];
    tier2: CategorizedSociety[];
    tier3: CategorizedSociety[];
  } {
    const withEmails = categorized.filter(s => s.email !== null);

    return {
      tier1: withEmails.filter(s => s.outreachPriority === 'high'),
      tier2: withEmails.filter(s => s.outreachPriority === 'medium'),
      tier3: withEmails.filter(s => s.outreachPriority === 'low'),
    };
  }

  /**
   * Generate a summary report for outreach planning
   */
  generateSummaryReport(categorized: CategorizedSociety[]): string {
    const segments = this.generateOutreachSegments(categorized);

    let report = '# Imperial College Societies - Outreach Strategy Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += '## Summary Statistics\n\n';
    report += `- Total Societies Analyzed: ${categorized.length}\n`;
    report += `- Societies with Emails: ${categorized.filter(s => s.email !== null).length}\n`;
    report += `- Tier 1 (High Priority): ${segments.tier1.length}\n`;
    report += `- Tier 2 (Medium Priority): ${segments.tier2.length}\n`;
    report += `- Tier 3 (Low Priority): ${segments.tier3.length}\n\n`;

    // Tier 1 breakdown
    report += '## Tier 1: High Priority Outreach (Contact First)\n\n';
    segments.tier1.forEach((society, i) => {
      report += `### ${i + 1}. ${society.name}\n`;
      report += `- **Email:** ${society.email}\n`;
      report += `- **Category:** ${society.category}\n`;
      report += `- **Relevance Score:** ${society.relevanceScore}/10\n`;
      report += `- **Target Audience:** ${society.targetAudience.join(', ')}\n`;
      report += `- **Reasoning:** ${society.relevanceReasoning}\n`;
      report += `- **Suggested Approach:** ${society.suggestedApproach}\n`;
      report += `- **Members:** ${society.memberCount || 'Unknown'}\n\n`;
    });

    // Tier 2 breakdown
    report += '## Tier 2: Medium Priority Outreach (Contact Second)\n\n';
    segments.tier2.slice(0, 10).forEach((society, i) => {
      report += `### ${i + 1}. ${society.name}\n`;
      report += `- **Email:** ${society.email}\n`;
      report += `- **Relevance Score:** ${society.relevanceScore}/10\n`;
      report += `- **Reasoning:** ${society.relevanceReasoning}\n\n`;
    });

    if (segments.tier2.length > 10) {
      report += `... and ${segments.tier2.length - 10} more medium priority societies.\n\n`;
    }

    // Audience segmentation
    report += '## Audience Segmentation\n\n';
    const allAudiences = segments.tier1.flatMap(s => s.targetAudience);
    const audienceCounts = allAudiences.reduce((acc, audience) => {
      acc[audience] = (acc[audience] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedAudiences = Object.entries(audienceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    sortedAudiences.forEach(([audience, count]) => {
      report += `- **${audience}:** ${count} societies\n`;
    });

    return report;
  }
}

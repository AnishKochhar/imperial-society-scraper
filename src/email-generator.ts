/**
 * AI Email Generator
 * Uses Gemini 2.5 Flash to generate personalized cold outreach emails
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildEmailGenerationPrompt, EMAIL_CONFIG } from './email-config';
import { CategorizedSociety } from './types';

export interface GeneratedEmail {
  society: CategorizedSociety;
  subject: string;
  body: string;
  fullEmail: string; // body + signature
  reasoning: string;
  generatedAt: Date;
}

export class EmailGenerator {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Generate email for a single society
   */
  async generateEmail(society: CategorizedSociety): Promise<GeneratedEmail> {
    try {
      const prompt = buildEmailGenerationPrompt(society);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from AI response');
      }

      const generated = JSON.parse(jsonMatch[0]);

      const fullEmail = `${generated.body}\n\n${EMAIL_CONFIG.EMAIL_SIGNATURE}`;

      return {
        society,
        subject: generated.subject,
        body: generated.body,
        fullEmail,
        reasoning: generated.reasoning,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error(`Failed to generate email for ${society.name}:`, error);

      // Fallback to basic template
      return this.getFallbackEmail(society);
    }
  }

  /**
   * Generate emails for multiple societies in batch
   */
  async generateBatch(societies: CategorizedSociety[]): Promise<GeneratedEmail[]> {
    const emails: GeneratedEmail[] = [];

    for (const society of societies) {
      const email = await this.generateEmail(society);
      emails.push(email);

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return emails;
  }

  /**
   * Fallback email template if AI generation fails
   */
  private getFallbackEmail(society: CategorizedSociety): GeneratedEmail {
    const subject = `Quick question about ${society.name}`;
    const body = `Hi ${society.name} team,

I'm Josh from London Student Network - we help student societies reach 500K+ students across 53 London universities through free event promotion.

Worth a quick chat about how we could help ${society.name} reach more students?`;

    return {
      society,
      subject,
      body,
      fullEmail: `${body}\n\n${EMAIL_CONFIG.EMAIL_SIGNATURE}`,
      reasoning: 'Fallback template used due to AI generation failure',
      generatedAt: new Date(),
    };
  }
}

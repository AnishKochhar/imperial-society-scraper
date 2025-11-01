/**
 * Email Campaign Configuration
 *
 * ⚠️ EDIT THESE VARIABLES TO CUSTOMIZE YOUR OUTREACH CAMPAIGN
 */

export const EMAIL_CONFIG = {
  // ==================== SENDER INFORMATION ====================

  /**
   * Email sender details
   * Make sure this email is verified in SendGrid!
   */
  FROM_EMAIL: 'hello@londonstudentnetwork.com',
  FROM_NAME: 'Josh from London Student Network',

  /**
   * Reply-to email (where responses will go)
   */
  REPLY_TO_EMAIL: 'hello@londonstudentnetwork.com',

  // ==================== EMAIL CONTENT ====================

  /**
   * Email signature
   * Clean, professional signature with all main links
   */
  EMAIL_SIGNATURE: `
Best,
Josh
Founder, London Student Network

──────────────────────
🌐 Website: www.londonstudentnetwork.com
📸 Instagram: @londonstudentnetwork
💼 LinkedIn: linkedin.com/company/london-student-network
`.trim(),

  /**
   * Call-to-action options
   */
  CTA_OPTIONS: {
    CALENDAR_LINK: 'https://calendly.com/lsn/intro',  // TODO: Add your calendar link
    WEBSITE_LINK: 'https://www.londonstudentnetwork.com',
    CONTACT_EMAIL: 'hello@londonstudentnetwork.com',
  },

  // ==================== SENDING BEHAVIOR ====================

  /**
   * Batch sending configuration
   */
  BATCH_SIZE: 20,                    // Number of emails to review/send at once
  DELAY_BETWEEN_BATCHES_MS: 0,       // No delay - send as fast as possible after approval
  DELAY_BETWEEN_EMAILS_MS: 1000,     // 1 second between individual emails (avoid rate limits)

  /**
   * Safety settings
   */
  REQUIRE_INITIAL_APPROVAL: true,    // Confirm once at start, then autonomous
  DRY_RUN_MODE: false,               // If true, doesn't actually send emails (for testing)

  // ==================== AI EMAIL GENERATION ====================

  /**
   * Email style preferences
   * These guide the AI in generating emails
   */
  EMAIL_STYLE: {
    TONE: 'professional yet friendly',  // Options: professional, casual, friendly, formal
    LENGTH: 'concise',                   // Options: brief, concise, detailed
    STYLE: 'investor-pitch',              // Options: conversational, investor-pitch, academic, startup
  },

  /**
   * Subject line strategy
   */
  SUBJECT_LINE_STRATEGY: 'ai-generated', // Options: 'ai-generated', 'template', 'custom'
  SUBJECT_LINE_TEMPLATE: 'Quick question about {society_name}', // Used if strategy is 'template'

  // ==================== TRACKING & LOGGING ====================

  /**
   * Enable detailed tracking
   */
  TRACK_OPENS: true,                  // Track email opens (SendGrid feature)
  TRACK_CLICKS: true,                 // Track link clicks (SendGrid feature)
  LOG_TO_FILE: true,                  // Save sending logs to data/logs/

  /**
   * Logging detail level
   */
  LOG_LEVEL: 'detailed',              // Options: 'minimal', 'standard', 'detailed'
};

/**
 * AI PROMPT CONFIGURATION
 *
 * ⚠️ THIS IS WHERE YOU CUSTOMIZE THE EMAIL GENERATION LOGIC
 *
 * This prompt is sent to Gemini 2.5 Flash to generate personalized emails.
 * Edit this to change how emails are written.
 */
export function buildEmailGenerationPrompt(society: any): string {
  return `You are an expert cold email writer for London Student Network (LSN), writing to university society committee members.

**Context:**
LSN is a platform that helps student societies reach 500,000+ students across 53 London universities through free event promotion and ticketing.

**Society Details:**
- Name: ${society.name}
- Category: ${society.category}
- Email: ${society.email}
- Target Audience: ${society.targetAudience?.join(', ') || 'Students'}
- AI Insight: ${society.relevanceReasoning || 'N/A'}

**Email Requirements:**

1. **Style:** ${EMAIL_CONFIG.EMAIL_STYLE.TONE}, ${EMAIL_CONFIG.EMAIL_STYLE.LENGTH}, ${EMAIL_CONFIG.EMAIL_STYLE.STYLE}
   - Write like you're pitching to an investor: clear value prop, social proof, crisp
   - NO fluff, NO generic praise, NO over-enthusiasm
   - Get straight to the point

2. **Structure (3-4 sentences max):**
   - **Line 1:** Hook - why LSN matters for THIS type of society
   - **Line 2:** Value prop - specific benefit (reach, ticketing, cross-university)
   - **Line 3:** Social proof - briefly mention traction (500K students, 85 societies, or similar societies using it)
   - **Line 4:** CTA - simple, low-friction ask

3. **Tone Calibration by Society Type:**
   - Tech/Business societies: Professional, data-driven, efficiency-focused
   - Cultural/Arts societies: Community-building, reach-focused, inclusive
   - Sports clubs: Practical, attendance-focused, straightforward
   - Academic societies: Value-driven, cross-university collaboration angle

4. **Key Value Props to Emphasize (pick 1-2 most relevant):**
   - Reach 500,000+ students across London (not just Imperial)
   - Free event ticketing and management
   - Cross-university discovery
   - Fill committee skill gaps with interested students from other unis
   - Already used by 85 societies across LSE, UCL, KCL, Imperial

5. **What NOT to do:**
   - Don't mention specific events they've hosted (we don't have that data)
   - Don't mention member counts (often unavailable)
   - Don't use excessive exclamation marks or emoji
   - Don't make it sound like a mass email
   - Don't be overly salesy

6. **CTA Options (choose most natural):**
   - "Worth a quick 10-min call this week?" (if high-priority society)
   - "Would you be open to listing your next event?" (if medium-priority)
   - "Interested in learning more?" (if unsure)

7. **Subject Line Strategy (CRITICAL):**
   Your subject line must maximize open rates. Follow these rules:

   **GOOD Subject Lines:**
   - "Quick question about ${society.name}"
   - "Idea for ${society.name}"
   - "Reaching more students?"
   - "${society.name} + LSN collaboration"
   - "5-min question for ${society.name}"

   **AVOID:**
   - Generic sales language ("Amazing opportunity!", "You won't believe this")
   - All caps or excessive punctuation
   - Spam trigger words ("Free!", "Limited time", "Act now")
   - Being too vague ("Follow up", "Hello")
   - Being too long (keep under 50 characters)

   **Psychology:**
   - Create curiosity without clickbait
   - Use their society name (personalization)
   - Imply brevity/low commitment ("quick", "5-min")
   - Suggest mutual benefit ("collaboration", "idea")

**Output Format:**
Return a JSON object:
{
  "subject": "<compelling subject line optimized for open rate, 5-8 words, <50 chars>",
  "body": "<email body, 3-4 sentences, NO signature>",
  "reasoning": "<1 sentence explaining your subject line and email approach>"
}

Generate the email now.`;
}

/**
 * Helper: Get email subject line
 */
export function getSubjectLine(society: any, aiGenerated?: string): string {
  if (EMAIL_CONFIG.SUBJECT_LINE_STRATEGY === 'ai-generated' && aiGenerated) {
    return aiGenerated;
  }

  if (EMAIL_CONFIG.SUBJECT_LINE_STRATEGY === 'template') {
    return EMAIL_CONFIG.SUBJECT_LINE_TEMPLATE.replace('{society_name}', society.name);
  }

  // Default fallback
  return `Partner with London Student Network?`;
}

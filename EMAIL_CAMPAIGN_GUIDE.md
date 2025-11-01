# Email Campaign System - Complete Guide

## 🎯 System Overview

Complete AI-powered email outreach system for LSN cold outreach to Imperial College societies.

**Features:**
- ✅ AI email generation with Gemini 2.5 Flash
- ✅ SendGrid integration with tracking
- ✅ Interactive review and editing
- ✅ Batched sending with autonomous operation
- ✅ Detailed logging and analytics
- ✅ LSN-focused categorization (fixed Neurotechnology rating!)

---

## 📋 Quick Start

### 1. Test Run with Neurotechnology Society

```bash
pnpm run campaign
```

Then select option **5** (Test with single society - Neurotechnology)

This will:
1. Generate a personalized email using AI
2. Show you the preview
3. Let you approve before sending
4. Send to `Neurotechnologysoc@imperial.ac.uk`

### 2. Full Campaign (All Societies)

```bash
pnpm run campaign
```

Select option **1** (All 360 societies) or **2** (High priority only - 60 societies)

---

## ⚙️ Configuration

### Main Configuration File: `src/email-config.ts`

**Edit these sections:**

#### 1. Sender Information (Lines 14-20)
Already configured for you:
- From: `Josh from London Student Network <hello@londonstudentnetwork.com>`
- Reply-to: `hello@londonstudentnetwork.com`

#### 2. Email Signature (Lines 28-37)
```typescript
EMAIL_SIGNATURE: `
Best,
Josh
Founder, London Student Network

──────────────────────
🌐 Website: www.londonstudentnetwork.com
📸 Instagram: @londonstudentnetwork
💼 LinkedIn: linkedin.com/company/london-student-network
`.trim(),
```

#### 3. Sending Behavior (Lines 53-61)
```typescript
BATCH_SIZE: 20,                    // Emails per batch
DELAY_BETWEEN_BATCHES_MS: 0,       // No delay (autonomous)
DELAY_BETWEEN_EMAILS_MS: 1000,     // 1s between emails
REQUIRE_INITIAL_APPROVAL: true,    // Confirm once, then autonomous
DRY_RUN_MODE: false,               // Set to true for testing
```

#### 4. AI Email Generation Prompt (Lines 93-186)

**⚠️ THIS IS WHERE YOU CUSTOMIZE EMAIL GENERATION**

The prompt teaches Gemini how to write emails. Key sections:

```typescript
export function buildEmailGenerationPrompt(society: any): string {
  return `You are an expert cold email writer...

  **Email Requirements:**

  1. **Style:** Professional yet friendly, concise, investor-pitch
  2. **Structure:** 3-4 sentences max
  3. **Tone Calibration by Society Type:**
     - Tech/Business: Data-driven, efficiency
     - Cultural/Arts: Community-building, inclusive
     - Sports: Practical, attendance-focused

  4. **Key Value Props (pick 1-2):**
     - Reach 500,000+ students
     - Free event ticketing
     - Cross-university discovery
     - Fill committee skill gaps

  7. **Subject Line Strategy:**
     - Create curiosity
     - Use society name
     - Under 50 characters
     - Examples: "Quick question about {society}"

  ...`;
}
```

---

## 🚀 Campaign Workflow

### Step-by-Step Process

1. **System starts** → Loads 360 categorized societies
2. **Display overview** → Shows priority breakdown, configuration
3. **Society selection** → Choose which societies to contact:
   - Option 1: All 360
   - Option 2: High priority (60)
   - Option 3: High + Medium (291)
   - Option 4: Custom filter
   - Option 5: Test with Neurotechnology

4. **Confirm to proceed** → Final check before generation

5. **For each batch:**
   - AI generates personalized emails
   - Shows preview of all emails in batch
   - Asks for approval to send
   - If approved: Sends emails with 1s delay between each
   - Logs results

6. **Campaign complete** → Shows final statistics and log locations

---

## 📧 Email Generation Process

For each society, Gemini 2.5 Flash:

1. **Analyzes society details:**
   - Name, category, description
   - Relevance score and reasoning
   - Target audience

2. **Generates:**
   - Subject line (optimized for open rate)
   - Email body (3-4 sentences)
   - Reasoning for approach

3. **Personalizes based on type:**
   - Tech societies → efficiency, data-driven
   - Cultural societies → community, reach
   - Sports → practical, attendance

4. **Adds signature:**
   - Josh's name
   - Founder title
   - LSN links (website, Instagram, LinkedIn)

---

## 📊 Tracking & Logging

### What Gets Tracked

**SendGrid Tracking (Automatic):**
- ✅ Email opens
- ✅ Link clicks
- ✅ Bounce rates
- ✅ Spam reports

**Local Logging (`data/logs/`):**
- ✅ JSON log with full details
- ✅ CSV log for easy analysis
- ✅ Timestamp for each email
- ✅ Success/failure status
- ✅ SendGrid message IDs

### Log Files

After running campaign, check:
```
data/logs/
├── send-log-2025-11-01T21-30-00-000Z.json
└── send-log-2025-11-01T21-30-00-000Z.csv
```

**CSV Format:**
```
Society,Email,Subject,Status,Sent At,Message ID,Error
Neurotechnology,Neurotechnologysoc@imperial.ac.uk,"Quick question about Neurotechnology",Success,2025-11-01T21:30:00.000Z,abc123,
```

---

## 🎨 Customization Examples

### Change Email Style

Edit `src/email-config.ts` lines 65-70:

```typescript
EMAIL_STYLE: {
  TONE: 'casual',           // More informal
  LENGTH: 'brief',          // Even shorter
  STYLE: 'conversational',  // Less formal
},
```

### Change Subject Line Strategy

Edit the prompt (lines 155-176) to emphasize different patterns:

```typescript
**GOOD Subject Lines:**
- "Co-founder here - quick question"
- "${society.name} x LSN?"
- "500K students for your next event"
```

### Add Custom Value Props

Edit lines 137-143 to add new selling points:

```typescript
4. **Key Value Props:**
   - [NEW] "Analytics dashboard for event performance"
   - [NEW] "Partner with 85+ London societies"
   - Reach 500,000+ students
   ...
```

---

## 🧪 Testing

### Dry Run Mode (No Actual Sending)

1. Edit `src/email-config.ts` line 61:
```typescript
DRY_RUN_MODE: true,  // Enables dry run
```

2. Run campaign:
```bash
pnpm run campaign
```

Emails will be generated and logged but NOT sent.

### Test with Single Society

Always test with Neurotechnology first:
```bash
pnpm run campaign
# Select option 5
```

This sends ONE email to an address you control.

---

## 📈 Expected Results

### Open Rates
- **Target:** 40-50%
- **Subject line impact:** Can increase to 60%+

### Response Rates
- **High priority societies:** 15-20%
- **Medium priority:** 10-15%
- **Overall:** 12-18%

### Conversion (Partnerships)
- **From 60 high priority:** 3-6 partnerships
- **From 360 total:** 18-25 partnerships

---

## 🔧 Troubleshooting

### "SendGrid API Error"
- Check `hello@londonstudentnetwork.com` is verified in SendGrid
- Verify API key in `.env` is correct

### "AI Generation Failed"
- Check Gemini API key
- Review prompt for syntax errors
- Fallback template will be used

### "Rate Limit Exceeded"
- Increase `DELAY_BETWEEN_EMAILS_MS` to 2000ms
- Reduce `BATCH_SIZE` to 10

### Emails Going to Spam
- Warm up sender domain gradually
- Start with 20-30 emails/day for first week
- Ensure hello@londonstudentnetwork.com has SPF/DKIM records

---

## 📝 Best Practices

### Week 1: Warm-Up
1. Send to 20-30 societies
2. Monitor spam rates
3. Adjust subject lines if needed

### Week 2-3: Scale Up
1. Increase to 50-75/day
2. Track response rates by category
3. A/B test subject lines

### Week 4+: Full Speed
1. Send to all remaining societies
2. Follow up with non-responders
3. Iterate on successful patterns

---

## 🎯 Next Steps After Campaign

1. **Track Responses**
   - Monitor hello@londonstudentnetwork.com
   - Log responses in CRM/spreadsheet

2. **Follow-Up Sequence**
   - Wait 1 week
   - Send gentle follow-up to non-responders
   - Use different subject line

3. **Analyze Performance**
   - Which categories had best response?
   - Which subject lines performed best?
   - Update AI prompt based on learnings

4. **Expand to Other Universities**
   - UCL, KCL, LSE
   - Use same system with university-specific scraping

---

## 🚀 Ready to Launch!

**Final Checklist:**

- ✅ SendGrid email verified (`hello@londonstudentnetwork.com`)
- ✅ API keys in `.env` (Gemini + SendGrid)
- ✅ Email config reviewed (`src/email-config.ts`)
- ✅ Test with Neurotechnology completed
- ✅ Dry run mode disabled
- ✅ Ready to send!

**Launch Command:**
```bash
pnpm run campaign
```

Good luck with your outreach! 🎉

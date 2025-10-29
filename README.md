# Imperial College Society Email Scraper

AI-powered scraper for collecting Imperial College society contact information with intelligent categorization for targeted cold outreach.

## Overview

This tool helps **London Student Network (LSN)** identify and prioritize Imperial College societies for partnership outreach. It:

1. Scrapes all societies from Imperial College Union's A-Z directory
2. Extracts emails, descriptions, member counts, and social media
3. Uses AI (Google Gemini) to categorize and prioritize societies
4. Generates tiered contact lists optimized for cold outreach

## Features

- **Comprehensive Scraping**: Extracts all society data including emails, descriptions, committee info
- **AI-Powered Categorization**: Gemini 2.0 intelligently scores societies by relevance (1-10)
- **Smart Stratification**: Three-tier priority system (High/Medium/Low)
- **Audience Segmentation**: Identifies target audiences for each society
- **Personalized Suggestions**: AI-generated outreach approach for each society
- **Multiple Export Formats**: JSON, CSV, and Markdown reports

## Installation

```bash
# Navigate to project directory
cd email-scraper

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your Google Gemini API key to .env
# Get one at: https://makersuite.google.com/app/apikey
```

## Configuration

Create a `.env` file with:

```env
GOOGLE_GENAI_API_KEY=your_api_key_here
```

## Usage

### Run Full Pipeline

```bash
npm run pipeline
```

This will:
1. Scrape all Imperial societies (~200+)
2. Extract emails and metadata
3. Categorize with AI
4. Generate tiered contact lists
5. Export to `data/output/`

### Test with Limited Societies

Edit `src/pipeline.ts` and uncomment:

```typescript
maxSocieties: 10  // Test with 10 societies
```

### Run Scraper Only

```bash
npm run scrape
```

## Output Files

All files saved to `data/output/`:

| File | Description |
|------|-------------|
| `imperial_societies_raw.json` | Raw scraping results |
| `imperial_societies_categorized.json` | AI-categorized societies |
| `tier1_high_priority.json` | High priority contacts (contact first) |
| `tier2_medium_priority.json` | Medium priority contacts |
| `tier3_low_priority.json` | Low priority contacts |
| `outreach_contacts.csv` | All contacts in CSV format |
| `OUTREACH_STRATEGY.md` | Complete strategy report |

## Categorization Strategy

### High Priority (Score 8-10)
- Social clubs and cultural groups
- Networking and professional development
- Large event organizers (balls, festivals)
- Tech, entrepreneurship, business societies
- Arts, music, performance groups
- High member counts (50+)

### Medium Priority (Score 5-7)
- Sports clubs with spectator events
- Academic societies hosting public talks
- Hobby and interest groups
- Smaller cultural societies

### Low Priority (Score 1-4)
- Highly specialized academic groups
- Internal course societies
- Societies without clear event focus
- Very small or inactive societies

## Project Structure

```
email-scraper/
├── src/
│   ├── types.ts          # TypeScript type definitions
│   ├── scraper.ts        # Main scraping logic
│   ├── categorizer.ts    # AI categorization service
│   └── pipeline.ts       # Orchestration script
├── data/
│   └── output/          # Generated results
├── package.json
├── tsconfig.json
└── README.md
```

## Technology Stack

- **TypeScript**: Type-safe development
- **Playwright**: Browser automation
- **Google Gemini 2.0**: AI categorization
- **Node.js**: Runtime environment

## Example Output

```json
{
  "name": "Imperial College Skydiving Club",
  "email": "skydive@imperial.ac.uk",
  "category": "Outdoor",
  "relevanceScore": 9,
  "outreachPriority": "high",
  "targetAudience": ["Adventure seekers", "Social students", "Sports enthusiasts"],
  "suggestedApproach": "Highlight cross-university reach for unique high-adrenaline events",
  "memberCount": 47
}
```

## Development

```bash
# Build TypeScript
npm run build

# Format code
npm run format

# Lint code
npm run lint
```

## Notes

- Rate limiting: 1.5s delay between society page requests
- Browser runs in headless mode (no UI)
- Playwright downloads Chromium automatically on first run
- AI categorization requires internet connection

## License

MIT

## Support

For issues or questions about London Student Network, contact the LSN team.

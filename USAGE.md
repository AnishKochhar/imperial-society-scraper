# Quick Start Guide

## What This Tool Does

Scrapes Imperial College Union society directory to collect:
- Society names and emails
- Descriptions and member counts
- Categories and social media
- AI-powered relevance scoring for LSN outreach

## Running the Scraper

### Test Run (5 societies, ~15 seconds)
```bash
pnpm test
```

### Test with AI (15 societies, ~30 seconds)
```bash
pnpm test:pipeline
```

### Full Run (360 societies, ~10 minutes)
```bash
pnpm run pipeline
```

## Output Files Location

All results saved to `data/output/`:

**Main Files:**
- `imperial_societies_categorized.json` - Complete data with AI scores
- `tier1_high_priority.json` - Top priority contacts (START HERE)
- `tier2_medium_priority.json` - Medium priority contacts
- `tier3_low_priority.json` - Lower priority contacts
- `outreach_contacts.csv` - Import into Gmail/Outlook
- `OUTREACH_STRATEGY.md` - Full strategic report

## Interpreting Results

### Relevance Score (1-10)
- **9-10**: Perfect fit - large social/networking societies
- **7-8**: Great fit - active societies with public events
- **5-6**: Good fit - worth contacting
- **1-4**: Low fit - very niche or internal groups

### Outreach Priority
- **HIGH**: Contact immediately - best ROI
- **MEDIUM**: Contact after high priority
- **LOW**: Contact if capacity allows

## Example High-Priority Society

```json
{
  "name": "Imperial College Skydiving Club",
  "email": "skydive@imperial.ac.uk",
  "relevanceScore": 9,
  "outreachPriority": "high",
  "targetAudience": ["Adventure seekers", "Social students"],
  "suggestedApproach": "Highlight cross-university reach for unique events",
  "memberCount": 47,
  "category": "Outdoor"
}
```

## Outreach Strategy

### Phase 1: High Priority (Week 1)
- Contact all Tier 1 societies
- Use personalized suggested approaches
- Track response rates

### Phase 2: Medium Priority (Week 2-3)
- Contact Tier 2 societies
- Iterate based on Phase 1 feedback

### Phase 3: Low Priority (Week 4+)
- Contact remaining societies if capacity

## Common Questions

**Q: How often should I re-scrape?**
A: Every 2-3 months to catch new societies and updated contact info.

**Q: What if a society doesn't have an email?**
A: They're filtered out automatically - can't contact without email.

**Q: Can I customize the AI categorization?**
A: Yes! Edit `src/categorizer.ts` prompt to adjust scoring criteria.

**Q: How do I add more universities?**
A: Copy the scraper pattern and adapt for other union websites.

## Tips for Cold Outreach

1. **Personalize**: Use the AI-generated "suggestedApproach" field
2. **Value Prop**: Emphasize cross-university reach
3. **Social Proof**: Mention other societies already partnered
4. **Clear CTA**: Make it easy to post their next event
5. **Follow Up**: Contact non-responders after 1 week

## Technical Details

- **Rate Limiting**: 1.5s between requests (respectful scraping)
- **Browser**: Playwright Chromium (headless mode)
- **AI Model**: Google Gemini 2.0 Flash
- **Data Format**: JSON + CSV exports
- **Error Handling**: Continues on individual failures

## Maintenance

### Update Dependencies
```bash
pnpm update
```

### Rebuild After Code Changes
```bash
pnpm run build
```

### Check for Issues
```bash
pnpm run lint
```

## Support

- View source code in `src/` directory
- Check `README.md` for full documentation
- Review `data/output/imperial_societies_raw.json` for raw scraping data

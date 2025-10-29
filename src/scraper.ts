/**
 * Imperial College Society Email Scraper
 * Scrapes society information including emails from Imperial College Union website
 */

import { chromium, Browser, Page } from 'playwright';
import { SocietyCard, SocietyDetail, CommitteeMember, ScrapingResult } from './types';

export class ImperialSocietyScraper {
  private browser: Browser | null = null;
  private readonly baseUrl = 'https://www.imperialcollegeunion.org';
  private readonly listingUrl = `${this.baseUrl}/activities/a-to-z`;

  /**
   * Initialize browser instance
   */
  async initialize(): Promise<void> {
    console.log('Initializing browser...');
    this.browser = await chromium.launch({
      headless: true,
      timeout: 60000,
    });
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Scrape all society cards from the A-Z listing page
   */
  async scrapeSocietyCards(): Promise<SocietyCard[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    console.log(`Scraping society listing from: ${this.listingUrl}`);
    const page = await this.browser.newPage();

    try {
      await page.goto(this.listingUrl, { waitUntil: 'networkidle', timeout: 60000 });

      // Wait for society cards to load
      await page.waitForSelector('ul li a', { timeout: 30000 });

      // Extract society cards
      const societies = await page.evaluate(() => {
        const cards: Array<{ name: string; slug: string; url: string; category: string }> = [];

        // Find all list items that contain society links
        const listItems = document.querySelectorAll('ul li');

        listItems.forEach((item) => {
          const link = item.querySelector('a');
          const heading = item.querySelector('h3');

          if (link && heading) {
            const href = link.getAttribute('href');
            const name = heading.textContent?.trim() || '';

            if (href && href.startsWith('/activities/a-to-z/') && name) {
              // Extract category (usually shown as a label/tag)
              let category = 'Uncategorized';
              const categoryElements = item.querySelectorAll('span, p, div');
              for (const el of categoryElements) {
                const text = el.textContent?.trim() || '';
                // Look for category indicators
                if (text && text.length < 50 && !text.includes(name)) {
                  category = text;
                  break;
                }
              }

              const slug = href.replace('/activities/a-to-z/', '');

              cards.push({
                name,
                slug,
                url: href,
                category,
              });
            }
          }
        });

        return cards;
      });

      console.log(`Found ${societies.length} societies`);
      await page.close();

      return societies.map(s => ({
        ...s,
        url: `${this.baseUrl}${s.url}`,
      }));

    } catch (error) {
      await page.close();
      throw new Error(`Failed to scrape society listing: ${error}`);
    }
  }

  /**
   * Scrape detailed information from an individual society page
   */
  async scrapeSocietyDetail(card: SocietyCard): Promise<SocietyDetail> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const page = await this.browser.newPage();

    try {
      console.log(`  Scraping: ${card.name}`);
      await page.goto(card.url, { waitUntil: 'networkidle', timeout: 60000 });

      // Extract all society details
      const details = await page.evaluate(() => {
        // Extract email from mailto link
        let email: string | null = null;
        const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
        if (mailtoLinks.length > 0) {
          const href = mailtoLinks[0].getAttribute('href');
          email = href ? href.replace('mailto:', '') : null;
        }

        // Extract description - look for main content paragraphs
        let description = '';
        const descriptionSelectors = [
          'main p',
          'article p',
          '[class*="description"] p',
          '[class*="content"] p',
        ];

        for (const selector of descriptionSelectors) {
          const paragraphs = document.querySelectorAll(selector);
          const texts: string[] = [];
          paragraphs.forEach(p => {
            const text = p.textContent?.trim();
            if (text && text.length > 20) {
              texts.push(text);
            }
          });
          if (texts.length > 0) {
            description = texts.join(' ');
            break;
          }
        }

        // Extract tagline - usually the first heading or emphasized text
        let tagline: string | null = null;
        const h2 = document.querySelector('h2');
        if (h2) {
          tagline = h2.textContent?.trim() || null;
        }

        // Extract member count
        let memberCount: number | null = null;
        const memberText = document.body.textContent || '';
        const memberMatch = memberText.match(/(\d+)\s*members?/i);
        if (memberMatch) {
          memberCount = parseInt(memberMatch[1], 10);
        }

        // Extract committee members
        const committee: Array<{ name: string; role?: string }> = [];
        const committeeHeadings = Array.from(document.querySelectorAll('h2, h3, h4')).find(
          h => h.textContent?.toLowerCase().includes('committee')
        );

        if (committeeHeadings) {
          let nextElement = committeeHeadings.nextElementSibling;
          let searchDepth = 0;

          while (nextElement && searchDepth < 10) {
            const listItems = nextElement.querySelectorAll('li, div, p');

            listItems.forEach(item => {
              const text = item.textContent?.trim();
              if (text && text.length > 2 && text.length < 100) {
                // Try to split name and role
                const parts = text.split(/[-–—:]/);
                if (parts.length >= 2) {
                  committee.push({
                    name: parts[0].trim(),
                    role: parts[1].trim(),
                  });
                } else {
                  committee.push({ name: text });
                }
              }
            });

            if (committee.length > 0) break;
            nextElement = nextElement.nextElementSibling;
            searchDepth++;
          }
        }

        // Extract social media links
        const socialMedia: Record<string, string> = {};

        const instagramLinks = document.querySelectorAll('a[href*="instagram.com"]');
        if (instagramLinks.length > 0) {
          const href = instagramLinks[0].getAttribute('href');
          if (href) socialMedia.instagram = href;
        }

        const facebookLinks = document.querySelectorAll('a[href*="facebook.com"]');
        if (facebookLinks.length > 0) {
          const href = facebookLinks[0].getAttribute('href');
          if (href) socialMedia.facebook = href;
        }

        const twitterLinks = document.querySelectorAll('a[href*="twitter.com"], a[href*="x.com"]');
        if (twitterLinks.length > 0) {
          const href = twitterLinks[0].getAttribute('href');
          if (href) socialMedia.twitter = href;
        }

        // Look for external website links (exclude imperial/union domains)
        const externalLinks = document.querySelectorAll('a[href^="http"]');
        for (const link of externalLinks) {
          const href = link.getAttribute('href');
          if (href &&
              !href.includes('imperial') &&
              !href.includes('instagram') &&
              !href.includes('facebook') &&
              !href.includes('twitter')) {
            socialMedia.website = href;
            break;
          }
        }

        return {
          email,
          description,
          tagline,
          memberCount,
          committee,
          socialMedia,
        };
      });

      await page.close();

      return {
        name: card.name,
        slug: card.slug,
        url: card.url,
        category: card.category,
        email: details.email,
        description: details.description || 'No description available',
        tagline: details.tagline,
        memberCount: details.memberCount,
        committee: details.committee,
        socialMedia: details.socialMedia,
      };

    } catch (error) {
      await page.close();
      console.error(`  Error scraping ${card.name}: ${error}`);

      // Return partial data on error
      return {
        name: card.name,
        slug: card.slug,
        url: card.url,
        category: card.category,
        email: null,
        description: 'Failed to scrape',
        tagline: null,
        memberCount: null,
        committee: [],
        socialMedia: {},
      };
    }
  }

  /**
   * Main scraping orchestration method
   */
  async scrapeAll(options: { maxSocieties?: number; delayMs?: number } = {}): Promise<ScrapingResult> {
    const { maxSocieties, delayMs = 1000 } = options;
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      await this.initialize();

      // Step 1: Get all society cards
      const cards = await this.scrapeSocietyCards();
      const cardsToScrape = maxSocieties ? cards.slice(0, maxSocieties) : cards;

      console.log(`\nScraping ${cardsToScrape.length} society pages...`);

      // Step 2: Scrape each society detail page
      const societies: SocietyDetail[] = [];

      for (let i = 0; i < cardsToScrape.length; i++) {
        const card = cardsToScrape[i];

        try {
          const detail = await this.scrapeSocietyDetail(card);
          societies.push(detail);

          console.log(`  ✓ ${detail.name} ${detail.email ? `(${detail.email})` : '(no email)'}`);

          // Rate limiting
          if (i < cardsToScrape.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        } catch (error) {
          const errorMsg = `Failed to scrape ${card.name}: ${error}`;
          errors.push(errorMsg);
          console.error(`  ✗ ${errorMsg}`);
        }
      }

      await this.close();

      const societiesWithEmails = societies.filter(s => s.email !== null).length;
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log(`\n✓ Scraping complete in ${duration}s`);
      console.log(`  Total societies: ${cards.length}`);
      console.log(`  Scraped: ${societies.length}`);
      console.log(`  With emails: ${societiesWithEmails}`);
      console.log(`  Errors: ${errors.length}`);

      return {
        success: true,
        timestamp: new Date(),
        totalSocieties: cards.length,
        societiesScraped: societies.length,
        societiesWithEmails,
        errors,
        societies,
      };

    } catch (error) {
      await this.close();

      return {
        success: false,
        timestamp: new Date(),
        totalSocieties: 0,
        societiesScraped: 0,
        societiesWithEmails: 0,
        errors: [`Critical error: ${error}`],
        societies: [],
      };
    }
  }
}

// Main execution when run directly
if (require.main === module) {
  (async () => {
    const scraper = new ImperialSocietyScraper();

    // Test with first 5 societies
    const result = await scraper.scrapeAll({ maxSocieties: 5 });

    console.log('\n--- Results ---');
    console.log(JSON.stringify(result, null, 2));
  })();
}

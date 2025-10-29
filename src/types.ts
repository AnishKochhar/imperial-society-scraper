/**
 * Type definitions for Imperial College Society Email Scraper
 */

export interface SocietyCard {
  name: string;
  slug: string;
  url: string;
  category: string;
}

export interface SocietyDetail {
  name: string;
  slug: string;
  url: string;
  email: string | null;
  category: string;
  description: string;
  tagline: string | null;
  memberCount: number | null;
  committee: CommitteeMember[];
  socialMedia: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };
}

export interface CommitteeMember {
  name: string;
  role?: string;
}

export interface CategorizedSociety extends SocietyDetail {
  relevanceScore: number;
  relevanceReasoning: string;
  targetAudience: string[];
  outreachPriority: 'high' | 'medium' | 'low';
  suggestedApproach: string;
}

export interface ScrapingResult {
  success: boolean;
  timestamp: Date;
  totalSocieties: number;
  societiesScraped: number;
  societiesWithEmails: number;
  errors: string[];
  societies: SocietyDetail[];
}

export interface CategorizationResult {
  success: boolean;
  timestamp: Date;
  totalProcessed: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  categorizedSocieties: CategorizedSociety[];
}

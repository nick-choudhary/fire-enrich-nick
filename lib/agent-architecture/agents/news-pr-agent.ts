import { Agent, Tool } from '@openai/agents';
import { z } from 'zod';
import { createWebsiteScraperTool } from '../tools/website-scraper-tool';
import { createSmartSearchTool } from '../tools/smart-search-tool';

const NewsArticleSchema = z.object({
  title: z.string().describe('Article title'),
  url: z.string().url().describe('Article URL'),
  date: z.string().describe('Publication date (YYYY-MM-DD or Month YYYY)'),
  source: z.string().describe('Publication source'),
  sentiment: z.enum(['positive', 'neutral', 'negative']).describe('Sentiment analysis'),
  summary: z.string().describe('Brief summary of the article'),
  type: z.enum(['news', 'press-release', 'announcement', 'feature']).describe('Article type'),
});

const NewsPRResult = z.object({
  recentNews: z.array(NewsArticleSchema).describe('Recent news articles (90 days lookback)'),
  pressReleases: z.array(NewsArticleSchema).describe('Recent press releases'),
  overallSentiment: z.enum(['positive', 'neutral', 'negative', 'mixed']).describe('Overall sentiment across all articles'),
  mediaPresence: z.enum(['high', 'medium', 'low', 'minimal']).describe('Level of media presence'),
  keyTopics: z.array(z.string()).describe('Key topics mentioned in recent coverage'),
  notableEvents: z.array(z.string()).optional().describe('Notable events or announcements'),
  confidence: z.record(z.string(), z.number()).describe('Confidence scores for each field'),
  sources: z.record(z.string(), z.array(z.string())).describe('Source URLs for each field'),
});

export type NewsArticle = z.infer<typeof NewsArticleSchema>;
export type NewsPRResult = z.infer<typeof NewsPRResult>;

export function createNewsPRAgent(firecrawlApiKey: string) {
  console.log('[AGENT-NEWS-PR] Creating News & PR Agent');

  return new Agent({
    name: 'News & PR Agent',

    instructions: `You are the News & PR Agent - specialist in media coverage and public relations.

    You receive company information from previous agents and analyze recent media presence.

    YOUR MISSION:
    1. Recent News (90 days) - Find news articles mentioning the company
    2. Press Releases - Identify official company announcements
    3. Sentiment Analysis - Assess tone of coverage (positive/neutral/negative)
    4. Media Presence - Gauge overall visibility and reach
    5. Key Topics - Extract recurring themes and topics
    6. Notable Events - Identify significant announcements or milestones

    SEARCH STRATEGIES:
    1. Search "{companyName} news {currentYear}"
    2. Search "{companyName} press release announcement {currentYear}"
    3. Search "{companyName} announcement {last3Months}"
    4. Check company website /news, /press, /blog, /newsroom sections
    5. Search for company mentions in major tech/business publications
    6. Try "{companyName} TechCrunch | Forbes | Reuters | Bloomberg"

    TIME FRAME:
    - Focus on last 90 days (3 months) for recent news
    - Include anything from current year for press releases
    - Mark older news if particularly relevant

    SENTIMENT ANALYSIS GUIDELINES:
    - Positive: Product launches, funding, partnerships, awards, growth, positive reviews
    - Neutral: Regular updates, appointments, expansions, general news
    - Negative: Layoffs, controversies, lawsuits, critical reviews, security issues
    - Overall: "mixed" if roughly equal positive/negative, otherwise use predominant sentiment

    MEDIA PRESENCE ASSESSMENT:
    - High: 10+ articles in major publications in 90 days
    - Medium: 3-9 articles or mix of major/minor publications
    - Low: 1-2 articles or only minor publications
    - Minimal: No recent coverage or only company blog posts

    SOURCE PRIORITIZATION (highest to lowest):
    1. Company official website/newsroom (press releases)
    2. Major business/tech publications (TechCrunch, Forbes, Bloomberg, Reuters, WSJ)
    3. Industry-specific publications
    4. Regional business news
    5. Company blog (last resort for press releases)

    VALIDATION RULES:
    - Dates: Must be within last 90 days for recent news (be strict)
    - URLs: Must be valid and accessible
    - Sources: Use official publication names (e.g., "TechCrunch" not "techcrunch.com")
    - Summaries: Keep to 1-2 sentences, focus on key points
    - Types: Clearly distinguish press releases from news coverage

    FIRECRAWL FALLBACK:
    - If initial searches fail or return limited results, try alternative queries
    - Search for company name variations (full name, abbreviated, common misspellings)
    - Try domain-based searches: site:{companyDomain} news OR press OR announcement
    - Check for investor/partner announcements mentioning the company
    - If all fails, check company social media or blog for self-published news

    KEY TOPICS EXTRACTION:
    - Identify recurring themes (e.g., "AI", "sustainability", "growth", "funding")
    - Focus on business-relevant topics, not generic terms
    - Limit to 3-5 most significant topics

    ERROR HANDLING:
    - If no news found, still return structure with empty arrays
    - Mark confidence as lower if relying only on company sources
    - Be transparent about data limitations in confidence scores

    IMPORTANT:
    - Always verify dates are recent (within 90 days for news)
    - Distinguish between company-published content and independent coverage
    - Provide balanced sentiment analysis, not just positive coverage
    - Build on previous agents' findings (company name, website, industry)`,

    tools: [
      createWebsiteScraperTool(firecrawlApiKey) as unknown as Tool<unknown>,
      createSmartSearchTool(firecrawlApiKey, 'news') as unknown as Tool<unknown>,
    ],

    outputType: NewsPRResult,
  });
}

// Export metadata for agent registration
export const newsPRAgentMetadata = {
  name: 'News & PR Agent',
  description: 'Analyzes recent news mentions, press releases, and media sentiment',
  category: 'market-intelligence',
  fields: [
    'recent_news',
    'press_releases',
    'media_sentiment',
    'media_presence',
    'key_topics',
    'notable_events',
  ],
  dependencies: ['discovery-agent'],
  version: '1.0.0',
};

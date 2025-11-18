import { Agent, Tool } from '@openai/agents';
import { z } from 'zod';
import { createWebsiteScraperTool } from '../tools/website-scraper-tool';
import { createSmartSearchTool } from '../tools/smart-search-tool';

const CompetitorSchema = z.object({
  name: z.string().describe('Competitor company name'),
  website: z.string().url().optional().describe('Competitor website'),
  description: z.string().describe('Brief description of competitor'),
  positioning: z.string().describe('How they position themselves vs. target company'),
  strengths: z.array(z.string()).describe('Key competitive strengths'),
  marketShare: z.string().optional().describe('Estimated market share or position'),
  fundingStage: z.string().optional().describe('Funding stage if known'),
});

const MarketIndicatorSchema = z.object({
  indicator: z.string().describe('Market indicator name'),
  value: z.string().describe('Indicator value or assessment'),
  trend: z.enum(['growing', 'stable', 'declining', 'emerging']).describe('Market trend'),
  source: z.string().describe('Source of information'),
});

const CompetitorResult = z.object({
  competitors: z.array(CompetitorSchema).min(3).max(5).describe('Top 3-5 direct competitors'),
  competitiveAdvantages: z.array(z.string()).describe('Target company\'s competitive advantages'),
  marketPosition: z.enum(['leader', 'challenger', 'follower', 'niche']).describe('Company\'s market position'),
  differentiators: z.array(z.string()).describe('Key differentiators from competitors'),
  marketSize: z.string().optional().describe('Estimated market size if available'),
  marketGrowth: z.string().optional().describe('Market growth rate if available'),
  marketIndicators: z.array(MarketIndicatorSchema).describe('Relevant market indicators'),
  competitiveLandscape: z.string().describe('Brief overview of competitive landscape'),
  confidence: z.record(z.string(), z.number()).describe('Confidence scores for each field'),
  sources: z.record(z.string(), z.array(z.string())).describe('Source URLs for each field'),
});

export type Competitor = z.infer<typeof CompetitorSchema>;
export type MarketIndicator = z.infer<typeof MarketIndicatorSchema>;
export type CompetitorResult = z.infer<typeof CompetitorResult>;

export function createCompetitorAgent(firecrawlApiKey: string) {
  console.log('[AGENT-COMPETITOR] Creating Competitor Analysis Agent');

  return new Agent({
    name: 'Competitor Analysis Agent',

    instructions: `You are the Competitor Analysis Agent - specialist in competitive intelligence and market positioning.

    You receive company information from previous agents and analyze the competitive landscape.

    YOUR MISSION:
    1. Identify Top Competitors - Find 3-5 direct competitors
    2. Competitive Positioning - Understand how each competitor positions themselves
    3. Market Analysis - Assess market position, size, and growth
    4. Differentiators - Identify what sets the target company apart
    5. Market Indicators - Extract relevant market signals and trends
    6. Competitive Advantages - Determine target company's strengths

    SEARCH STRATEGIES:
    1. Search "{companyName} competitors alternative"
    2. Search "{companyName} vs [similar company]"
    3. Search "{industry} {companyType} market leaders"
    4. Check comparison sites: G2, Capterra, AlternativeTo, TrustRadius
    5. Search "{companyName} competitive landscape analysis"
    6. Look for analyst reports mentioning the company
    7. Search "companies like {companyName}" or "{companyName} similar companies"
    8. Check industry reports and market research

    COMPETITOR IDENTIFICATION:
    - Focus on DIRECT competitors (similar products/services, target market)
    - Include 3-5 most significant competitors
    - Verify they are actual competitors, not partners or customers
    - Prioritize based on: market share, funding, visibility, direct overlap

    COMPETITIVE ANALYSIS:
    For each competitor, determine:
    - Core product/service offering
    - Target market and customer segment
    - Key differentiators (features, pricing, approach)
    - Strengths relative to target company
    - Market presence and visibility

    MARKET POSITION ASSESSMENT:
    - Leader: Top 3 in market, widely recognized, large market share
    - Challenger: Top 10, growing rapidly, strong but not dominant
    - Follower: Smaller player, following market trends, less innovation
    - Niche: Focused on specific segment or use case

    DIFFERENTIATORS (look for):
    - Unique features or capabilities
    - Pricing strategy (premium, budget, freemium)
    - Target market focus (enterprise, SMB, specific industry)
    - Technology approach or architecture
    - Service model (self-service, full-service, hybrid)
    - Geographic focus or specialization
    - Integration ecosystem or partnerships

    MARKET INDICATORS:
    Identify and analyze:
    - Market trends (consolidation, fragmentation, emergence)
    - Technology trends affecting the space
    - Regulatory changes or compliance requirements
    - Customer behavior shifts
    - Investment trends in the space
    - M&A activity
    - Entry barriers and new entrants

    DATA SOURCES (prioritized):
    1. Industry analyst reports (Gartner, Forrester, IDC)
    2. Market research sites (G2, Capterra, TrustRadius)
    3. Business news covering the industry
    4. Company websites and positioning statements
    5. Competitor comparison articles
    6. Funding and investment news
    7. Customer review sites

    VALIDATION RULES:
    - Competitors must be real, active companies
    - Verify they operate in the same/similar space
    - Ensure they target similar customers
    - Confirm they offer competing solutions
    - Only include 3-5 strongest competitors

    COMPETITIVE ADVANTAGES:
    Determine target company's advantages by comparing:
    - Technology/product capabilities
    - Market timing (first-mover, fast-follower)
    - Customer base or partnerships
    - Team/expertise
    - Funding or resources
    - Brand recognition
    - Geographic presence

    MARKET SIZE & GROWTH:
    - Look for TAM (Total Addressable Market) estimates
    - Find growth rate projections (CAGR)
    - Note timeframe for estimates
    - Cite sources for market data
    - Use ranges if exact data unavailable

    FIRECRAWL FALLBACK:
    - If search results are blocked or limited, try alternative queries
    - Use specific competitor names if identified elsewhere
    - Check industry publications and databases
    - Look for "State of [Industry]" reports
    - Try searching for market maps or landscape visualizations
    - Search for investor presentations or pitch decks mentioning competitors

    IMPORTANT:
    - Be objective in competitive analysis
    - Don't assume target company is superior without evidence
    - Focus on factual differences, not subjective preferences
    - Consider both direct and indirect competitors if direct competitors are few
    - Build on previous agents' findings (industry, company size, focus area)
    - If competitor data is limited, provide what you can find and mark low confidence

    OUTPUT QUALITY:
    - Ensure at least 3 competitors are identified
    - Provide meaningful differentiators, not vague statements
    - Ground market indicators in specific evidence
    - Use proper company names and capitalization
    - Include URLs to relevant sources`,

    tools: [
      createWebsiteScraperTool(firecrawlApiKey) as unknown as Tool<unknown>,
      createSmartSearchTool(firecrawlApiKey, 'business') as unknown as Tool<unknown>,
    ],

    outputType: CompetitorResult,
  });
}

// Export metadata for agent registration
export const competitorAgentMetadata = {
  name: 'Competitor Analysis Agent',
  description: 'Identifies competitors, analyzes market position, and extracts competitive intelligence',
  category: 'market-intelligence',
  fields: [
    'competitors',
    'competitive_advantages',
    'market_position',
    'differentiators',
    'market_size',
    'market_growth',
    'market_indicators',
    'competitive_landscape',
  ],
  dependencies: ['discovery-agent', 'company-profile-agent'],
  version: '1.0.0',
};

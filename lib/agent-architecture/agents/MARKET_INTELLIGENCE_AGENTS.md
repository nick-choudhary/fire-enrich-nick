# Market Intelligence Agents

This document describes the News/PR Agent and Competitor Analysis Agent - two specialized agents for gathering market intelligence and competitive insights.

## Overview

The Market Intelligence Agents extend Fire Enrich's capabilities with:
- **News & PR Analysis**: Track media mentions, press releases, and public sentiment
- **Competitive Intelligence**: Identify competitors, analyze market positioning, and extract market indicators

Both agents follow the established agent architecture pattern and integrate seamlessly with the existing agent orchestration system.

## News & PR Agent

### Purpose

The News & PR Agent specializes in analyzing a company's media presence, recent news coverage, and public relations activities. It provides insights into how a company is perceived in the media and tracks their communication strategy.

### Capabilities

1. **Recent News Extraction (90-day lookback)**
   - Searches major tech and business publications
   - Filters for articles from the last 90 days
   - Provides article summaries and metadata

2. **Press Release Identification**
   - Distinguishes official company announcements from news coverage
   - Searches company newsroom and blog sections
   - Tracks product launches, partnerships, and major announcements

3. **Sentiment Analysis**
   - Analyzes tone of coverage (positive, neutral, negative)
   - Provides overall sentiment assessment across all articles
   - Helps gauge public perception

4. **Media Presence Assessment**
   - Gauges overall visibility (high, medium, low, minimal)
   - Based on frequency and prominence of coverage

5. **Topic Extraction**
   - Identifies recurring themes in coverage
   - Surfaces key business topics and trends

### Output Schema

```typescript
const NewsPRResult = z.object({
  recentNews: z.array(NewsArticleSchema),
  pressReleases: z.array(NewsArticleSchema),
  overallSentiment: z.enum(['positive', 'neutral', 'negative', 'mixed']),
  mediaPresence: z.enum(['high', 'medium', 'low', 'minimal']),
  keyTopics: z.array(z.string()),
  notableEvents: z.array(z.string()).optional(),
  confidence: z.record(z.string(), z.number()),
  sources: z.record(z.string(), z.array(z.string())),
});
```

Each article includes:
- Title, URL, and publication date
- Source/publication name
- Sentiment analysis (positive/neutral/negative)
- Brief summary
- Article type (news, press-release, announcement, feature)

### Search Strategies

The agent employs multiple search strategies:

1. **Current Year News**: `"{companyName} news {currentYear}"`
2. **Press Releases**: `"{companyName} press release announcement {currentYear}"`
3. **Recent Announcements**: `"{companyName} announcement {last3Months}"`
4. **Company Website**: `/news`, `/press`, `/blog`, `/newsroom` sections
5. **Major Publications**: TechCrunch, Forbes, Reuters, Bloomberg, WSJ

### Firecrawl Fallback

When initial searches fail or return limited results:
- Tries alternative company name variations
- Uses domain-based searches: `site:{companyDomain} news OR press`
- Searches for partner/investor announcements
- Falls back to company blog/social media

### Usage Example

```typescript
import { createNewsPRAgent } from '@/lib/agent-architecture';

const agent = createNewsPRAgent(firecrawlApiKey);

const context = {
  input: {
    companyName: 'Firecrawl',
    website: 'https://firecrawl.dev',
    domain: 'firecrawl.dev',
  },
  history: [],
};

const result = await agent.execute(context);

console.log(result.overallSentiment); // 'positive'
console.log(result.mediaPresence); // 'medium'
console.log(result.recentNews.length); // 5
```

### Field Mappings

The agent handles fields containing these keywords:
- `news`, `press`, `media`
- `sentiment`, `coverage`
- `announcement`, `pr`

## Competitor Analysis Agent

### Purpose

The Competitor Analysis Agent identifies competitors, analyzes competitive positioning, and extracts market intelligence. It provides insights into the competitive landscape and helps understand a company's market position.

### Capabilities

1. **Competitor Identification**
   - Identifies 3-5 direct competitors
   - Verifies they operate in similar market
   - Prioritizes by market share and relevance

2. **Competitive Positioning Analysis**
   - Analyzes how each competitor positions themselves
   - Identifies key differentiators
   - Assesses competitive strengths

3. **Market Position Assessment**
   - Determines company's position (leader, challenger, follower, niche)
   - Evaluates relative market share
   - Considers brand recognition and visibility

4. **Differentiator Identification**
   - Identifies unique features or capabilities
   - Analyzes pricing, target market, technology approach
   - Highlights competitive advantages

5. **Market Indicators**
   - Tracks market trends and signals
   - Monitors M&A activity
   - Identifies growth patterns

6. **Market Size & Growth Analysis**
   - Estimates TAM (Total Addressable Market)
   - Finds growth rate projections (CAGR)
   - Cites sources for market data

### Output Schema

```typescript
const CompetitorResult = z.object({
  competitors: z.array(CompetitorSchema).min(3).max(5),
  competitiveAdvantages: z.array(z.string()),
  marketPosition: z.enum(['leader', 'challenger', 'follower', 'niche']),
  differentiators: z.array(z.string()),
  marketSize: z.string().optional(),
  marketGrowth: z.string().optional(),
  marketIndicators: z.array(MarketIndicatorSchema),
  competitiveLandscape: z.string(),
  confidence: z.record(z.string(), z.number()),
  sources: z.record(z.string(), z.array(z.string())),
});
```

Each competitor includes:
- Name, website, description
- Positioning statement
- Key strengths
- Market share estimate
- Funding stage

Each market indicator includes:
- Indicator name and value
- Trend (growing, stable, declining, emerging)
- Source

### Search Strategies

The agent employs comprehensive search strategies:

1. **Direct Competitor Search**: `"{companyName} competitors alternative"`
2. **Comparison Queries**: `"{companyName} vs [similar company]"`
3. **Market Leaders**: `"{industry} {companyType} market leaders"`
4. **Comparison Sites**: G2, Capterra, AlternativeTo, TrustRadius
5. **Landscape Analysis**: `"{companyName} competitive landscape analysis"`
6. **Similar Companies**: `"companies like {companyName}"`
7. **Industry Reports**: Analyst reports and market research

### Data Sources (Prioritized)

1. Industry analyst reports (Gartner, Forrester, IDC)
2. Market research sites (G2, Capterra, TrustRadius)
3. Business news covering the industry
4. Company websites and positioning statements
5. Competitor comparison articles
6. Funding and investment news
7. Customer review sites

### Firecrawl Fallback

When search results are blocked or limited:
- Tries alternative queries with specific competitor names
- Checks industry publications and databases
- Searches for "State of [Industry]" reports
- Looks for market maps or landscape visualizations
- Searches investor presentations mentioning competitors

### Usage Example

```typescript
import { createCompetitorAgent } from '@/lib/agent-architecture';

const agent = createCompetitorAgent(firecrawlApiKey);

const context = {
  input: {
    companyName: 'Stripe',
    industry: 'Payment Processing',
    website: 'https://stripe.com',
  },
  history: [],
};

const result = await agent.execute(context);

console.log(result.competitors.length); // 3-5
console.log(result.marketPosition); // 'leader'
console.log(result.competitors[0].name); // 'PayPal'
```

### Field Mappings

The agent handles fields containing these keywords:
- `competitor`, `competition`, `competitive`
- `market position`, `market share`
- `differentiator`, `advantage`
- `market size`, `market growth`
- `landscape`

## Integration with Orchestrator

Both agents integrate with the existing orchestrator system:

### Dependencies

1. **News & PR Agent**
   - Depends on: Discovery Agent
   - Uses company name and website for targeted searches

2. **Competitor Analysis Agent**
   - Depends on: Discovery Agent, Company Profile Agent
   - Uses company name, industry, and business type for analysis

### Execution Order

The recommended execution order in the orchestrator:

1. Discovery Agent
2. Company Profile Agent
3. Funding Agent
4. Metrics Agent
5. **News & PR Agent** (NEW)
6. **Competitor Analysis Agent** (NEW)
7. Tech Stack Agent
8. General Agent

### Adding to Orchestrator

To integrate these agents into the orchestrator, update the field categorization logic:

```typescript
// In orchestrator.ts
categorizeFields(fields: EnrichmentField[]) {
  const categories = {
    // ... existing categories ...
    newsPR: [],
    competitor: [],
  };

  for (const field of fields) {
    const fieldName = field.name.toLowerCase();

    // News & PR fields
    if (
      fieldName.includes('news') ||
      fieldName.includes('press') ||
      fieldName.includes('media') ||
      fieldName.includes('sentiment') ||
      fieldName.includes('coverage')
    ) {
      categories.newsPR.push(field);
    }

    // Competitor fields
    else if (
      fieldName.includes('competitor') ||
      fieldName.includes('competition') ||
      fieldName.includes('market position') ||
      fieldName.includes('differentiator') ||
      fieldName.includes('landscape')
    ) {
      categories.competitor.push(field);
    }
  }

  return categories;
}
```

## Testing

### Unit Tests

Both agents include comprehensive unit tests:

```bash
# Install testing dependencies
npm install --save-dev jest @types/jest ts-jest

# Run tests
npm test
```

Unit tests cover:
- Agent metadata validation
- Output schema validation
- Error handling
- Configuration correctness

### Integration Tests

Integration tests verify end-to-end functionality:

```bash
# Set environment variables
export FIRECRAWL_API_KEY=your_key
export INTEGRATION_TESTS=true

# Run integration tests
npm test
```

Integration tests cover:
- Real API calls (requires valid API keys)
- News extraction accuracy
- Competitor identification
- Sentiment analysis
- Fallback mechanisms

**Note**: Integration tests are skipped by default to avoid API costs. Set `INTEGRATION_TESTS=true` to enable them.

## Error Handling

Both agents implement robust error handling:

1. **Missing Data**
   - Returns valid structure with empty arrays
   - Marks low confidence scores

2. **API Failures**
   - Implements retry logic
   - Falls back to alternative queries
   - Gracefully degrades

3. **Blocked Sources**
   - Uses Firecrawl fallback strategies
   - Tries alternative data sources
   - Documents limitations in confidence scores

4. **Invalid Input**
   - Validates input with Zod schemas
   - Provides meaningful error messages
   - Prevents system crashes

## Performance Considerations

### Rate Limiting

- Both agents respect Firecrawl API rate limits
- Implements exponential backoff for retries
- Batches searches efficiently

### Search Optimization

- Limits concurrent searches (3-5 per query)
- Prioritizes trusted sources
- Deduplicates results by domain

### Cost Management

- 90-day lookback for news (balances recency with cost)
- 3-5 competitor limit (sufficient without excess)
- Caches results within agent execution

## Extending the Agents

### Adding New Fields to News & PR Agent

```typescript
// In news-pr-agent.ts
const NewsPRResult = z.object({
  // ... existing fields ...
  socialMediaMentions: z.number().optional(),
  viralityScore: z.number().optional(),
});
```

### Adding New Fields to Competitor Agent

```typescript
// In competitor-agent.ts
const CompetitorResult = z.object({
  // ... existing fields ...
  marketTrends: z.array(z.string()),
  emergingCompetitors: z.array(CompetitorSchema),
});
```

## Best Practices

1. **Always provide company name and website** for best results
2. **Use Discovery Agent first** to establish company identity
3. **Combine with Profile Agent** for industry context
4. **Monitor confidence scores** to assess data quality
5. **Review sources** to verify information accuracy
6. **Respect rate limits** to avoid API throttling
7. **Cache results** when processing multiple rows

## Troubleshooting

### No News Found

**Possible causes**:
- Company has minimal media presence
- Company name is too generic (add industry context)
- Search queries are too restrictive

**Solutions**:
- Widen search to include company blog
- Try alternative company name variations
- Search for founder/CEO names

### Few Competitors Identified

**Possible causes**:
- Niche market with few direct competitors
- Company name confusion
- Limited market data available

**Solutions**:
- Broaden search to include adjacent markets
- Include indirect competitors
- Search for "alternative to [company]"

### Low Confidence Scores

**Possible causes**:
- Limited data available
- Conflicting information from sources
- Relying on inferred data

**Solutions**:
- Increase search breadth
- Verify company information
- Use multiple data sources

## Metadata Exports

Both agents export metadata for registration:

```typescript
import { newsPRAgentMetadata, competitorAgentMetadata } from '@/lib/agent-architecture';

console.log(newsPRAgentMetadata);
// {
//   name: 'News & PR Agent',
//   description: 'Analyzes recent news mentions, press releases, and media sentiment',
//   category: 'market-intelligence',
//   fields: [...],
//   dependencies: ['discovery-agent'],
//   version: '1.0.0'
// }

console.log(competitorAgentMetadata);
// {
//   name: 'Competitor Analysis Agent',
//   description: 'Identifies competitors, analyzes market position, ...',
//   category: 'market-intelligence',
//   fields: [...],
//   dependencies: ['discovery-agent', 'company-profile-agent'],
//   version: '1.0.0'
// }
```

## Version History

### v1.0.0 (2025-11-18)

**News & PR Agent**:
- Initial release
- 90-day news lookback
- Sentiment analysis
- Press release identification
- Media presence assessment

**Competitor Analysis Agent**:
- Initial release
- 3-5 competitor identification
- Market positioning analysis
- Market indicator extraction
- Competitive advantage analysis

## Contributing

To contribute improvements:

1. Fork the repository
2. Make your changes to the agent files
3. Add/update tests
4. Update this documentation
5. Submit a pull request

## License

These agents are part of Fire Enrich and are released under the MIT License.

## Support

For issues or questions:
- Open an issue in the repository
- Reference the agent name in the issue title
- Include example inputs and expected outputs

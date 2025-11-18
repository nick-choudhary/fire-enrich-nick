# Integrating News/PR and Competitor Agents into Fire Enrich

## Quick Start

To use the new market intelligence agents in the Fire Enrich web app, follow these steps:

## Step 1: Update the Orchestrator

Add field categorization for the new agents in `lib/agent-architecture/orchestrator.ts`:

```typescript
// Find the categorizeFields method (around line 200-300)
private categorizeFields(fields: EnrichmentField[]) {
  const categories = {
    discovery: [] as EnrichmentField[],
    profile: [] as EnrichmentField[],
    metrics: [] as EnrichmentField[],
    funding: [] as EnrichmentField[],
    techStack: [] as EnrichmentField[],
    newsPR: [] as EnrichmentField[],        // ADD THIS
    competitor: [] as EnrichmentField[],    // ADD THIS
    other: [] as EnrichmentField[],
  };

  for (const field of fields) {
    const fieldName = field.name.toLowerCase();
    const fieldDesc = field.description?.toLowerCase() || '';

    // ... existing categorization logic ...

    // ADD: News & PR fields
    else if (
      fieldName.includes('news') ||
      fieldName.includes('press') ||
      fieldName.includes('media') ||
      fieldName.includes('sentiment') ||
      fieldName.includes('pr') ||
      fieldDesc.includes('news') ||
      fieldDesc.includes('press release')
    ) {
      categories.newsPR.push(field);
    }

    // ADD: Competitor fields
    else if (
      fieldName.includes('competitor') ||
      fieldName.includes('competition') ||
      fieldName.includes('market position') ||
      fieldName.includes('differentiator') ||
      fieldName.includes('landscape') ||
      fieldDesc.includes('competitor') ||
      fieldDesc.includes('market analysis')
    ) {
      categories.competitor.push(field);
    }

    // ... rest of categorization ...
  }

  return categories;
}
```

## Step 2: Add Agent Execution in Orchestrator

Add the agent execution phases in the `enrichRow` method (around line 100-200):

```typescript
// After the existing agent phases (discovery, profile, metrics, funding, techStack)

// News & PR phase
if (fieldCategories.newsPR.length > 0) {
  console.log(`[Orchestrator] Activating NEWS-PR-AGENT for fields: ${fieldCategories.newsPR.map(f => f.name).join(', ')}`);
  if (onAgentProgress) {
    onAgentProgress(`News & PR Agent: Analyzing media coverage for ${context.companyName || emailContext.domain}`, 'agent');
    onAgentProgress(`Target fields: ${fieldCategories.newsPR.map(f => f.name).join(', ')}`, 'info');
  }
  const newsPRResults = await this.runNewsPRPhase(
    context,
    fieldCategories.newsPR,
    onAgentProgress
  );
  console.log(`[Orchestrator] NEWS-PR-AGENT completed, found ${Object.keys(newsPRResults).length} values`);
  if (onAgentProgress && Object.keys(newsPRResults).length > 0) {
    onAgentProgress(`News & PR analysis complete: Found ${Object.keys(newsPRResults).length} fields`, 'success');
  }
  Object.assign(enrichments, newsPRResults);
}

// Competitor phase
if (fieldCategories.competitor.length > 0) {
  console.log(`[Orchestrator] Activating COMPETITOR-AGENT for fields: ${fieldCategories.competitor.map(f => f.name).join(', ')}`);
  if (onAgentProgress) {
    onAgentProgress(`Competitor Agent: Analyzing competitive landscape for ${context.companyName || emailContext.domain}`, 'agent');
    onAgentProgress(`Target fields: ${fieldCategories.competitor.map(f => f.name).join(', ')}`, 'info');
  }
  const competitorResults = await this.runCompetitorPhase(
    context,
    fieldCategories.competitor,
    onAgentProgress
  );
  console.log(`[Orchestrator] COMPETITOR-AGENT completed, found ${Object.keys(competitorResults).length} values`);
  if (onAgentProgress && Object.keys(competitorResults).length > 0) {
    onAgentProgress(`Competitor analysis complete: Found ${Object.keys(competitorResults).length} fields`, 'success');
  }
  Object.assign(enrichments, competitorResults);
}
```

## Step 3: Implement Agent Runner Methods

Add these methods to the orchestrator class:

```typescript
private async runNewsPRPhase(
  context: OrchestrationContext,
  fields: EnrichmentField[],
  onAgentProgress?: (message: string, type: 'info' | 'success' | 'warning' | 'agent') => void
): Promise<Record<string, EnrichmentResult>> {
  const { createNewsPRAgent } = await import('./agents/news-pr-agent');
  const agent = createNewsPRAgent(this.firecrawlApiKey);

  const agentInput = {
    companyName: context.companyName || context.emailContext.companyNameGuess,
    website: context.discoveredData.website || `https://${context.emailContext.domain}`,
    domain: context.emailContext.domain,
    industry: context.discoveredData.industry,
  };

  try {
    const result = await agent.execute({
      input: agentInput,
      history: [],
    });

    // Convert agent result to enrichment format
    const enrichments: Record<string, EnrichmentResult> = {};

    for (const field of fields) {
      const fieldName = field.name.toLowerCase();

      if (fieldName.includes('news') || fieldName.includes('recent')) {
        enrichments[field.name] = {
          field: field.name,
          value: JSON.stringify(result.recentNews),
          confidence: result.confidence?.recentNews || 0.8,
          source: 'News & PR Agent',
          sourceContext: result.sources?.recentNews?.map(url => ({
            url,
            snippet: 'News article'
          })),
        };
      } else if (fieldName.includes('sentiment')) {
        enrichments[field.name] = {
          field: field.name,
          value: result.overallSentiment,
          confidence: result.confidence?.overallSentiment || 0.85,
          source: 'News & PR Agent',
        };
      } else if (fieldName.includes('press')) {
        enrichments[field.name] = {
          field: field.name,
          value: JSON.stringify(result.pressReleases),
          confidence: result.confidence?.pressReleases || 0.85,
          source: 'News & PR Agent',
          sourceContext: result.sources?.pressReleases?.map(url => ({
            url,
            snippet: 'Press release'
          })),
        };
      }
    }

    return enrichments;
  } catch (error) {
    console.error('[NEWS-PR-AGENT] Error:', error);
    if (onAgentProgress) {
      onAgentProgress(`News & PR Agent encountered an error: ${error instanceof Error ? error.message : String(error)}`, 'warning');
    }
    return {};
  }
}

private async runCompetitorPhase(
  context: OrchestrationContext,
  fields: EnrichmentField[],
  onAgentProgress?: (message: string, type: 'info' | 'success' | 'warning' | 'agent') => void
): Promise<Record<string, EnrichmentResult>> {
  const { createCompetitorAgent } = await import('./agents/competitor-agent');
  const agent = createCompetitorAgent(this.firecrawlApiKey);

  const agentInput = {
    companyName: context.companyName || context.emailContext.companyNameGuess,
    website: context.discoveredData.website || `https://${context.emailContext.domain}`,
    domain: context.emailContext.domain,
    industry: context.discoveredData.industry,
  };

  try {
    const result = await agent.execute({
      input: agentInput,
      history: [],
    });

    // Convert agent result to enrichment format
    const enrichments: Record<string, EnrichmentResult> = {};

    for (const field of fields) {
      const fieldName = field.name.toLowerCase();

      if (fieldName.includes('competitor')) {
        enrichments[field.name] = {
          field: field.name,
          value: JSON.stringify(result.competitors),
          confidence: result.confidence?.competitors || 0.85,
          source: 'Competitor Analysis Agent',
          sourceContext: result.sources?.competitors?.map(url => ({
            url,
            snippet: 'Competitor data'
          })),
        };
      } else if (fieldName.includes('market position')) {
        enrichments[field.name] = {
          field: field.name,
          value: result.marketPosition,
          confidence: result.confidence?.marketPosition || 0.8,
          source: 'Competitor Analysis Agent',
        };
      } else if (fieldName.includes('differentiator')) {
        enrichments[field.name] = {
          field: field.name,
          value: result.differentiators?.join(', ') || '',
          confidence: result.confidence?.differentiators || 0.75,
          source: 'Competitor Analysis Agent',
        };
      }
    }

    return enrichments;
  } catch (error) {
    console.error('[COMPETITOR-AGENT] Error:', error);
    if (onAgentProgress) {
      onAgentProgress(`Competitor Agent encountered an error: ${error instanceof Error ? error.message : String(error)}`, 'warning');
    }
    return {};
  }
}
```

## Step 4: Test in the Web App

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Upload a CSV with emails

4. Add custom fields like:
   - "Recent News" or "Media Sentiment"
   - "Top Competitors" or "Market Position"

5. Run enrichment and watch the agents work!

## Field Examples

### News & PR Fields
- "Recent News" → Returns array of recent news articles
- "Media Sentiment" → Returns overall sentiment (positive/neutral/negative)
- "Press Releases" → Returns official company announcements
- "Media Presence" → Returns visibility level (high/medium/low)
- "Key Topics" → Returns main themes in coverage

### Competitor Fields
- "Top Competitors" → Returns 3-5 main competitors
- "Market Position" → Returns market standing (leader/challenger/follower/niche)
- "Competitive Advantages" → Returns company's strengths
- "Market Size" → Returns estimated market size
- "Differentiators" → Returns what sets company apart

## Troubleshooting

### Agents not running?
- Check that field names match the categorization logic
- Verify API keys are set in .env.local
- Check browser console for errors

### Getting empty results?
- Company might have minimal news coverage
- Try more well-known companies first (e.g., OpenAI, Stripe)
- Check confidence scores - low scores indicate limited data

### API rate limits?
- Both agents make multiple searches
- Consider implementing caching
- Add delays between requests if needed

## Next Steps

- Monitor performance and adjust search strategies
- Add caching for frequently enriched companies
- Consider batching API requests
- Add more sophisticated error handling

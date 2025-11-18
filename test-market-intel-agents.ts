/**
 * Quick manual test for News/PR and Competitor Analysis agents
 *
 * Usage:
 * 1. Set your API keys in .env.local
 * 2. Run: npx ts-node test-market-intel-agents.ts
 */

import { createNewsPRAgent, createCompetitorAgent } from './lib/agent-architecture';

async function testNewsPRAgent() {
  console.log('\n🗞️  Testing News & PR Agent...\n');

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY not found in environment');
  }

  const agent = createNewsPRAgent(apiKey);

  // Test with a well-known company
  const context = {
    input: {
      companyName: 'OpenAI',
      website: 'https://openai.com',
      domain: 'openai.com',
      industry: 'Artificial Intelligence',
    },
    history: [],
  };

  try {
    console.log('Searching for news about OpenAI...');
    const result = await agent.execute(context);

    console.log('\n✅ Results:');
    console.log(`- Recent News: ${result.recentNews?.length || 0} articles`);
    console.log(`- Press Releases: ${result.pressReleases?.length || 0} releases`);
    console.log(`- Overall Sentiment: ${result.overallSentiment}`);
    console.log(`- Media Presence: ${result.mediaPresence}`);
    console.log(`- Key Topics: ${result.keyTopics?.join(', ')}`);

    if (result.recentNews && result.recentNews.length > 0) {
      console.log('\nSample Article:');
      const article = result.recentNews[0];
      console.log(`  Title: ${article.title}`);
      console.log(`  Source: ${article.source}`);
      console.log(`  Date: ${article.date}`);
      console.log(`  Sentiment: ${article.sentiment}`);
      console.log(`  URL: ${article.url}`);
    }

    return result;
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function testCompetitorAgent() {
  console.log('\n🏆 Testing Competitor Analysis Agent...\n');

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY not found in environment');
  }

  const agent = createCompetitorAgent(apiKey);

  // Test with a well-known company
  const context = {
    input: {
      companyName: 'Stripe',
      website: 'https://stripe.com',
      domain: 'stripe.com',
      industry: 'Payment Processing',
    },
    history: [],
  };

  try {
    console.log('Analyzing competitors for Stripe...');
    const result = await agent.execute(context);

    console.log('\n✅ Results:');
    console.log(`- Competitors Found: ${result.competitors?.length || 0}`);
    console.log(`- Market Position: ${result.marketPosition}`);
    console.log(`- Market Size: ${result.marketSize || 'N/A'}`);
    console.log(`- Market Growth: ${result.marketGrowth || 'N/A'}`);
    console.log(`- Differentiators: ${result.differentiators?.join(', ')}`);

    if (result.competitors && result.competitors.length > 0) {
      console.log('\nTop Competitors:');
      result.competitors.forEach((comp, idx) => {
        console.log(`  ${idx + 1}. ${comp.name}`);
        console.log(`     - ${comp.description}`);
        console.log(`     - Position: ${comp.positioning}`);
        if (comp.marketShare) console.log(`     - Market Share: ${comp.marketShare}`);
      });
    }

    if (result.marketIndicators && result.marketIndicators.length > 0) {
      console.log('\nMarket Indicators:');
      result.marketIndicators.forEach((indicator) => {
        console.log(`  - ${indicator.indicator}: ${indicator.value} (${indicator.trend})`);
      });
    }

    return result;
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function main() {
  console.log('🚀 Testing Market Intelligence Agents\n');
  console.log('Note: These tests make real API calls and may take 30-60 seconds per agent.\n');

  try {
    // Test News & PR Agent
    await testNewsPRAgent();

    console.log('\n' + '='.repeat(80) + '\n');

    // Test Competitor Agent
    await testCompetitorAgent();

    console.log('\n✨ All tests completed successfully!\n');
  } catch (error) {
    console.error('\n💥 Test failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();

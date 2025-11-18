import { AgentOrchestrator } from './orchestrator';

export { AgentOrchestrator } from './orchestrator';
export * from './core/types';

// Export agents
export { createDiscoveryAgent } from './agents/discovery-agent';
export { createCompanyProfileAgent } from './agents/company-profile-agent';
export { createFundingAgent } from './agents/funding-agent';
export { createMetricsAgent } from './agents/metrics-agent';
export { createNewsPRAgent, newsPRAgentMetadata } from './agents/news-pr-agent';
export { createCompetitorAgent, competitorAgentMetadata } from './agents/competitor-agent';

// Factory function for easy initialization
export function createAgentOrchestrator(
  firecrawlApiKey: string,
  openaiApiKey: string
) {
  return new AgentOrchestrator(firecrawlApiKey, openaiApiKey);
}
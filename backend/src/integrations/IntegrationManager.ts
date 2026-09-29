import { IntegrationProvider } from './IntegrationProvider';
import { GoogleSearchConsoleProvider } from './search-console/GoogleSearchConsoleProvider';
import { GoogleAnalyticsProvider } from './analytics/GoogleAnalyticsProvider';
import { GooglePageSpeedProvider } from './pagespeed/GooglePageSpeedProvider';
import { GenericSeoProvider } from './seo-data/GenericSeoProvider';

class IntegrationManager {
  private providers: Map<string, IntegrationProvider> = new Map();

  constructor() {
    this.registerProvider(new GoogleSearchConsoleProvider());
    this.registerProvider(new GoogleAnalyticsProvider());
    this.registerProvider(new GooglePageSpeedProvider());
    this.registerProvider(new GenericSeoProvider());
  }

  registerProvider(provider: IntegrationProvider) {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: string): IntegrationProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Integration provider '${name}' not found.`);
    }
    return provider;
  }

  getAvailableProviders() {
    return Array.from(this.providers.keys());
  }
}

export const integrationManager = new IntegrationManager();

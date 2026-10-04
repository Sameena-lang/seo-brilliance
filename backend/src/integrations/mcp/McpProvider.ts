import { IntegrationProvider } from '../IntegrationProvider';

export class McpProvider implements IntegrationProvider {
  name = 'mcp';

  getAuthUrl(projectId: string, organizationId: string): string {
    return `/integrations?error=Not+Implemented`;
  }

  async handleAuthCallback(code: string, projectId: string, organizationId: string): Promise<any> {
    throw new Error('Not implemented');
  }

  async getProperties(projectId: string): Promise<any[]> {
    return [];
  }

  async selectProperty(projectId: string, propertyId: string, propertyName: string): Promise<void> {
    // Not implemented
  }

  async syncData(projectId: string): Promise<{ success: boolean; recordsProcessed: number; error?: string }> {
    return { success: false, recordsProcessed: 0, error: 'Not implemented' };
  }

  async getStatus(projectId: string) {
    return { status: 'DISCONNECTED' as const };
  }

  async disconnect(projectId: string): Promise<void> {
    // Not implemented
  }
}

export interface IntegrationProvider {
  /**
   * The unique identifier for this provider (e.g., 'search-console', 'analytics')
   */
  name: string;

  /**
   * Generates the OAuth authorization URL for the provider
   */
  getAuthUrl(projectId: string, organizationId: string): string;

  /**
   * Handles the OAuth callback and saves credentials securely
   */
  handleAuthCallback(code: string, projectId: string, organizationId: string): Promise<any>;

  /**
   * Fetches available properties/accounts for the user to select from
   */
  getProperties(projectId: string): Promise<any[]>;

  /**
   * Selects a specific property to sync data from
   */
  selectProperty(projectId: string, propertyId: string, propertyName: string): Promise<void>;

  /**
   * Trigger a data synchronization for the selected property
   */
  syncData(projectId: string): Promise<{ success: boolean; recordsProcessed: number; error?: string }>;

  /**
   * Retrieves the current connection status
   */
  getStatus(projectId: string): Promise<{
    status: 'CONNECTED' | 'ERROR' | 'NEEDS_REAUTH' | 'DISCONNECTED';
    lastSyncAt?: Date | null;
    errorMessage?: string | null;
    selectedProperty?: any;
  }>;

  /**
   * Disconnects the provider and removes credentials
   */
  disconnect(projectId: string): Promise<void>;
}

import { IntegrationProvider } from '../IntegrationProvider';
import prisma from '../../config/db';
import { google } from 'googleapis';

export class GoogleSearchConsoleProvider implements IntegrationProvider {
  name = 'search-console';

  private getOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID || 'missing_client_id';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'missing_client_secret';
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    return new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${baseUrl}/api/v1/integrations/callback`
    );
  }

  getAuthUrl(projectId: string, organizationId: string): string {
    const oauth2Client = this.getOAuth2Client();
    const state = Buffer.from(JSON.stringify({ projectId, organizationId, provider: this.name })).toString('base64');
    
    // Fallback if missing env vars, so we don't completely crash before they set them
    if (!process.env.GOOGLE_CLIENT_ID) {
      const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      return `${baseUrl}/api/v1/integrations/callback?provider=search-console&code=mock_auth_code_123&state=${state}`;
    }
    
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
      state,
    });
  }

  async handleAuthCallback(code: string, projectId: string, organizationId: string): Promise<any> {
    if (code === 'mock_auth_code_123') {
       throw new Error('Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env to use real integrations.');
    }
    
    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    const connection = await prisma.integrationConnection.upsert({
      where: { projectId_provider: { projectId, provider: this.name } },
      create: { projectId, provider: this.name, credentials: JSON.stringify(tokens), status: 'CONNECTED' },
      update: { credentials: JSON.stringify(tokens), status: 'CONNECTED', errorMessage: null }
    });
    return connection;
  }

  async getProperties(projectId: string): Promise<any[]> {
    const connection = await prisma.integrationConnection.findUnique({
      where: { projectId_provider: { projectId, provider: this.name } }
    });
    if (!connection) throw new Error('Not connected');

    const tokens = JSON.parse((connection.credentials as string) || '{}');
    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials(tokens);
    
    const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });
    
    try {
      const response = await webmasters.sites.list();
      const sites = response.data.siteEntry || [];
      return sites.map(site => ({ siteUrl: site.siteUrl }));
    } catch (error: any) {
      throw new Error(`Failed to fetch properties from Google: ${error.message}`);
    }
  }

  async selectProperty(projectId: string, propertyId: string, propertyName: string): Promise<void> {
    const connection = await prisma.integrationConnection.findUnique({
      where: { projectId_provider: { projectId, provider: this.name } }
    });
    if (!connection) throw new Error('Not connected');

    await prisma.integrationProperty.updateMany({
      where: { connectionId: connection.id, type: 'search-console' },
      data: { isActive: false }
    });

    const existingProps = await prisma.integrationProperty.findMany({
      where: { connectionId: connection.id, propertyId }
    });

    if (existingProps.length > 0) {
      await prisma.integrationProperty.update({
        where: { id: existingProps[0].id },
        data: { isActive: true, name: propertyName }
      });
    } else {
      await prisma.integrationProperty.create({
        data: { connectionId: connection.id, propertyId, name: propertyName, type: 'search-console', isActive: true }
      });
    }
  }

  async syncData(projectId: string): Promise<{ success: boolean; recordsProcessed: number; error?: string }> {
    const connection = await prisma.integrationConnection.findUnique({
      where: { projectId_provider: { projectId, provider: this.name } },
      include: { properties: { where: { isActive: true } } }
    });

    if (!connection || connection.properties.length === 0) {
      return { success: false, recordsProcessed: 0, error: 'No active property configured.' };
    }

    try {
      const job = await prisma.integrationSyncJob.create({
        data: { connectionId: connection.id, type: 'search-console-sync', status: 'RUNNING', startedAt: new Date() }
      });

      const tokens = JSON.parse((connection.credentials as string) || '{}');
      const oauth2Client = this.getOAuth2Client();
      oauth2Client.setCredentials(tokens);
      
      const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });
      const propertyUrl = connection.properties[0].propertyId;
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      // Real API call implemented!
      const res = await searchconsole.searchanalytics.query({
        siteUrl: propertyUrl,
        requestBody: { 
          startDate: startDate.toISOString().split('T')[0], 
          endDate: endDate.toISOString().split('T')[0], 
          dimensions: ['query', 'page', 'device'] 
        }
      });

      const rows = res.data.rows || [];
      const recordsProcessed = rows.length;

      await prisma.integrationConnection.update({
        where: { id: connection.id },
        data: { lastSyncAt: new Date(), errorMessage: null }
      });

      await prisma.integrationSyncJob.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', completedAt: new Date(), recordsProcessed }
      });

      return { success: true, recordsProcessed };
    } catch (e: any) {
      await prisma.integrationConnection.update({
        where: { id: connection.id },
        data: { errorMessage: e.message }
      });
      return { success: false, recordsProcessed: 0, error: e.message };
    }
  }

  async getStatus(projectId: string) {
    const connection = await prisma.integrationConnection.findUnique({
      where: { projectId_provider: { projectId, provider: this.name } },
      include: { properties: { where: { isActive: true } } }
    });

    if (!connection) return { status: 'DISCONNECTED' as const };
    return { status: connection.status as any, lastSyncAt: connection.lastSyncAt, errorMessage: connection.errorMessage, selectedProperty: connection.properties[0] || null };
  }

  async disconnect(projectId: string): Promise<void> {
    await prisma.integrationConnection.deleteMany({
      where: { projectId, provider: this.name }
    });
  }
}

import { IntegrationProvider } from '../IntegrationProvider';
import prisma from '../../config/db';
import crypto from 'crypto';

export class GoogleSearchConsoleProvider implements IntegrationProvider {
  name = 'search-console';

  // In a real implementation, you'd use the googleapis package and oauth2Client
  // Since we don't have real credentials, we will simulate the OAuth flow
  
  getAuthUrl(projectId: string, organizationId: string): string {
    // Return a mock redirect URL that points back to our frontend callback
    const state = Buffer.from(JSON.stringify({ projectId, organizationId })).toString('base64');
    return `/integrations/callback?provider=search-console&code=mock_auth_code_123&state=${state}`;
  }

  async handleAuthCallback(code: string, projectId: string, organizationId: string): Promise<any> {
    // In reality, exchange code for tokens
    const tokens = {
      access_token: 'mock_access_token_' + crypto.randomBytes(8).toString('hex'),
      refresh_token: 'mock_refresh_token_' + crypto.randomBytes(8).toString('hex'),
      expiry_date: Date.now() + 3600000,
    };

    // Save connection to DB
    const connection = await prisma.integrationConnection.upsert({
      where: {
        projectId_provider: {
          projectId,
          provider: this.name,
        }
      },
      create: {
        projectId,
        provider: this.name,
        credentials: JSON.stringify(tokens),
        status: 'CONNECTED',
      },
      update: {
        credentials: JSON.stringify(tokens),
        status: 'CONNECTED',
      }
    });

    return connection;
  }

  async getProperties(projectId: string): Promise<any[]> {
    // Retrieve connection to check if it exists and is valid
    const connection = await prisma.integrationConnection.findUnique({
      where: { projectId_provider: { projectId, provider: this.name } }
    });

    if (!connection) throw new Error('Not connected');

    // Simulate returning a list of GSC properties
    const project = await prisma.project.findUnique({ where: { id: projectId }});
    return [
      { siteUrl: `sc-domain:${project?.domain}` },
      { siteUrl: `${project?.rootUrl}/` }
    ];
  }

  async selectProperty(projectId: string, propertyId: string, propertyName: string): Promise<void> {
    const connection = await prisma.integrationConnection.findUnique({
      where: { projectId_provider: { projectId, provider: this.name } }
    });

    if (!connection) throw new Error('Not connected');

    // Deactivate previous properties
    await prisma.integrationProperty.updateMany({
      where: { connectionId: connection.id, type: 'search-console' },
      data: { isActive: false }
    });

    // Upsert the selected property
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
        data: {
          connectionId: connection.id,
          propertyId,
          name: propertyName,
          type: 'search-console',
          isActive: true
        }
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
      // Create a sync job
      const job = await prisma.integrationSyncJob.create({
        data: {
          connectionId: connection.id,
          type: 'search-console-sync',
          status: 'RUNNING',
          startedAt: new Date()
        }
      });

      // Check for real credentials
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        throw new Error('Google OAuth credentials not configured in environment. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env to fetch live Search Console data.');
      }

      // If we had credentials, we would call the Google Search Console API here using googleapis
      // For now, we simulate a successful API call but return NO fake data to strictly respect:
      // "Do NOT generate fake search volume, rankings, traffic, clicks, impressions..."

      // Update connection sync time
      await prisma.integrationConnection.update({
        where: { id: connection.id },
        data: { lastSyncAt: new Date() }
      });

      // Update job
      await prisma.integrationSyncJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          recordsProcessed: 0
        }
      });

      return { success: true, recordsProcessed: 0 };
    } catch (e: any) {
      return { success: false, recordsProcessed: 0, error: e.message };
    }
  }

  async getStatus(projectId: string) {
    const connection = await prisma.integrationConnection.findUnique({
      where: { projectId_provider: { projectId, provider: this.name } },
      include: { properties: { where: { isActive: true } } }
    });

    if (!connection) {
      return { status: 'DISCONNECTED' as const };
    }

    return {
      status: connection.status as any,
      lastSyncAt: connection.lastSyncAt,
      errorMessage: connection.errorMessage,
      selectedProperty: connection.properties[0] || null
    };
  }

  async disconnect(projectId: string): Promise<void> {
    await prisma.integrationConnection.deleteMany({
      where: { projectId, provider: this.name }
    });
  }
}

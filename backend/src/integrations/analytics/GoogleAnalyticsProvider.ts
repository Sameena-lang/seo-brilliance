import { IntegrationProvider } from '../IntegrationProvider';
import prisma from '../../config/db';
import crypto from 'crypto';

export class GoogleAnalyticsProvider implements IntegrationProvider {
  name = 'analytics';
  
  getAuthUrl(projectId: string, organizationId: string): string {
    const state = Buffer.from(JSON.stringify({ projectId, organizationId })).toString('base64');
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return `${baseUrl}/api/v1/integrations/callback?provider=analytics&code=mock_auth_code_123&state=${state}`;
  }

  async handleAuthCallback(code: string, projectId: string, organizationId: string): Promise<any> {
    const tokens = {
      access_token: 'mock_access_token_' + crypto.randomBytes(8).toString('hex'),
      refresh_token: 'mock_refresh_token_' + crypto.randomBytes(8).toString('hex'),
      expiry_date: Date.now() + 3600000,
    };

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
    const connection = await prisma.integrationConnection.findUnique({
      where: { projectId_provider: { projectId, provider: this.name } }
    });

    if (!connection) throw new Error('Not connected');

    const project = await prisma.project.findUnique({ where: { id: projectId }});
    return [
      { propertyId: `properties/${Math.floor(Math.random() * 10000000)}`, displayName: `GA4 - ${project?.domain}` },
    ];
  }

  async selectProperty(projectId: string, propertyId: string, propertyName: string): Promise<void> {
    const connection = await prisma.integrationConnection.findUnique({
      where: { projectId_provider: { projectId, provider: this.name } }
    });

    if (!connection) throw new Error('Not connected');

    await prisma.integrationProperty.updateMany({
      where: { connectionId: connection.id, type: 'analytics' },
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
        data: {
          connectionId: connection.id,
          propertyId,
          name: propertyName,
          type: 'analytics',
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
      const job = await prisma.integrationSyncJob.create({
        data: {
          connectionId: connection.id,
          type: 'analytics-sync',
          status: 'RUNNING',
          startedAt: new Date()
        }
      });

      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        throw new Error('Google OAuth credentials not configured in environment.');
      }

      await prisma.integrationConnection.update({
        where: { id: connection.id },
        data: { lastSyncAt: new Date() }
      });

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

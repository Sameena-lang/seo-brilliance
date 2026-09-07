import prisma from '../config/db';
import { crawlQueue } from '../queues';
import { getProjectById } from './project.service';

export const createScan = async (projectId: string, organizationId: string) => {
  // Ensure project exists and belongs to the user's org
  const project = await getProjectById(projectId, organizationId);

  // Check if a scan is already running for this project
  const runningScan = await prisma.scan.findFirst({
    where: {
      projectId,
      status: { in: ['PENDING', 'RUNNING'] }
    }
  });

  if (runningScan) {
    throw new Error('A scan is already running for this project');
  }

  const scan = await prisma.scan.create({
    data: {
      projectId,
      status: 'PENDING',
      pagesDiscovered: 1,
    },
  });

  // Add to BullMQ crawl queue
  await crawlQueue.add('startCrawl', { scanId: scan.id, projectId: project.id, url: project.rootUrl, settings: project.crawlSettings });

  return scan;
};

export const getScan = async (scanId: string, organizationId: string) => {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      project: true,
      siteScore: true,
      aiSummary: true,
    }
  });

  if (!scan || scan.project.organizationId !== organizationId) {
    throw new Error('Scan not found');
  }

  return scan;
};

export const cancelScan = async (scanId: string, organizationId: string) => {
  const scan = await getScan(scanId, organizationId);

  if (scan.status === 'COMPLETED' || scan.status === 'FAILED' || scan.status === 'CANCELLED') {
    throw new Error('Cannot cancel a scan that has already finished');
  }

  return prisma.scan.update({
    where: { id: scanId },
    data: { status: 'CANCELLED', finishedAt: new Date() }
  });
};

export const getScanLogs = async (scanId: string, organizationId: string) => {
  await getScan(scanId, organizationId); // Validates existence and ownership

  return prisma.crawlLog.findMany({
    where: { scanId },
    orderBy: { createdAt: 'desc' },
    take: 100, // Just return latest 100 for live view
  });
};

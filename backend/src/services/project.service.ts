import prisma from '../config/db';

export const createProject = async (data: any, userId: string, organizationId: string) => {
  const rootUrl = data.rootUrl || (data.domain.startsWith('http') ? data.domain : `https://${data.domain}`);
  return prisma.project.create({
    data: {
      ...data,
      rootUrl,
      userId,
      organizationId,
    },
  });
};

export const getProjects = async (organizationId: string) => {
  return prisma.project.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { scans: true }
      }
    }
  });
};

export const getProjectById = async (id: string, organizationId: string) => {
  const project = await prisma.project.findFirst({
    where: { id, organizationId },
    include: {
      scans: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      }
    }
  });

  if (!project) {
    throw new Error('Project not found');
  }

  return project;
};

export const updateProject = async (id: string, data: any, organizationId: string) => {
  const project = await prisma.project.findFirst({
    where: { id, organizationId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  return prisma.project.update({
    where: { id },
    data,
  });
};

export const deleteProject = async (id: string, organizationId: string) => {
  const project = await prisma.project.findFirst({
    where: { id, organizationId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  return prisma.project.delete({
    where: { id },
  });
};

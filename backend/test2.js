const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const issuesWithProjectObj = await prisma.issue.findMany({
    where: { page: { scan: { project: { id: 'invalid-id-that-does-not-exist' } } } },
    take: 1
  });
  
  console.log("Using project: { id: ... } returned", issuesWithProjectObj.length, "issues");

  const issuesWithProjectId = await prisma.issue.findMany({
    where: { page: { scan: { projectId: 'invalid-id-that-does-not-exist' } } },
    take: 1
  });

  console.log("Using projectId: ... returned", issuesWithProjectId.length, "issues");
}

main().finally(() => prisma.$disconnect());

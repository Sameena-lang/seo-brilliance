const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orgId = "dummy-org";
  const projectId = "dummy-project";
  
  const where = { page: { scan: { project: { organizationId: orgId } } } };
  where.page.scan.project.id = projectId;
  
  console.log("Where object:", JSON.stringify(where, null, 2));
  
  try {
    await prisma.issue.findMany({ where, take: 1 });
    console.log("Query valid!");
  } catch (err) {
    console.error("Prisma error:", err.message);
  }
}

main().finally(() => prisma.$disconnect());

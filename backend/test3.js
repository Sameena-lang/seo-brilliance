const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany();
  console.log("Projects:");
  for (const p of projects) {
    console.log(`- ${p.domain} (${p.id})`);
    
    // Test the exact Prisma filter the backend uses
    const where = { page: { scan: { project: { organizationId: p.organizationId } } } };
    where.page.scan.project.id = p.id;
    
    const issues = await prisma.issue.findMany({
      where,
      include: { page: { select: { url: true } } }
    });
    console.log(`  -> Found ${issues.length} issues using project.id = ${p.id}`);
    if (issues.length > 0) {
      console.log(`  -> First issue URL: ${issues[0].page.url}`);
    }
  }
}

main().finally(() => prisma.$disconnect());

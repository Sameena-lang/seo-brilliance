const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany();
  console.log(`Found ${projects.length} projects.`);
  for (const p of projects) {
    if (p.domain.includes('chennai') || p.domain.includes('thenam')) {
      console.log(`- Project: ${p.domain} (${p.id})`);
    }
  }

  const issues = await prisma.issue.findMany({
    include: { page: { select: { url: true } } }
  });
  console.log(`Found ${issues.length} total issues in DB.`);
  if (issues.length > 0) {
    console.log(`First 5 issues:`);
    for (const i of issues.slice(0, 5)) {
      console.log(`- Issue on ${i.page.url} (${i.title})`);
    }
  }
}

main().finally(() => prisma.$disconnect());

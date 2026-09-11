import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const issues = await prisma.issue.count();
  console.log('Total issues in DB:', issues);
  
  const scans = await prisma.scan.findMany({
    include: { siteScore: true, _count: { select: { issues: true, pages: true } } }
  });
  console.log('Scans:', JSON.stringify(scans, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.issue.deleteMany({});
  await prisma.page.deleteMany({});
  await prisma.siteScore.deleteMany({});
  await prisma.scan.deleteMany({});
  console.log("Cleared all old scans and issues.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

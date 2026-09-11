const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.scan.findFirst({ where: { status: 'COMPLETED' }, orderBy: { createdAt: 'desc' } })
  .then(scan => {
    if(!scan) { console.log('NO SCAN'); return; }
    console.log('SCAN_ID=' + scan.id);
  })
  .finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        scans: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { crawlLogs: true }
        }
      }
    });

    for (const project of projects) {
      console.log(`Project ${project.domain}:`);
      if (project.scans.length > 0) {
        const scan = project.scans[0];
        console.log(` - Latest scan ${scan.id}: Status=${scan.status}`);
        for (const log of scan.crawlLogs) {
          console.log(`   - Log: ${log.level} | ${log.message}`);
        }
      } else {
        console.log(` - No scans`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}
check();

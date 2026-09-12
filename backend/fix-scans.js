const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixStuckScans() {
  try {
    const result = await prisma.scan.updateMany({
      where: {
        status: { in: ['PENDING', 'RUNNING'] }
      },
      data: {
        status: 'FAILED'
      }
    });
    console.log(`Updated ${result.count} stuck scans to FAILED.`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}
fixStuckScans();

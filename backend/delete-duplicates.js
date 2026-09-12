const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteDuplicates() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const seenDomains = new Set();
    const toDelete = [];

    for (const project of projects) {
      if (seenDomains.has(project.domain)) {
        toDelete.push(project.id);
      } else {
        seenDomains.add(project.domain);
      }
    }

    if (toDelete.length > 0) {
      await prisma.project.deleteMany({
        where: { id: { in: toDelete } }
      });
      console.log(`Deleted ${toDelete.length} duplicate projects.`);
    } else {
      console.log('No duplicate projects found.');
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}
deleteDuplicates();

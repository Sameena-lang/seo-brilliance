const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const org = await prisma.organization.findFirst();
    console.log("Org:", org.id);
    const pages = await prisma.page.findMany({
      where: { scan: { project: { organizationId: org.id } } },
      take: 5,
      include: {
        _count: { select: { issues: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log("Pages:", pages.length);
  } catch (error) {
    console.error("Prisma Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}
test();

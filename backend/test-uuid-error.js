const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const pages = await prisma.page.findMany({
      where: { scanId: "undefined" }
    });
    console.log("Pages:", pages.length);
  } catch (error) {
    console.error("Prisma Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();

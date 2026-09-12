const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const crawlQueue = new Queue('crawlQueue', { connection });

async function run() {
  const project = await prisma.project.findFirst({ where: { domain: 'www.mmahal.com' }});
  if (!project) return console.log("Project not found");

  const scan = await prisma.scan.create({
    data: {
      projectId: project.id,
      status: 'PENDING',
      pagesDiscovered: 1,
    }
  });
  console.log("Created scan:", scan.id);
  
  await crawlQueue.add('startCrawl', { scanId: scan.id, projectId: project.id, url: project.rootUrl, settings: project.crawlSettings });

  // Poll for completion
  let attempts = 0;
  while(attempts < 20) {
    await new Promise(r => setTimeout(r, 2000));
    const s = await prisma.scan.findUnique({ where: {id: scan.id}, include: { pages: { include: { issues: true }}, siteScore: true }});
    console.log(`Status: ${s.status}, Crawled: ${s.pagesCrawled}, Issues: ${s.issuesFound}`);
    if (s.status === 'COMPLETED' || s.status === 'FAILED' || s.status === 'CANCELLED') {
      console.log(`Overall Score: ${s.siteScore?.overallScore}`);
      console.log(`Total Pages: ${s.pages.length}`);
      s.pages.forEach(p => console.log(` - Page ${p.url}: ${p.issues.length} issues`));
      break;
    }
    attempts++;
  }
  process.exit(0);
}
run();

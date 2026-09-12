const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const crawlQueue = new Queue('crawlQueue', { connection });

async function test() {
  console.log("Adding job...");
  const job = await crawlQueue.add('startCrawl', { 
    scanId: "c03aeb62-bee0-419b-bb8c-90160faa10c3", 
    projectId: "something", 
    url: "https://www.mmahal.com" 
  });
  console.log("Job added:", job.id);
  process.exit(0);
}
test();

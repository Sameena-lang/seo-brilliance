const { Queue } = require('bullmq');
const IORedis = require('ioredis');

async function trigger() {
  const connection = new IORedis('redis://localhost:6379');
  const seoQueue = new Queue('seoQueue', { connection });
  await seoQueue.add('analyzeSeo', { scanId: 'a03b49d2-b8a5-45c9-b910-a7b4a48c01d0' });
  console.log('Triggered completion check');
  process.exit(0);
}
trigger();

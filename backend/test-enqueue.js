const { Queue } = require('bullmq');
const IORedis = require('ioredis');

async function test() {
  const connection = new IORedis('redis://localhost:6379');
  const queue = new Queue('reportQueue', { connection });
  await queue.add('generateReport', { scanId: '36c7ab5f-2339-48c1-850f-31b45a95bd95' });
  console.log('Job enqueued');
  process.exit(0);
}
test();

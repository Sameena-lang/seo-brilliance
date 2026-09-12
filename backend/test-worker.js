const { Worker } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis('redis://localhost:6379', { maxRetriesPerRequest: null });

console.log("Starting test worker...");
const worker = new Worker('crawlQueue', async (job) => {
  console.log("Job picked up:", job.id, job.name, job.data);
  return { success: true };
}, { connection });

worker.on('completed', (job) => console.log('Completed:', job.id));
worker.on('failed', (job, err) => console.error('Failed:', job.id, err));
worker.on('error', err => console.error('Worker error:', err));

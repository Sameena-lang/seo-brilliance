const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const crawlQueue = new Queue('crawlQueue', { connection });

async function check() {
  try {
    const waiting = await crawlQueue.getWaitingCount();
    const active = await crawlQueue.getActiveCount();
    const completed = await crawlQueue.getCompletedCount();
    const failed = await crawlQueue.getFailedCount();
    const delayed = await crawlQueue.getDelayedCount();
    console.log(`Queue Status - Waiting: ${waiting}, Active: ${active}, Completed: ${completed}, Failed: ${failed}, Delayed: ${delayed}`);

    if (failed > 0) {
      const failedJobs = await crawlQueue.getFailed(0, 5);
      failedJobs.forEach(job => {
        console.log(`Job ${job.id} failed:`, job.failedReason);
      });
    }
  } catch(e) {
    console.error(e);
  } finally {
    connection.quit();
  }
}
check();

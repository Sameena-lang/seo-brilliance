import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const crawlQueue = new Queue('crawlQueue', { connection: redisConnection });
export const seoQueue = new Queue('seoQueue', { connection: redisConnection });
export const aiQueue = new Queue('aiQueue', { connection: redisConnection });
export const reportQueue = new Queue('reportQueue', { connection: redisConnection });

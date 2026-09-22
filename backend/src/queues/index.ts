export interface Job<T = Record<string, unknown>> {
  id: string;
  data: T & Record<string, any>;
}

type JobHandler = (job: Job) => Promise<unknown>;

const handlers = new Map<string, JobHandler>();
let nextJobId = 0;

export class Worker {
  constructor(
    private readonly name: string,
    private readonly handler: JobHandler,
  ) {
    handlers.set(name, handler);
  }

  on(event: 'failed' | 'completed', listener: (job: Job, error?: unknown) => void) {
    return this;
  }

  async close() {
    if (handlers.get(this.name) === this.handler) {
      handlers.delete(this.name);
    }
  }
}

class Queue {
  private activeCount = 0;
  private pending: Job[] = [];

  constructor(private readonly name: string, private concurrency: number = 50) {}

  async add(_jobName: string, data: Record<string, unknown>) {
    const handler = handlers.get(this.name);
    if (!handler) {
      throw new Error(`No handler registered for queue "${this.name}"`);
    }

    const job = { id: String(++nextJobId), data };
    this.pending.push(job);
    this.processNext();
    return job;
  }

  private processNext() {
    if (this.activeCount >= this.concurrency || this.pending.length === 0) {
      return;
    }

    const handler = handlers.get(this.name);
    if (!handler) return;

    const job = this.pending.shift()!;
    this.activeCount++;

    setImmediate(() => {
      handler(job)
        .catch((error) => {
          console.error(`Job ${job.id} on ${this.name} failed:`, error);
        })
        .finally(() => {
          this.activeCount--;
          this.processNext();
        });
    });
  }
}

export const crawlQueue = new Queue('crawlQueue', 50);
export const seoQueue = new Queue('seoQueue', 50);
export const aiQueue = new Queue('aiQueue', 10);
export const reportQueue = new Queue('reportQueue', 10);

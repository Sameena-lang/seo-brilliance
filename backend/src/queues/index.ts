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
  constructor(private readonly name: string) {}

  async add(_jobName: string, data: Record<string, unknown>) {
    const handler = handlers.get(this.name);
    if (!handler) {
      throw new Error(`No handler registered for queue "${this.name}"`);
    }

    const job = { id: String(++nextJobId), data };
    setImmediate(() => {
      handler(job).catch((error) => {
        console.error(`Job ${job.id} on ${this.name} failed:`, error);
      });
    });
    return job;
  }
}

export const crawlQueue = new Queue('crawlQueue');
export const seoQueue = new Queue('seoQueue');
export const aiQueue = new Queue('aiQueue');
export const reportQueue = new Queue('reportQueue');

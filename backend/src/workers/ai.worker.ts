import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import OpenAI from 'openai';
import prisma from '../config/db';
import { reportQueue } from '../queues';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY || 'fake-key', // Will fail if not set in prod, but safe for startup
});

export const aiWorker = new Worker('aiQueue', async (job: Job) => {
  const { scanId } = job.data;

  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: { project: true }
  });

  if (!scan) return;

  // Gather stats to send to AI
  const issues = await prisma.issue.groupBy({
    by: ['ruleCode', 'severity'],
    where: { page: { scanId }, status: 'OPEN' },
    _count: true
  });

  const prompt = `
    Analyze the following SEO scan results for ${scan.project.domain} and provide an executive summary.
    Total pages crawled: ${scan.pagesCrawled}
    Issues found: ${JSON.stringify(issues)}
    
    CRITICAL RULE: Base your entire summary, why it matters, and recommendations strictly and ONLY on the provided Issues data above. Do not hallucinate pages, issues, measurements, or scores that are not explicitly present in the data. If the Issues list is empty, state that the site is fully healthy and no issues were detected.
    
    Return a JSON object with this exact structure:
    {
      "summary": "2-3 sentences summarizing the overall site health based on the exact data provided.",
      "whyItMatters": "1-2 sentences on why these specific issues impact SEO.",
      "recommendation": "The top 1-2 actions to take immediately.",
      "priority": "HIGH or MEDIUM or LOW"
    }
  `;

  try {
    // If we have a real key, call OpenAI
    if (process.env.AI_API_KEY) {
      const response = await openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (content) {
        const parsed = JSON.parse(content);
        
        await prisma.aiSummary.upsert({
          where: { scanId },
          update: parsed,
          create: { scanId, ...parsed }
        });
      }
    } else {
      // Stub for local dev without key
      await prisma.aiSummary.upsert({
        where: { scanId },
        update: {
          summary: "This is a placeholder summary. Please configure AI_API_KEY.",
          whyItMatters: "SEO issues affect ranking.",
          recommendation: "Fix critical issues.",
          priority: "HIGH"
        },
        create: {
          scanId,
          summary: "This is a placeholder summary. Please configure AI_API_KEY.",
          whyItMatters: "SEO issues affect ranking.",
          recommendation: "Fix critical issues.",
          priority: "HIGH"
        }
      });
    }

    // Queue Report Generation
    await reportQueue.add('generateReport', { scanId });

  } catch (error) {
    console.error('AI Summary generation failed:', error);
  }
}, { connection, concurrency: 2 });

aiWorker.on('failed', (job, err) => {
  console.error(`AI job ${job?.id} failed:`, err);
});

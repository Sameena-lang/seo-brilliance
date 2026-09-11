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

  const scanData = await prisma.scan.findUnique({
    where: { id: scanId },
    include: { project: true, siteScore: true }
  });

  const prompt = `
    Analyze the following SEO audit results for ${scan.project.domain}.
    Total pages crawled: ${scan.pagesCrawled}
    Overall SEO Score: ${scanData?.siteScore?.overallScore || 'N/A'}
    Issues Summary: ${JSON.stringify(issues)}
    
    CRITICAL RULE: Base your entire summary strictly and ONLY on the provided Issues data above. Do not hallucinate URLs, issues, measurements, or scores that are not explicitly present in the data. Do NOT use the word "prediction" or "predicted". This is an actual audit result.
    
    Return a JSON object with this exact structure:
    {
      "summary": "2-3 sentences providing an executive summary of the site's technical SEO health based on the exact score.",
      "whyItMatters": "A bulleted list of the top 3 most critical problem areas found in the data.",
      "recommendation": "A bulleted list of the top 3 immediate actions the development team should take.",
      "priority": "HIGH or MEDIUM or LOW depending on the severity of the issues"
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
      throw new Error('No AI_API_KEY provided');
    }
  } catch (error: any) {
    console.error('AI Summary generation failed:', error.message || error);
    // Stub for local dev without key or if OpenAI fails (e.g., 429 out of credits)
    await prisma.aiSummary.upsert({
      where: { scanId },
      update: {
        summary: "This is a placeholder summary. AI generation failed or was not configured.",
        whyItMatters: "SEO issues affect ranking and user experience.",
        recommendation: "Fix critical issues identified in the audit.",
        priority: "HIGH"
      },
      create: {
        scanId,
        summary: "This is a placeholder summary. AI generation failed or was not configured.",
        whyItMatters: "SEO issues affect ranking and user experience.",
        recommendation: "Fix critical issues identified in the audit.",
        priority: "HIGH"
      }
    });
  } finally {
    // Queue Report Generation
    await reportQueue.add('generateReport', { scanId });
  }
}, { connection, concurrency: 2 });

aiWorker.on('failed', (job, err) => {
  console.error(`AI job ${job?.id} failed:`, err);
});

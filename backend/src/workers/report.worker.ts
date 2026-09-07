import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import prisma from '../config/db';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const STORAGE_PATH = process.env.STORAGE_PATH || './storage';

export const reportWorker = new Worker('reportQueue', async (job: Job) => {
  const { scanId } = job.data;

  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: { project: true, siteScore: true, aiSummary: true }
  });

  if (!scan) return;

  const issues = await prisma.issue.findMany({
    where: { page: { scanId } },
    include: { page: { select: { url: true } } }
  });

  if (!fs.existsSync(STORAGE_PATH)) {
    fs.mkdirSync(STORAGE_PATH, { recursive: true });
  }

  // Generate CSV
  const csvFields = ['ruleCode', 'severity', 'title', 'url', 'status'];
  const csvData = issues.map(i => ({
    ruleCode: i.ruleCode,
    severity: i.severity,
    title: i.title,
    url: i.page.url,
    status: i.status
  }));
  const json2csvParser = new Parser({ fields: csvFields });
  const csv = json2csvParser.parse(csvData);
  const csvFileName = `report-${scanId}.csv`;
  const csvPath = path.join(STORAGE_PATH, csvFileName);
  fs.writeFileSync(csvPath, csv);

  // Generate PDF
  const pdfFileName = `report-${scanId}.pdf`;
  const pdfPath = path.join(STORAGE_PATH, pdfFileName);
  
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(pdfPath));

  doc.fontSize(25).text('SEO Audit Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text(`Project: ${scan.project.name} (${scan.project.domain})`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown();

  if (scan.siteScore) {
    doc.fontSize(20).text('Score Overview');
    doc.fontSize(12).text(`Overall Score: ${scan.siteScore.overallScore}/100`);
    doc.text(`Technical: ${scan.siteScore.technicalScore}`);
    doc.text(`Content: ${scan.siteScore.contentScore}`);
    doc.moveDown();
  }

  if (scan.aiSummary) {
    doc.fontSize(20).text('Executive Summary (AI)');
    doc.fontSize(12).text(scan.aiSummary.summary);
    doc.moveDown();
    doc.text(`Priority: ${scan.aiSummary.priority}`);
    doc.text(`Recommendation: ${scan.aiSummary.recommendation}`);
    doc.moveDown();
  }

  doc.fontSize(20).text('Top Issues');
  issues.slice(0, 50).forEach(issue => {
    doc.fontSize(12).text(`[${issue.severity}] ${issue.title} - ${issue.page.url}`);
  });

  doc.end();

  // Save Report paths to DB
  await prisma.report.upsert({
    where: { scanId },
    update: {
      pdfUrl: `/storage/${pdfFileName}`,
      csvUrl: `/storage/${csvFileName}`
    },
    create: {
      scanId,
      pdfUrl: `/storage/${pdfFileName}`,
      csvUrl: `/storage/${csvFileName}`
    }
  });

}, { connection, concurrency: 2 });

reportWorker.on('failed', (job, err) => {
  console.error(`Report job ${job?.id} failed:`, err);
});

import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import prisma from '../config/db';
import { getScan } from '../services/scan.service';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const STORAGE_PATH = process.env.STORAGE_PATH || './storage';

export const reportWorker = new Worker('reportQueue', async (job: Job) => {
  const { scanId } = job.data;

  const basicScan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: { project: true }
  });

  if (!basicScan) return;

  // Use the exact same single source of truth as the API
  const scanData = await getScan(scanId, basicScan.project.organizationId);

  const issues = await prisma.issue.findMany({
    where: { page: { scanId } },
    include: { page: { select: { url: true } } }
  });

  if (!fs.existsSync(STORAGE_PATH)) {
    fs.mkdirSync(STORAGE_PATH, { recursive: true });
  }

  // Generate CSV
  const csvFields = ['ruleCode', 'severity', 'title', 'url', 'status'];
  let csvData = [];
  if (issues.length > 0) {
    csvData = issues.map(i => ({
      ruleCode: i.ruleCode,
      severity: i.severity,
      title: i.title,
      url: i.page.url,
      status: i.status
    }));
  } else {
    csvData = [{
      ruleCode: 'N/A',
      severity: 'N/A',
      title: 'No issues found for this scan. The site is healthy or no pages were crawled.',
      url: 'N/A',
      status: 'N/A'
    }];
  }
  const json2csvParser = new Parser({ fields: csvFields });
  const csv = json2csvParser.parse(csvData);
  const csvFileName = `report-${scanId}.csv`;
  const csvPath = path.join(STORAGE_PATH, csvFileName);
  fs.writeFileSync(csvPath, csv);

  // Generate PDF
  const pdfFileName = `report-${scanId}.pdf`;
  const pdfPath = path.join(STORAGE_PATH, pdfFileName);
  
  const doc = new PDFDocument({ margin: 0, size: 'A4' });
  doc.pipe(fs.createWriteStream(pdfPath));

  // Colors
  const colors = {
    bg: '#f8fafc',
    primary: '#f97316',
    primaryLight: '#fdba74',
    success: '#10b981',
    warning: '#f59e0b',
    destructive: '#ef4444',
    text: '#0f172a',
    muted: '#64748b',
    border: '#e2e8f0',
    white: '#ffffff',
    boxBg: '#f1f5f9'
  };

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;

  function roundedRect(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.fill();
  }

  // Background
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(colors.bg);

  // Main Card
  const margin = 40;
  const cardWidth = PAGE_WIDTH - margin * 2;

  // Draw Card Background
  doc.fillColor(colors.white);
  roundedRect(doc, margin, margin, cardWidth, 220, 10);
  doc.lineWidth(1).strokeColor(colors.border).roundedRect(margin, margin, cardWidth, 220, 10).stroke();

  // Header inside Card
  doc.fillColor(colors.boxBg);
  roundedRect(doc, margin, margin, cardWidth, 50, 10);
  doc.rect(margin, margin + 40, cardWidth, 10).fill(colors.boxBg);
  doc.moveTo(margin, margin + 50).lineTo(margin + cardWidth, margin + 50).lineWidth(1).strokeColor(colors.border).stroke();

  // URL Text
  const protocol = scanData.project.domain.startsWith('http') ? '' : 'https://';
  doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.text).text(`${protocol}${scanData.project.domain}`, margin + 20, margin + 18);

  // Score Section
  doc.font('Helvetica-Bold').fontSize(20).fillColor(colors.text).text('Overall Site Score', margin + 20, margin + 80);
  doc.font('Helvetica').fontSize(12).fillColor(colors.muted).text('A very good score is between 60 and 80. For best\nresults, you should strive for 70 and above.', margin + 20, margin + 110, { width: 250, lineGap: 4 });

  // Donut Chart
  const cx = margin + cardWidth - 100;
  const cy = margin + 130;
  const r = 55;
  const score = scanData.overallScore || 0;

  doc.lineWidth(12).strokeColor(colors.border).circle(cx, cy, r).stroke();
  
  if (score > 0) {
    const angle = (score / 100) * 2 * Math.PI;
    const scoreColor = score >= 90 ? colors.success : score >= 70 ? colors.warning : colors.destructive;
    doc.lineWidth(12).strokeColor(scoreColor)
      .path(`M ${cx} ${cy-r} A ${r} ${r} 0 ${score > 50 ? 1 : 0} 1 ${cx + r*Math.sin(angle)} ${cy - r*Math.cos(angle)}`)
      .stroke();
  }

  const textScoreColor = score >= 90 ? colors.success : score >= 70 ? colors.warning : colors.destructive;
  const scoreLabel = score >= 90 ? 'Excellent!' : score >= 70 ? 'Very Good!' : 'Needs Work';

  doc.font('Helvetica-Bold').fontSize(36).fillColor(textScoreColor).text(score.toString(), cx - 35, cy - 15, { width: 70, align: 'center' });
  doc.font('Helvetica').fontSize(14).fillColor(colors.muted).text('/ 100', cx + 15, cy + 2);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(textScoreColor).text(scoreLabel, cx - 40, cy + 25, { width: 80, align: 'center' });

  // Metric Boxes below
  const boxY = margin + 240;
  const boxWidth = (cardWidth - 20) / 3;

  function drawMetricBox(x: number, y: number, w: number, h: number, number: number, label: string, color: string) {
    doc.fillColor(colors.white);
    roundedRect(doc, x, y, w, h, 8);
    doc.lineWidth(1).strokeColor(colors.border).roundedRect(x, y, w, h, 8).stroke();
    
    doc.fillColor(color);
    doc.rect(x, y + 8, 4, h - 16).fill();
    
    doc.font('Helvetica-Bold').fontSize(24).fillColor(color).text(number.toString(), x + 15, y + 15);
    doc.font('Helvetica').fontSize(12).fillColor(colors.muted).text('of', x + 15 + doc.widthOfString(number.toString()) + 5, y + 25);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.text).text(label, x + 15, y + 45);
  }

  const critCount = scanData.siteScore?.criticalCount || 0;
  const warnCount = scanData.siteScore?.warningCount || 0;
  const infoCount = scanData.siteScore?.infoCount || 0;

  drawMetricBox(margin, boxY, boxWidth, 70, critCount, 'Critical Issues', colors.destructive);
  drawMetricBox(margin + boxWidth + 10, boxY, boxWidth, 70, warnCount, 'Recommended', colors.warning);
  drawMetricBox(margin + boxWidth*2 + 20, boxY, boxWidth, 70, infoCount, 'Good Results', colors.success);

  // Issues List (Priority Fix Recommendations)
  let contentY = boxY + 110;
  doc.font('Helvetica-Bold').fontSize(18).fillColor(colors.text).text('Search Preview', margin, contentY);
  contentY += 30;
  
  if (scanData.topIssues && scanData.topIssues.length > 0) {
    doc.font('Helvetica').fontSize(12).fillColor(colors.muted).text('Here are the top priority issues found on the site:', margin, contentY);
    contentY += 30;
    
    scanData.topIssues.forEach((issue: any) => {
      if (contentY > 700) {
        doc.addPage();
        doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(colors.bg);
        contentY = margin;
      }
      
      const pColor = issue.priority === 'CRITICAL' ? colors.destructive : issue.priority === 'HIGH' ? colors.warning : colors.success;
      
      doc.fillColor(colors.white);
      roundedRect(doc, margin, contentY, cardWidth, 80, 8);
      doc.lineWidth(1).strokeColor(colors.border).roundedRect(margin, contentY, cardWidth, 80, 8).stroke();
      
      doc.fillColor(pColor);
      doc.rect(margin, contentY + 10, 4, 60).fill();

      doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.text).text(issue.title, margin + 20, contentY + 15);
      doc.font('Helvetica').fontSize(10).fillColor(colors.muted).text(`Rule Code: ${issue.ruleCode} | Affected Pages: ${issue.affectedPages}`, margin + 20, contentY + 35);
      
      if (issue.howToFix) {
        doc.font('Helvetica').fontSize(10).fillColor(colors.text).text(issue.howToFix, margin + 20, contentY + 55, { width: cardWidth - 40, height: 12, lineBreak: false });
      }
      
      contentY += 100;
    });
  } else {
    doc.font('Helvetica').fontSize(12).fillColor(colors.muted).text('No issues found. Your site is healthy!', margin, contentY);
  }

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

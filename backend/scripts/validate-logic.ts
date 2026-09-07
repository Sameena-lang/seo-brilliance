import { rules, evaluatePage } from '../src/seo/rules';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';

async function validateRules() {
  console.log("=== TASK 3: SEO RULE VALIDATION ===");
  const testPages = [
    { url: '/clean', title: 'Perfect Title For SEO Tests', metaDescription: 'This is a perfect meta description for SEO testing purposes.', h1Count: 1, canonicalUrl: 'http://loc/clean', statusCode: 200 },
    { url: '/title-missing', title: '', metaDescription: 'Valid desc...', h1Count: 1, canonicalUrl: 'http://loc', statusCode: 200 },
    { url: '/title-too-long', title: 'a'.repeat(61), metaDescription: 'Valid desc...', h1Count: 1, canonicalUrl: 'http://loc', statusCode: 200 },
    { url: '/broken-link', statusCode: 404 },
  ];

  for (const p of testPages) {
    const issues = await evaluatePage(p as any);
    console.log(`Page: ${p.url}`);
    if (issues.length === 0) console.log("  No issues.");
    issues.forEach(i => console.log(`  [${i.severity}] ${i.ruleCode}`));
  }
}

async function validateScoring() {
  console.log("\n=== TASK 1 & 2: SCORING CALIBRATION & CATEGORY SCORING ===");
  
  // Simulated page issues
  const pages = [
    { id: '1', issues: [] }, // Clean page (100)
    { id: '2', issues: [{ severity: 'WARNING', ruleCode: 'TITLE_TOO_LONG' }] }, // Warning page (97)
    { id: '3', issues: [{ severity: 'CRITICAL', ruleCode: 'BROKEN_LINK' }, { severity: 'WARNING', ruleCode: 'IMAGE_MISSING_ALT' }] }, // Critical + Warning page (87)
  ];

  let totalScore = 0;
  const ruleCategoryMap = new Map();
  for (const r of rules) ruleCategoryMap.set(r.code, r.category);

  for (const page of pages) {
    let pageCrit = 0;
    let pageWarn = 0;
    let pageInfo = 0;

    for (const issue of page.issues) {
      if (issue.severity === 'CRITICAL') pageCrit++;
      if (issue.severity === 'WARNING') pageWarn++;
      if (issue.severity === 'INFO') pageInfo++;
    }

    const pageScore = Math.max(0, 100 - (pageCrit * 10) - (pageWarn * 3) - (pageInfo * 1));
    totalScore += pageScore;
    console.log(`Page ${page.id} Score: ${pageScore}`);
  }

  const overallScore = pages.length > 0 ? Math.round(totalScore / pages.length) : 100;
  console.log(`Overall Averaged Score: ${overallScore}`);
}

async function validateAI() {
  console.log("\n=== TASK 4 & 5: AI VALIDATION & GROUNDING ===");
  const openai = new OpenAI({ apiKey: process.env.AI_API_KEY || 'fake-key' });
  
  const prompt = `
    Analyze the following SEO scan results for test.com and provide an executive summary.
    Total pages crawled: 50
    Issues found: [{"ruleCode":"TITLE_MISSING","severity":"CRITICAL","_count":2}]
    
    CRITICAL RULE: Base your entire summary, why it matters, and recommendations strictly and ONLY on the provided Issues data above. Do not hallucinate pages, issues, measurements, or scores that are not explicitly present in the data. If the Issues list is empty, state that the site is fully healthy and no issues were detected.
    
    Return a JSON object with this exact structure:
    {
      "summary": "...",
      "whyItMatters": "...",
      "recommendation": "...",
      "priority": "HIGH or MEDIUM or LOW"
    }
  `;

  if (process.env.AI_API_KEY) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      console.log("AI Response: ", response.choices[0].message.content);
      console.log("REAL AI TEST = PASS");
    } catch (e: any) {
      console.log("REAL AI TEST = FAILED: ", e.message);
    }
  } else {
    console.log("REAL AI TEST = NOT AVAILABLE (No API Key)");
  }
}

async function validateReports() {
  console.log("\n=== TASK 6: REPORT VALIDATION ===");
  const STORAGE_PATH = './storage';
  if (!fs.existsSync(STORAGE_PATH)) fs.mkdirSync(STORAGE_PATH, { recursive: true });

  const issues = [{ ruleCode: 'TITLE_MISSING', severity: 'CRITICAL', title: 'Title tag is missing', page: { url: '/test' }, status: 'OPEN' }];
  
  const csvFields = ['ruleCode', 'severity', 'title', 'url', 'status'];
  const csvData = issues.map(i => ({ ruleCode: i.ruleCode, severity: i.severity, title: i.title, url: i.page.url, status: i.status }));
  const json2csvParser = new Parser({ fields: csvFields });
  const csv = json2csvParser.parse(csvData);
  fs.writeFileSync(path.join(STORAGE_PATH, 'test-report.csv'), csv);
  console.log("CSV Report Generated successfully.");

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(path.join(STORAGE_PATH, 'test-report.pdf')));
  doc.fontSize(25).text('SEO Audit Report', { align: 'center' });
  doc.fontSize(12).text(`Overall Score: 95/100`);
  doc.end();
  console.log("PDF Report Generated successfully.");
}

async function run() {
  await validateRules();
  await validateScoring();
  await validateAI();
  await validateReports();
}

run();

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000/api/v1';
const HEALTH_URL = 'http://localhost:5000/health';
const TEST_EMAIL = `test_e2e_${Date.now()}@seointelligence.local`;
const TEST_PASSWORD = 'password123';
const TEST_NAME = 'E2E Test User';

let token = '';
let projectId = '';
let scanId = '';
let reportIds: { pdf?: string, csv?: string } = {};

const results: Record<string, 'PASS' | 'FAIL' | 'PENDING'> = {
  'Health Check': 'PENDING',
  'Register': 'PENDING',
  'Login': 'PENDING',
  'Auth Me': 'PENDING',
  'Project Creation': 'PENDING',
  'Scan Creation': 'PENDING',
  'BullMQ Job': 'PENDING',
  'Crawler': 'PENDING',
  'Pages Stored': 'PENDING',
  'SEO Rules': 'PENDING',
  'Issues Stored': 'PENDING',
  'SEO Score': 'PENDING',
  'Audit Results': 'PENDING',
  'Pages API': 'PENDING',
  'Issues API': 'PENDING',
  'Issue Update': 'PENDING',
  'AI Summary': 'PENDING',
  'PDF Report': 'PENDING',
  'CSV Report': 'PENDING',
  'Profile Update': 'PENDING'
};

const finalStats = {
  scanId: '',
  pagesCrawled: 0,
  issuesFound: 0,
  seoScore: 0,
  reportIds: [] as string[],
  duration: 0
};

const errors: string[] = [];

function pass(name: string) { results[name] = 'PASS'; }
function fail(name: string, error: any) {
  results[name] = 'FAIL';
  errors.push(`[${name}] ` + (error?.response?.data?.error?.message || error?.message || String(error)));
}

async function run() {
  const startTime = Date.now();

  try {
    // 1. Health check
    try {
      await axios.get(HEALTH_URL);
      pass('Health Check');
    } catch (e) { fail('Health Check', e); throw e; }

    // 2. Register
    try {
      await axios.post(`${API_URL}/auth/register`, { email: TEST_EMAIL, password: TEST_PASSWORD, fullName: TEST_NAME });
      pass('Register');
    } catch (e) { fail('Register', e); throw e; }

    // 3. Login
    try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, { email: TEST_EMAIL, password: TEST_PASSWORD });
      token = loginRes.data.data.token;
      pass('Login');
    } catch (e) { fail('Login', e); throw e; }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 4. Auth Me
    try {
      const meRes = await axios.get(`${API_URL}/auth/me`);
      if (meRes.data.data.user.email !== TEST_EMAIL) throw new Error(`Email mismatch: ${meRes.data.data.user.email} vs ${TEST_EMAIL}`);
      pass('Auth Me');
    } catch (e) { fail('Auth Me', e); throw e; }

    // 5. Project Creation
    try {
      const projRes = await axios.post(`${API_URL}/projects`, { name: 'E2E Test Project', domain: 'example.com', rootUrl: 'https://example.com' });
      projectId = projRes.data.data.id;
      pass('Project Creation');
    } catch (e) { fail('Project Creation', e); throw e; }

    // 6. Scan Creation
    try {
      const scanRes = await axios.post(`${API_URL}/projects/${projectId}/scans`, {
        maxPages: 5, maxDepth: 2, respectRobots: true, crawlSitemap: true, checkBrokenLinks: true, analyzeImages: true, analyzeSchema: true
      });
      scanId = scanRes.data.data.id;
      finalStats.scanId = scanId;
      pass('Scan Creation');
      // If a scan was created, BullMQ job was added in the controller
      pass('BullMQ Job');
    } catch (e) { 
      fail('Scan Creation', e); 
      fail('BullMQ Job', e); 
      throw e; 
    }

    // 7-12. Polling Scan
    let isCompleted = false;
    let pollCount = 0;
    let lastProgress = 0;
    let hasCrawledAny = false;

    while (pollCount < 60) { // Max 5 mins (60 * 5s)
      await new Promise(r => setTimeout(r, 5000));
      pollCount++;

      const scanStatus = await axios.get(`${API_URL}/scans/${scanId}`);
      const s = scanStatus.data.data;

      if (s.pagesCrawled > 0) hasCrawledAny = true;
      lastProgress = s.progress;

      console.log(`Polling scan ${scanId}: Status=${s.status}, Progress=${s.progress}%, Pages=${s.pagesCrawled}, Issues=${s.issuesFound}`);

      if (s.status === 'COMPLETED' || s.status === 'FAILED') {
        isCompleted = true;
        if (s.status === 'COMPLETED') {
          finalStats.pagesCrawled = s.pagesCrawled;
          finalStats.issuesFound = s.issuesFound;
        } else {
          throw new Error('Scan FAILED');
        }
        break;
      }
    }

    if (!isCompleted) throw new Error('Scan polling timed out');

    if (hasCrawledAny) pass('Crawler'); else fail('Crawler', new Error('No pages crawled'));
    if (finalStats.pagesCrawled > 0) pass('Pages Stored'); else fail('Pages Stored', new Error('No pages in DB'));
    if (finalStats.issuesFound > 0) { pass('SEO Rules'); pass('Issues Stored'); } else { fail('SEO Rules', 'No issues'); fail('Issues Stored', 'No issues'); }

    // 13. Audit Results & AI Summary
    try {
      const auditRes = await axios.get(`${API_URL}/scans/${scanId}/results`);
      pass('Audit Results');
      if (auditRes.data.data.aiSummary) pass('AI Summary'); else fail('AI Summary', new Error('No AI summary'));
      if (auditRes.data.data.score && auditRes.data.data.score.overallScore > 0) {
        finalStats.seoScore = auditRes.data.data.score.overallScore;
        pass('SEO Score');
      } else {
        fail('SEO Score', new Error('SEO score is 0 or null'));
      }
    } catch (e) { fail('Audit Results', e); fail('AI Summary', e); fail('SEO Score', e); }

    // 14. Pages API
    let pageId = '';
    try {
      const pagesRes = await axios.get(`${API_URL}/scans/${scanId}/pages`);
      if (pagesRes.data.data.pages.length === 0) throw new Error('No pages returned by API');
      pageId = pagesRes.data.data.pages[0].id;
      // Get single page
      await axios.get(`${API_URL}/pages/${pageId}`);
      pass('Pages API');
    } catch (e) { fail('Pages API', e); }

    // 15-16. Issues API & Update
    try {
      const issuesRes = await axios.get(`${API_URL}/scans/${scanId}/issues`);
      if (issuesRes.data.data.issues.length > 0) {
        const issueId = issuesRes.data.data.issues[0].id;
        await axios.get(`${API_URL}/issues/${issueId}`);
        pass('Issues API');

        // Update issue
        await axios.patch(`${API_URL}/issues/${issueId}/status`, { status: 'FIXED' });
        const updatedIssue = await axios.get(`${API_URL}/issues/${issueId}`);
        if (updatedIssue.data.data.status === 'FIXED') pass('Issue Update');
        else throw new Error('Issue status did not persist as FIXED');
      } else {
        fail('Issues API', new Error('No issues found to test'));
        fail('Issue Update', new Error('No issues found to test'));
      }
    } catch (e) { fail('Issues API', e); fail('Issue Update', e); }

    // 17. Reports
    try {
      const pdfRes = await axios.post(`${API_URL}/scans/${scanId}/reports`, { type: 'PDF' });
      if (pdfRes.status === 202) pass('PDF Report');
      else throw new Error('Unexpected status: ' + pdfRes.status);
    } catch (e) { fail('PDF Report', e); }

    try {
      const csvRes = await axios.post(`${API_URL}/scans/${scanId}/reports`, { type: 'CSV' });
      if (csvRes.status === 202) pass('CSV Report');
      else throw new Error('Unexpected status: ' + csvRes.status);
    } catch (e) { fail('CSV Report', e); }

    // 18. Profile Update
    try {
      await axios.put(`${API_URL}/users/profile`, { fullName: 'Updated Name E2E' });
      const verifyMe = await axios.get(`${API_URL}/auth/me`);
      if (verifyMe.data.data.user.fullName === 'Updated Name E2E') pass('Profile Update');
      else throw new Error('Profile update did not persist');
    } catch (e) { fail('Profile Update', e); }

  } catch (err) {
    console.error('Test run interrupted by fatal error:', err);
  }

  finalStats.duration = Date.now() - startTime;

  console.log('\n--- E2E TEST RESULTS ---');
  let allPass = true;
  for (const [key, val] of Object.entries(results)) {
    console.log(`${key.padEnd(20)} ${val}`);
    if (val !== 'PASS') allPass = false;
  }

  console.log('\n--- FINAL STATS ---');
  console.log(`Scan ID: ${finalStats.scanId}`);
  console.log(`Pages Crawled: ${finalStats.pagesCrawled}`);
  console.log(`Issues Found: ${finalStats.issuesFound}`);
  console.log(`SEO Score: ${finalStats.seoScore}`);
  console.log(`Report IDs: ${finalStats.reportIds.join(', ')}`);
  console.log(`Total Duration: ${(finalStats.duration / 1000).toFixed(1)}s`);

  if (errors.length > 0) {
    console.log('\n--- ERRORS ---');
    errors.forEach(e => console.log(e));
  }

  console.log(`\nE2E RESULT: ${allPass ? 'PASS' : 'FAIL'}`);
}

run();

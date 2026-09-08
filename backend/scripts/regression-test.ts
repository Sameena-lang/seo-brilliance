import axios from 'axios';
import fs from 'fs';

const API_URL = 'http://localhost:5000/api/v1';
let token = '';
let organizationId = '';
let projectId = '';
let scanId = '';

const metrics = {
  scanId: '',
  pagesCrawled: 0,
  issuesFound: 0,
  seoScore: 0,
  csvRowCount: 0,
  errors: [] as string[],
};

const client = axios.create({ baseURL: API_URL });
client.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function runTests() {
  try {
    console.log('--- STARTING REGRESSION TEST ---');

    // 1. Setup User
    const email = `test-${Date.now()}@example.com`;
    console.log(`Registering user: ${email}`);
    const regRes = await client.post('/auth/register', {
      email,
      password: 'password123',
      fullName: 'Test User',
      organizationName: 'Test Org',
    });
    token = regRes.data.token || regRes.data.data.token;
    // organizationId = regRes.data.user.organizationId;
    console.log('✅ Registered successfully');

    // 2. Create Project
    console.log('Creating project...');
    const projRes = await client.post('/projects', {
      name: 'books.toscrape.com',
      domain: 'books.toscrape.com',
      rootUrl: 'https://books.toscrape.com',
      includeSubdomains: false,
    });
    projectId = projRes.data.data.id;
    console.log(`✅ Project created: ${projectId}`);

    // 3. Start Scan
    console.log('Starting scan...');
    const scanRes = await client.post(`/projects/${projectId}/scans`);
    scanId = scanRes.data.id;
    metrics.scanId = scanId;
    console.log(`✅ Scan started: ${scanId}`);

    // 4. Wait for Scan to Complete
    console.log('Polling for scan completion (max 3 minutes)...');
    let isCompleted = false;
    for (let i = 0; i < 36; i++) { // 36 * 5 = 180 seconds
      const statusRes = await client.get(`/scans/${scanId}/progress`);
      const status = statusRes.data.status;
      if (status === 'COMPLETED') {
        isCompleted = true;
        break;
      }
      if (status === 'FAILED') {
        throw new Error('Scan failed');
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
    
    if (!isCompleted) {
      throw new Error('Scan timed out');
    }

    // 5. Fetch Final Scan Results
    const finalScanRes = await client.get(`/scans/${scanId}`);
    const scanData = finalScanRes.data;
    metrics.pagesCrawled = scanData.pagesCrawled;
    metrics.issuesFound = scanData.issuesFound;
    metrics.seoScore = scanData.siteScore?.overallScore || 0;
    console.log(`✅ Scan completed. Pages: ${metrics.pagesCrawled}, Score: ${metrics.seoScore}`);

    // 6. Test Inventory - Unfiltered
    console.log('Testing Page Inventory (Unfiltered)...');
    const unfilteredRes = await client.get(`/scans/${scanId}/pages`);
    if (unfilteredRes.data.data.total !== metrics.pagesCrawled) {
      metrics.errors.push(`Unfiltered inventory count mismatch: Expected ${metrics.pagesCrawled}, got ${unfilteredRes.data.data.total}`);
    } else {
      console.log('✅ Unfiltered inventory matches');
    }

    // 7. Test Search
    console.log('Testing Search (e.g., "catalogue")...');
    const searchRes = await client.get(`/scans/${scanId}/pages?search=catalogue`);
    if (searchRes.data.data.pages.length === 0) {
      console.log('⚠️ Search returned 0 results (might be expected depending on crawl output)');
    } else {
      console.log(`✅ Search returned ${searchRes.data.data.total} results`);
    }

    // 8. Test Status Filter (200)
    console.log('Testing Status Filter (200)...');
    const statusRes = await client.get(`/scans/${scanId}/pages?status=200`);
    if (statusRes.data.data.pages.some((p: any) => p.statusCode !== 200)) {
      metrics.errors.push('Status filter failed: returned non-200 pages');
    } else {
      console.log(`✅ Status filter works. Found ${statusRes.data.data.total} OK pages`);
    }

    // 9. Test Advanced Filters (Indexable = true)
    console.log('Testing Advanced Filter (indexable=true)...');
    const idxRes = await client.get(`/scans/${scanId}/pages?indexable=true`);
    if (idxRes.data.data.pages.some((p: any) => p.isIndexable !== true)) {
      metrics.errors.push('Indexable filter failed');
    } else {
      console.log(`✅ Indexable filter works. Found ${idxRes.data.data.total} indexable pages`);
    }

    // 10. Test CSV Export
    console.log('Testing CSV Export...');
    const csvRes = await client.get(`/scans/${scanId}/pages/export`);
    const csvContent = csvRes.data;
    if (!csvContent.includes('Status Code') || !csvContent.includes('Indexable')) {
      metrics.errors.push('CSV Export malformed');
    } else {
      // split by newline, minus 1 for header
      const rows = csvContent.split('\n').filter((l: string) => l.trim().length > 0);
      metrics.csvRowCount = rows.length - 1; 
      console.log(`✅ CSV Export returned ${metrics.csvRowCount} rows`);
      if (metrics.csvRowCount !== metrics.pagesCrawled) {
         metrics.errors.push(`CSV row count mismatch. Expected ${metrics.pagesCrawled}, got ${metrics.csvRowCount}`);
      }
    }

    // 11. Test Page Details
    console.log('Testing Page Details...');
    if (unfilteredRes.data.data.pages.length > 0) {
      const samplePageId = unfilteredRes.data.data.pages[0].id;
      const detailsRes = await client.get(`/pages/${samplePageId}`);
      if (!detailsRes.data.data || !detailsRes.data.data.url) {
        metrics.errors.push('Page details fetch failed or missing url');
      } else {
        console.log(`✅ Page Details retrieved for ${detailsRes.data.data.url}`);
      }
    }

    console.log('\\n--- TEST RESULTS ---');
    console.log(JSON.stringify(metrics, null, 2));

  } catch (err: any) {
    console.error('Test script crashed:', err?.response?.data || err.message);
    metrics.errors.push('Test script crashed: ' + (err?.response?.data?.message || err.message));
    console.log('\\n--- TEST RESULTS ---');
    console.log(JSON.stringify(metrics, null, 2));
  }
}

runTests();

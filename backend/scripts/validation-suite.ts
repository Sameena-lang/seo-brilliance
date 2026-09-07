import axios from 'axios';
import assert from 'assert';

const API_BASE = 'http://localhost:5000/api/v1';
const TEST_URL = 'http://localhost:5001';

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runValidationSuite() {
  console.log('==============================================');
  console.log('   STARTING V1 HARDENING VALIDATION SUITE');
  console.log('==============================================\n');

  let token = '';

  try {
    console.log('[Setup] Registering test user...');
    const testEmail = `val.suite.${Date.now()}@example.com`;
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      fullName: 'Validation Tester',
      email: testEmail,
      password: 'SecurePassword123!'
    });
    token = regRes.data.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    const runScan = async (rootUrl: string, maxPages: number, maxDepth: number = 3) => {
      const projRes = await axios.post(`${API_BASE}/projects`, {
        name: `Test Project ${maxPages}`,
        domain: 'localhost',
        rootUrl,
        crawlSettings: {
          maxPages,
          maxDepth,
          respectRobots: true,
          crawlSitemap: false,
          checkBrokenLinks: true,
          analyzeImages: true,
          analyzeSchema: true
        }
      }, { headers: authHeaders });
      const projectId = projRes.data.data.id;

      const scanRes = await axios.post(`${API_BASE}/projects/${projectId}/scans`, {}, { headers: authHeaders });
      const scanId = scanRes.data.data.id;

      let finalProg;
      const startTime = Date.now();
      for (let attempt = 1; attempt <= 120; attempt++) {
        await wait(2000);
        const progRes = await axios.get(`${API_BASE}/scans/${scanId}/progress`, { headers: authHeaders });
        finalProg = progRes.data.data;
        if (finalProg.status === 'COMPLETED' || finalProg.status === 'FAILED') {
          break;
        }
      }
      const duration = (Date.now() - startTime) / 1000;
      
      const resultRes = await axios.get(`${API_BASE}/scans/${scanId}`, { headers: authHeaders });
      const issuesRes = await axios.get(`${API_BASE}/scans/${scanId}/issues`, { headers: authHeaders });
      
      return { 
        progress: finalProg, 
        scan: resultRes.data.data,
        issues: issuesRes.data.data.issues,
        duration 
      };
    };

    // TASK 2: TEST CRAWL LIMITS & COMPLETION
    console.log('\n[Task 2 & 5] Testing Crawl Limits and Completion (10, 25, 50)...');
    
    // We run against books.toscrape.com for true limits testing since test server only has 20 pages
    const realTarget = 'https://books.toscrape.com';
    const limitResults = [];
    for (const limit of [10, 25, 50]) {
      console.log(`  -> Running scan with maxPages = ${limit}`);
      const res = await runScan(realTarget, limit);
      
      const totalProcessed = res.progress.pagesCrawled + res.progress.pagesFailed;
      console.log(`     Completed in ${res.duration.toFixed(1)}s. Discovered: ${res.progress.pagesDiscovered}, Crawled: ${res.progress.pagesCrawled}, Total Processed: ${totalProcessed}`);
      
      assert(totalProcessed <= limit, `FAILED LIMIT: Processed ${totalProcessed} exceeds maxPages ${limit}`);
      assert(res.progress.status === 'COMPLETED', `FAILED COMPLETION: Scan ended in state ${res.progress.status}`);
      
      limitResults.push({ limit, res });
    }
    console.log('  ✅ Crawl limits and terminal completion states validated successfully.');

    // TASK 3: SEO RULE VALIDATION
    console.log('\n[Task 3] SEO Rule Validation on Controlled Test Site...');
    const testScan = await runScan(TEST_URL, 50, 3);
    const issues = testScan.issues;
    const findIssue = (urlPath: string, code: string) => issues.find((i: any) => i.url.endsWith(urlPath) && i.ruleCode === code);

    const expectedRules = [
      { path: '/title-missing', code: 'TITLE_MISSING', sev: 'CRITICAL' },
      { path: '/title-too-long', code: 'TITLE_TOO_LONG', sev: 'WARNING' },
      { path: '/title-too-short', code: 'TITLE_TOO_SHORT', sev: 'WARNING' },
      { path: '/title-duplicate-2', code: 'TITLE_DUPLICATE', sev: 'WARNING' },
      { path: '/meta-desc-missing', code: 'META_DESCRIPTION_MISSING', sev: 'WARNING' },
      { path: '/meta-desc-too-long', code: 'META_DESCRIPTION_TOO_LONG', sev: 'WARNING' },
      { path: '/meta-desc-too-short', code: 'META_DESCRIPTION_TOO_SHORT', sev: 'WARNING' },
      { path: '/meta-desc-duplicate-2', code: 'META_DESCRIPTION_DUPLICATE', sev: 'WARNING' },
      { path: '/h1-missing', code: 'H1_MISSING', sev: 'WARNING' },
      { path: '/h1-multiple', code: 'H1_MULTIPLE', sev: 'INFO' },
      { path: '/heading-structure', code: 'HEADING_STRUCTURE', sev: 'INFO' },
      { path: '/image-missing-alt', code: 'IMAGE_MISSING_ALT', sev: 'WARNING' },
      { path: '/canonical-missing', code: 'CANONICAL_MISSING', sev: 'INFO' },
      { path: '/robots-noindex', code: 'ROBOTS_NOINDEX', sev: 'WARNING' },
      { path: '/this-does-not-exist', code: 'BROKEN_LINK', sev: 'CRITICAL' },
      { path: '/redirect-chain-1', code: 'REDIRECT_CHAIN', sev: 'WARNING' },
      { path: '/schema-error', code: 'SCHEMA_ERROR', sev: 'WARNING' },
    ];

    let missingRules = 0;
    for (const expected of expectedRules) {
      // Because duplicates depend on processing order, check either 1 or 2
      let issue = findIssue(expected.path, expected.code);
      if (!issue && expected.code.includes('DUPLICATE')) {
         issue = findIssue(expected.path.replace('-2', '-1'), expected.code);
      }
      
      if (!issue) {
        console.error(`  ❌ Failed to detect ${expected.code} on ${expected.path}`);
        missingRules++;
      } else {
        assert.strictEqual(issue.severity, expected.sev, `Wrong severity for ${expected.code}`);
        assert(issue.recommendation, `Missing recommendation for ${expected.code}`);
        console.log(`  ✅ Rule ${expected.code} correctly detected on ${issue.url}`);
      }
    }
    if (missingRules > 0) throw new Error('SEO Rule Validation failed');

    // TASK 4: SCORE VALIDATION
    console.log('\n[Task 4] Score Validation...');
    const scanClean = await runScan(`${TEST_URL}/clean`, 1, 1);
    const scanWarn = await runScan(`${TEST_URL}/h1-multiple`, 1, 1);
    const scanCrit = await runScan(`${TEST_URL}/title-missing`, 1, 1);

    const scoreClean = scanClean.scan.siteScore.overallScore;
    const scoreWarn = scanWarn.scan.siteScore.overallScore;
    const scoreCrit = scanCrit.scan.siteScore.overallScore;

    console.log(`  📊 Clean Score: ${scoreClean}, Warn Score: ${scoreWarn}, Critical Score: ${scoreCrit}`);
    assert(scoreClean > scoreWarn, 'Clean score should be higher than warning score');
    assert(scoreWarn > scoreCrit, 'Warning score should be higher than critical score');
    console.log('  ✅ Scoring engine correctly assigns hierarchical penalties.');

    // TASK 6: REPORT VALIDATION
    console.log('\n[Task 6] Report Validation...');
    const scanId = limitResults[2].res.scan.id; // 50-page scan
    await axios.post(`${API_BASE}/scans/${scanId}/reports`, {}, { headers: authHeaders });
    
    let reportId = null;
    for (let i = 0; i < 15; i++) {
      await wait(1000);
      const repList = await axios.get(`${API_BASE}/reports`, { headers: authHeaders });
      const found = repList.data.data.find((r: any) => r.scanId === scanId && r.pdfUrl && r.csvUrl);
      if (found) {
        reportId = found.id;
        break;
      }
    }
    assert(reportId, 'Report generation timed out');
    console.log('  ✅ Report job completed and persisted.');

    const pdfRes = await axios.get(`${API_BASE}/reports/${reportId}/download?type=pdf`, { headers: authHeaders, responseType: 'arraybuffer' });
    assert(Buffer.from(pdfRes.data).slice(0, 4).toString() === '%PDF', 'Invalid PDF format');
    
    const csvRes = await axios.get(`${API_BASE}/reports/${reportId}/download?type=csv`, { headers: authHeaders, responseType: 'text' });
    assert(csvRes.data.includes('URL'), 'CSV does not contain expected header');
    console.log('  ✅ PDF and CSV reports generated and downloaded successfully.');

    // TASK 7: AI VALIDATION
    console.log('\n[Task 7] AI Summary Validation...');
    let aiSummary = limitResults[2].res.scan.aiSummary;
    const limitScanId = limitResults[2].res.scan.id;
    if (!aiSummary) {
      for (let i = 0; i < 30; i++) {
        await wait(1000);
        const refetch = await axios.get(`${API_BASE}/scans/${limitScanId}`, { headers: authHeaders });
        if (refetch.data.data.aiSummary) {
          aiSummary = refetch.data.data.aiSummary;
          break;
        }
      }
    }
    
    if (aiSummary) {
       console.log(`  ✅ AI Summary found: "${aiSummary.summary.substring(0, 50)}..."`);
       if (aiSummary.summary.includes('API key')) {
         console.log('  ✅ Confirmed fallback stub behavior (No OpenAI key detected).');
       } else {
         console.log('  ✅ Confirmed real AI integration execution.');
       }
    } else {
       console.error('  ❌ AI Summary not found for scan');
       throw new Error('AI Summary missing');
    }

    console.log('\n==============================================');
    console.log('   ALL VALIDATION TESTS PASSED!');
    console.log('==============================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ VALIDATION TEST FAILED:', err.message);
    if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
    process.exit(1);
  }
}

runValidationSuite();

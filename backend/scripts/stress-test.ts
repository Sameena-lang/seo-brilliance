import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/v1';
const TEST_URL = 'https://books.toscrape.com';
const TEST_DOMAIN = 'books.toscrape.com';

async function runStressTest() {
  console.log('==============================================');
  console.log('   STARTING LARGE CRAWL STRESS TEST');
  console.log('==============================================\n');

  let token = '';
  let projectId = '';
  let scanId = '';
  let pagesCrawled = 0;
  let pagesDiscovered = 0;
  let issuesFound = 0;

  try {
    // 1. REGISTRATION
    console.log('[1/7] Registering test user...');
    const testEmail = `stress.test.${Date.now()}@example.com`;
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      fullName: 'Stress Tester',
      email: testEmail,
      password: 'SecurePassword123!'
    });
    token = regRes.data.data.token;
    console.log(`  ✅ Registered user: ${testEmail}`);

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. PROJECT CREATION
    console.log('\n[2/7] Creating Project...');
    const projRes = await axios.post(`${API_BASE}/projects`, {
      name: 'Stress Test Project',
      domain: TEST_DOMAIN,
      rootUrl: TEST_URL,
      crawlSettings: {
        maxPages: 50,
        maxDepth: 3,
        respectRobots: true,
        crawlSitemap: true,
        checkBrokenLinks: true,
        analyzeImages: true,
        analyzeSchema: true
      }
    }, { headers: authHeaders });
    projectId = projRes.data.data.id;
    console.log(`  ✅ Project created for ${TEST_URL} (ID: ${projectId})`);

    // 3. SCAN CREATION
    console.log('\n[3/7] Initiating Large Scan (maxPages=50, maxDepth=3)...');
    const startTime = Date.now();
    const scanRes = await axios.post(`${API_BASE}/projects/${projectId}/scans`, {}, { headers: authHeaders });
    scanId = scanRes.data.data.id;
    console.log(`  ✅ Scan initiated: Scan ID ${scanId}`);

    // 4. LIVE SCAN POLLING
    console.log('\n[4/7] Polling Scan Progress (This may take a while)...');
    let scanCompleted = false;
    let scanFailed = false;
    let lastProgress = -1;
    
    // Poll up to 120 times, every 3 seconds (6 minutes total)
    for (let attempt = 1; attempt <= 120; attempt++) {
      await new Promise(r => setTimeout(r, 3000));
      const progRes = await axios.get(`${API_BASE}/scans/${scanId}/progress`, { headers: authHeaders });
      const prog = progRes.data.data;
      
      if (prog.progressPercentage !== lastProgress || attempt % 5 === 0) {
        console.log(`  📊 Poll #${attempt}: Status=${prog.status}, Progress=${prog.progressPercentage}%, Discovered=${prog.pagesDiscovered}, Crawled=${prog.pagesCrawled}, Issues=${prog.issuesFound}`);
        lastProgress = prog.progressPercentage;
      }
      
      if (prog.status === 'COMPLETED') {
        scanCompleted = true;
        pagesCrawled = prog.pagesCrawled;
        pagesDiscovered = prog.pagesDiscovered;
        issuesFound = prog.issuesFound;
        break;
      }
      if (prog.status === 'FAILED') {
        scanFailed = true;
        break;
      }
    }
    const duration = (Date.now() - startTime) / 1000;
    
    if (scanFailed) throw new Error('Scan failed in crawler');
    if (!scanCompleted) throw new Error(`Scan timed out after ${duration} seconds`);
    
    console.log(`  ✅ Scan completed successfully in ${duration.toFixed(1)} seconds!`);
    console.log(`  📈 Final stats: ${pagesDiscovered} discovered, ${pagesCrawled} crawled, ${issuesFound} issues`);
    
    if (pagesDiscovered < pagesCrawled) {
      console.error(`  ⚠️ Warning: pagesDiscovered (${pagesDiscovered}) < pagesCrawled (${pagesCrawled})`);
    }

    // 5. AUDIT RESULTS
    console.log('\n[5/7] Verifying Audit Results & Scores...');
    const resultRes = await axios.get(`${API_BASE}/scans/${scanId}`, { headers: authHeaders });
    const scanData = resultRes.data.data;
    
    if (!scanData.siteScore) {
       console.error('  ❌ SiteScore missing from scan results');
    } else {
      console.log(`  ✅ Overall SEO Score: ${scanData.siteScore.overallScore}/100`);
      console.log(`  ✅ Technical Score: ${scanData.siteScore.technicalScore}/100`);
      console.log(`  ✅ Content Score: ${scanData.siteScore.contentScore}/100`);
      console.log(`  ✅ Performance Score: ${scanData.siteScore.performanceScore}/100`);
    }

    // 6. VERIFY PAGES
    console.log('\n[6/7] Verifying Crawled Pages Data...');
    const pagesRes = await axios.get(`${API_BASE}/scans/${scanId}/pages`, { headers: authHeaders });
    const pages = pagesRes.data.data.pages;
    console.log(`  ✅ Fetched ${pages.length} pages from database`);
    
    // Check for duplicates
    const urls = pages.map((p: any) => p.url);
    const uniqueUrls = new Set(urls);
    if (urls.length !== uniqueUrls.size) {
      console.error(`  ❌ Found duplicate URLs! ${urls.length} total, ${uniqueUrls.size} unique`);
    } else {
      console.log(`  ✅ All ${urls.length} URLs are unique`);
    }
    
    const errors = pages.filter((p: any) => p.statusCode >= 400);
    const redirects = pages.filter((p: any) => p.statusCode >= 300 && p.statusCode < 400);
    console.log(`  📊 HTTP Errors: ${errors.length}, Redirects: ${redirects.length}`);

    // 7. VERIFY ISSUES
    console.log('\n[7/7] Verifying Issues Data...');
    const issuesRes = await axios.get(`${API_BASE}/scans/${scanId}/issues`, { headers: authHeaders });
    const issues = issuesRes.data.data.issues;
    console.log(`  ✅ Fetched ${issues.length} issues from database`);
    
    const critical = issues.filter((i: any) => i.severity === 'CRITICAL');
    const high = issues.filter((i: any) => i.severity === 'HIGH');
    const medium = issues.filter((i: any) => i.severity === 'MEDIUM');
    const low = issues.filter((i: any) => i.severity === 'LOW');
    console.log(`  📊 Critical: ${critical.length}, High: ${high.length}, Medium: ${medium.length}, Low: ${low.length}`);

    console.log('\n==============================================');
    console.log('   STRESS TEST COMPLETED SUCCESSFULLY');
    console.log('==============================================\n');

    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ STRESS TEST FAILED:', err.message);
    if (err.response?.data) {
      console.error('Response data:', err.response.data);
    }
    process.exit(1);
  }
}

runStressTest();

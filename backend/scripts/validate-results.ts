import prisma from '../src/config/db';
import { getScan } from '../src/services/scan.service';

async function main() {
  const scan = await prisma.scan.findFirst({
    include: { project: true },
    orderBy: { createdAt: 'desc' }
  });

  if (!scan) {
    console.log("No scan found to validate.");
    return;
  }

  console.log(`Validating scan ${scan.id} for project ${scan.project.domain}`);
  
  try {
    const scanData = await getScan(scan.id, scan.project.organizationId);
    
    console.log("--- SCORES ---");
    console.log(`Overall: ${scanData.siteScore?.overallScore}`);
    console.log(`Technical: ${scanData.siteScore?.technicalScore}`);
    console.log(`Content: ${scanData.siteScore?.contentScore}`);

    console.log("\n--- PAGE INVENTORY ---");
    console.log(scanData.pageInventory);

    console.log("\n--- TOP ISSUES ---");
    console.log(`Total grouped top issues: ${scanData.topIssues?.length}`);
    if (scanData.topIssues && scanData.topIssues.length > 0) {
      const top = scanData.topIssues[0];
      console.log(`Top Issue Example:`);
      console.log(`  Title: ${top.title}`);
      console.log(`  Priority: ${top.priority}`);
      console.log(`  Affected Pages: ${top.affectedPages}`);
      console.log(`  Why it Matters: ${top.whyItMatters ? 'PRESENT' : 'MISSING'}`);
      console.log(`  How to Fix: ${top.howToFix ? 'PRESENT' : 'MISSING'}`);
    }

    console.log("\nValidation Successful!");
  } catch (error) {
    console.error("Validation failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

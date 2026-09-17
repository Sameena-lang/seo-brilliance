import { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../config/db';

// GenAI will be initialized on demand
let getGenAI = () => {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake-key');
};

// Helper to format issues for the prompt
const formatIssuesForPrompt = (issues: any[]) => {
  if (!issues || issues.length === 0) return 'No issues found.';
  return issues.slice(0, 10).map((i: any) => `- [${i.severity}] ${i.title} (${i.ruleCode}) on ${i.url}`).join('\n');
};

export const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scanId, issueId, pageId, message, history = [] } = req.body;
    const organizationId = req.user.organizationId;

    if (!message) {
      return res.status(400).json({ success: false, error: { message: 'Message is required' } });
    }

    let contextString = "The user has not selected a specific website scan for context. You are acting as a general SEO assistant.";

    if (scanId) {
      // Verify scan ownership
      const scan = await prisma.scan.findFirst({
        where: { id: scanId, project: { organizationId } },
        include: { project: true, siteScore: true }
      });

      if (!scan) {
        return res.status(404).json({ success: false, error: { message: 'Scan not found or access denied' } });
      }

      contextString = `Website: ${scan.project.domain}\nOverall Score: ${scan.siteScore?.overallScore || 'N/A'}\nPages Crawled: ${scan.pagesCrawled}\nTotal Issues: ${scan.issuesFound}\n\n`;

    // Fetch context-specific data
    if (issueId) {
      const issue = await prisma.issue.findFirst({
        where: { id: issueId, page: { scanId } }
      });
      if (issue) {
        contextString += `Specific Issue User is Asking About:\n- Title: ${issue.title}\n- Severity: ${issue.severity}\n- Rule: ${issue.ruleCode}\n- Found on URL: ${issue.url}\n\n`;
      }
    } else if (pageId) {
      const page = await prisma.page.findFirst({
        where: { id: pageId, scanId },
        include: { issues: true }
      });
      if (page) {
        contextString += `Specific Page User is Asking About:\n- URL: ${page.url}\n- Status: ${page.statusCode}\n- Indexable: ${page.isIndexable}\n- Issues on this page: ${page.issues.length}\n`;
        contextString += formatIssuesForPrompt(page.issues) + '\n\n';
      }
      } else {
        // General scan context
        const topIssues = await prisma.issue.findMany({
          where: { page: { scanId } },
          orderBy: [{ severity: 'asc' }],
          take: 10
        });
        contextString += `Top Issues on Site:\n${formatIssuesForPrompt(topIssues)}\n\n`;
      }
    }

    const systemPrompt = `You are a helpful, beginner-friendly SEO Assistant chatbot.
You explain technical SEO in simple, easy-to-understand language.
You are given the following REAL data about the user's website scan. You MUST base your answers on this data.
DO NOT hallucinate issues, scores, or URLs that are not in this context. If you don't know, say "I don't have enough information from this audit to answer that."
When explaining how to fix an issue, provide:
1. What the issue is
2. Why it matters
3. Step-by-step fix (with HTML/code example if appropriate)

IMPORTANT: You provide recommendations ONLY. You do NOT modify the website, and you must never claim that you did or will modify their website.

SCAN CONTEXT:
${contextString}
`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];
    
    console.log("Checking GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Present" : "Missing");

    if (!process.env.GEMINI_API_KEY) {
      // Fallback
      return res.status(200).json({ 
        success: true, 
        data: { 
          answer: "[FALLBACK RESPONSE]\nI am currently running in fallback mode because no AI API key is configured. " + (scanId ? "However, based on your context: your score is " + (contextString.includes("Overall Score: N/A") ? 'N/A' : contextString.match(/Overall Score: (\d+)/)?.[1] || 'N/A') + " and you have issues. " : "") + "Please configure an API key for full AI functionality."
        } 
      });
    }

    try {
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
        systemInstruction: systemPrompt,
      });

      const formattedHistory = history.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const chatSession = model.startChat({
        history: formattedHistory,
      });

      const result = await chatSession.sendMessage(message);

      return res.status(200).json({ success: true, data: { answer: result.response.text() } });
    } catch (genAiError: any) {
      console.error("Gemini API Error:", genAiError.message);
      
      const status = genAiError.status || 500;
      const message = genAiError.message || "Unknown AI Provider Error";

      return res.status(status).json({
        success: false,
        error: {
          message: `AI Provider Error: ${message}`
        }
      });
    }
  } catch (error: any) {
    next(error);
  }
};

export const explainVoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scanId, issueId } = req.body;
    const organizationId = req.user.organizationId;

    if (!scanId) {
      return res.status(400).json({ success: false, error: { message: 'scanId is required' } });
    }

    const scan = await prisma.scan.findFirst({
      where: { id: scanId, project: { organizationId } },
      include: { project: true, siteScore: true }
    });

    if (!scan) {
      return res.status(404).json({ success: false, error: { message: 'Scan not found or access denied' } });
    }

    let script = "";

    if (issueId) {
      const issue = await prisma.issue.findFirst({
        where: { id: issueId, page: { scanId } }
      });
      if (!issue) {
        return res.status(404).json({ success: false, error: { message: 'Issue not found' } });
      }
      script = `This issue is titled: ${issue.title}. It has a severity level of ${issue.severity}. You can find this issue on the page: ${issue.url}. Fixing this issue will help improve your SEO health.`;
    } else {
      const siteScore = scan.siteScore;
      if (!siteScore) {
        script = `Your website, ${scan.project.domain}, has been crawled. We crawled ${scan.pagesCrawled} pages and found ${scan.issuesFound} issues.`;
      } else {
        const health = siteScore.overallScore >= 90 ? "good" : siteScore.overallScore >= 70 ? "needs improvement" : "poor";
        script = `Your website, ${scan.project.domain}, has an SEO score of ${siteScore.overallScore} out of 100, which means it ${health}. `;
        script += `Your strongest area is Technical, with a score of ${siteScore.technicalScore}. `;
        script += `The main weaknesses are Content and Performance. `;
        script += `There are ${siteScore.criticalCount} critical issues and ${siteScore.warningCount} warnings. `;
        script += `These changes should improve the technical health of your website.`;
      }
    }

    // Since Gemini does not provide a native TTS equivalent, always use the browser fallback
    return res.status(200).json({ 
      success: true, 
      data: { 
        script, 
        ttsUnavailable: true, 
        message: "TTS relies on browser fallback." 
      } 
    });

  } catch (error: any) {
    next(error);
  }
};

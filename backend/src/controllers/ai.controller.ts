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
        // General scan context - REDUCED TO 3 ISSUES TO SAVE CONTEXT SIZE
        const topIssues = await prisma.issue.findMany({
          where: { page: { scanId } },
          orderBy: { severity: 'asc' },
          take: 3
        });
        contextString += `Top Issues on Site:\n${formatIssuesForPrompt(topIssues)}\n\n`;
      }

      // Add External Integration Context
      const externalMetrics = await prisma.externalMetricSnapshot.findMany({
        where: { projectId: scan.projectId },
        orderBy: { date: 'desc' },
        distinct: ['provider']
      });

      if (externalMetrics.length > 0) {
        contextString += `External Integration Data Available:\n`;
        externalMetrics.forEach(m => {
          contextString += `- ${m.provider.toUpperCase()} (${new Date(m.date).toLocaleDateString()}): ${m.metrics}\n`;
        });
        contextString += `\n`;
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

    if (!process.env.GEMINI_API_KEY) {
      // Fallback using SSE format
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      res.write(`data: ${JSON.stringify({ text: "[FALLBACK RESPONSE]\nI am currently running in fallback mode because no AI API key is configured. Please configure an API key for full AI functionality." })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }

    try {
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
        systemInstruction: systemPrompt,
      });

      const formattedHistory = history.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const chatSession = model.startChat({
        history: formattedHistory,
      });

      // Set headers for SSE streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Start streaming with a 15-second timeout for the first chunk
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI Request Timeout')), 15000)
      );

      const streamPromise = chatSession.sendMessageStream(message);
      
      const result = await Promise.race([streamPromise, timeoutPromise]) as any;

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      }

      res.write(`data: [DONE]\n\n`);
      res.end();

    } catch (genAiError: any) {
      console.error("Gemini API Error:", genAiError.message);
      
      // If headers are not sent, send a standard JSON error, else write event error
      if (!res.headersSent) {
        const status = genAiError.status || 500;
        let errMsg = genAiError.message || "Unknown AI Provider Error";
        if (errMsg === 'AI Request Timeout') {
          errMsg = "The AI service is taking too long to respond. Here are the key findings from your SEO audit: " + contextString;
        }
        return res.status(status).json({
          success: false,
          error: {
            message: `AI Provider Error: ${errMsg}`
          }
        });
      } else {
        res.write(`data: ${JSON.stringify({ error: genAiError.message })}\n\n`);
        res.end();
      }
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

import { issueExplanationPrompt } from '../ai/prompts/issueExplanation';
import { titleGeneratorPrompt } from '../ai/prompts/titleGenerator';
import { metaDescriptionPrompt } from '../ai/prompts/metaDescription';
import { altTextPrompt } from '../ai/prompts/altText';

const generateAiResponse = async (prompt: string, fallback: string) => {
  if (!process.env.GEMINI_API_KEY) return fallback;
  try {
    const genAI = getGenAI();
    let modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e: any) {
      if (e.status === 404 || e.status === 503) {
        console.log("Model unavailable, falling back to gemini-flash-lite-latest");
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
        const result = await fallbackModel.generateContent(prompt);
        return result.response.text();
      }
      throw e;
    }
  } catch (error: any) {
    console.error("AI Generation Error:", error.message || error);
    return fallback;
  }
};

export const explainIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { issueContext } = req.body;
    const prompt = issueExplanationPrompt(issueContext);
    const result = await generateAiResponse(prompt, "AI analysis is temporarily unavailable.");
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const generateTitle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, title, content } = req.body;
    const prompt = titleGeneratorPrompt(url, title, content);
    let result = await generateAiResponse(prompt, '[{"title": "AI analysis is temporarily unavailable.", "characterCount": 0, "reason": "Fallback"}]');
    
    try {
      result = result.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(result);
      res.status(200).json({ success: true, data: parsed });
    } catch {
      res.status(200).json({ success: true, data: [{ title: "AI analysis is temporarily unavailable.", characterCount: 0, reason: "Parsing failed" }] });
    }
  } catch (error) {
    next(error);
  }
};

export const generateMetaDescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, title, description, content } = req.body;
    const prompt = metaDescriptionPrompt(url, title, description, content);
    let result = await generateAiResponse(prompt, '[{"description": "AI analysis is temporarily unavailable.", "characterCount": 0, "reason": "Fallback"}]');
    
    try {
      result = result.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(result);
      res.status(200).json({ success: true, data: parsed });
    } catch {
      res.status(200).json({ success: true, data: [{ description: "AI analysis is temporarily unavailable.", characterCount: 0, reason: "Parsing failed" }] });
    }
  } catch (error) {
    next(error);
  }
};

export const generateAltText = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageUrl, filename, pageTitle, context } = req.body;
    const prompt = altTextPrompt(imageUrl, filename, pageTitle, context);
    let result = await generateAiResponse(prompt, '{"altText": "More context needed", "reason": "Fallback"}');
    
    try {
      result = result.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(result);
      res.status(200).json({ success: true, data: parsed });
    } catch {
      res.status(200).json({ success: true, data: { altText: "More context needed", reason: "Parsing failed" } });
    }
  } catch (error) {
    next(error);
  }
};

import { contentAnalysisPrompt } from '../ai/prompts/contentAnalysis';
import { actionPlanPrompt } from '../ai/prompts/actionPlan';

export const analyzeContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, title, headings, contentSummary } = req.body;
    const prompt = contentAnalysisPrompt(url, title, headings, contentSummary);
    const result = await generateAiResponse(prompt, "AI analysis is temporarily unavailable.");
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const generateActionPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { issuesContext } = req.body;
    const prompt = actionPlanPrompt(issuesContext);
    const result = await generateAiResponse(prompt, "AI analysis is temporarily unavailable.");
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};


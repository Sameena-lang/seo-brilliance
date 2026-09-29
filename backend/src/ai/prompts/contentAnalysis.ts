export const contentAnalysisPrompt = (pageUrl: string, title: string, headings: string, contentSummary: string) => `You are an SEO content analyst.
Analyze the following page content structure and quality.

URL: ${pageUrl}
Title: ${title}
Headings: ${headings}
Content Summary: ${contentSummary}

Provide:
1. Content Strengths
2. Content Weaknesses
3. Topic coverage and Readability observations
4. Potential missing sections or improvements

Do NOT invent keyword search volumes or claim that specific keywords have a particular search volume.`;

export const titleGeneratorPrompt = (pageUrl: string, currentTitle: string, pageContent: string) => `You are an SEO copywriter.
Generate 3 SEO-optimized title tag suggestions for the following page.

URL: ${pageUrl}
Current Title: ${currentTitle}
Context/Content: ${pageContent}

Return a JSON array of objects with the structure:
[
  { "title": "Suggestion 1", "characterCount": 55, "reason": "Why this works" }
]
Keep titles between 50-60 characters. Do not include markdown formatting like \`\`\`json in the output.`;

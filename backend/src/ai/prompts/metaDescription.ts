export const metaDescriptionPrompt = (pageUrl: string, currentTitle: string, currentDesc: string, pageContent: string) => `You are an SEO copywriter.
Generate 3 SEO-optimized meta description suggestions for the following page.

URL: ${pageUrl}
Title: ${currentTitle}
Current Description: ${currentDesc}
Context/Content: ${pageContent}

Return a JSON array of objects with the structure:
[
  { "description": "Suggestion 1", "characterCount": 155, "reason": "Why this works" }
]
Keep descriptions between 150-160 characters. Do not include markdown formatting like \`\`\`json in the output.`;

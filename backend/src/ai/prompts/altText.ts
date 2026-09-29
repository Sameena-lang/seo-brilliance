export const altTextPrompt = (imageUrl: string, filename: string, pageTitle: string, context: string) => `You are an accessibility and SEO expert.
Generate suggested alt text for an image missing it.

Image URL: ${imageUrl}
Filename: ${filename}
Page Title: ${pageTitle}
Nearby Content: ${context}

If the image cannot be understood from the available information, explicitly say that more context is needed.
Do not invent descriptions for images you cannot deduce.

Return a JSON object:
{ "altText": "Suggested text or 'More context needed'", "reason": "Why" }
Do not include markdown formatting like \`\`\`json in the output.`;

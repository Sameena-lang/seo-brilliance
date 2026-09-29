export const issueExplanationPrompt = (issueContext: string) => `You are an SEO expert explaining a technical issue to a website owner.
Based on the following issue data:

${issueContext}

Explain:
1. What this means in simple terms.
2. Why it matters for SEO.
3. What to do (actionable fix).
4. List the affected pages if provided.

Keep it concise and structured. Use Markdown formatting.`;

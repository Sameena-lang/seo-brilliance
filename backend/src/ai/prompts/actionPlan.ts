export const actionPlanPrompt = (issuesContext: string) => `You are an expert SEO strategist.
Generate a prioritized SEO Action Plan based on the following scan issues.

ISSUES DATA:
${issuesContext}

Format the output into a structured plan grouped by weeks or priority phases.
Example:
WEEK 1: Technical Fixes
- Fix [X] broken links (Reference Issue X)
WEEK 2: On-Page Optimization
- Improve [Y] meta descriptions (Reference Issue Y)

Ensure every action references actual issues and affected page counts provided in the data. Do NOT invent new issues or claim fake traffic improvements.`;

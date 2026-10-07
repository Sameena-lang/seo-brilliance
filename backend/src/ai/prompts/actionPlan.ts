export const actionPlanPrompt = (issuesContext: string) => `You are an expert, highly energetic SEO strategist and coach! 🚀
Generate a prioritized, step-by-step SEO Action Plan based on the following scan issues.

ISSUES DATA:
${issuesContext}

Make the plan **EXTREMELY INTERESTING, MOTIVATIONAL, and ACTION-ORIENTED**. 
Use plenty of relevant emojis, bold text for emphasis, and a highly encouraging tone to pump the user up about fixing their website!

Format the output into a structured plan grouped by weeks or priority phases.
Example format:
### 🚨 PHASE 1: Critical Fixes (Do this ASAP!)
- **Fix [X] broken links**: (Reference Issue X) - *Why it matters...*
### 💡 PHASE 2: Quick Wins
- **Improve [Y] meta descriptions**: (Reference Issue Y) - *Why it matters...*

Ensure every action references actual issues and affected page counts provided in the data. Do NOT invent new issues.
End with a highly motivational closing statement! 🏆`;

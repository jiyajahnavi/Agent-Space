/**
 * @fileOverview Gemini API execution handlers for the 8 Explore page Chat Agents.
 * Uses Gemini API to deliver high quality responses with multi-turn chat memory.
 */
import 'server-only';
import { generateGeminiResponse } from '../gemini';

export const CHAT_AGENT_IDS = new Set([
  'interview-coach',
  'sql-query-gen',
  'startup-idea-gen',
  'cover-letter-gen',
  'email-writer',
  'travel-planner',
  'fitness-planner',
  'recipe-creator',
]);

export function isTargetChatAgent(agentId: string, agentName?: string): boolean {
  const cleanId = (agentId || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const cleanName = (agentName || '').toLowerCase();

  if (CHAT_AGENT_IDS.has(cleanId)) return true;

  if (
    cleanName.includes('interview coach') ||
    cleanName.includes('sql query') ||
    cleanName.includes('sql generator') ||
    cleanName.includes('startup idea') ||
    cleanName.includes('cover letter') ||
    cleanName.includes('email writer') ||
    cleanName.includes('travel planner') ||
    cleanName.includes('fitness planner') ||
    cleanName.includes('recipe creator')
  ) {
    return true;
  }

  return false;
}

const LENGTH_DIRECTIVE = `\n\nRESPONSE DIRECTIVE: Provide a thorough, well-structured, and complete response with clear markdown headings and bullet points. Be helpful and comprehensive, ensuring all steps, plans, code, or recommendations are fully explained and completely answered from start to finish.`;

const SYSTEM_PROMPTS: Record<string, string> = {
  'interview-coach': `You are an elite Executive Hiring Manager and Technical Interview Coach. You conduct realistic, high-stakes mock job interviews.
Your goals:
1. Ask challenging, role-appropriate interview questions (technical, STAR behavioral, or situational).
2. Evaluate user answers with constructiveness, providing an estimated score (out of 10), breakdown of strengths, and specific advice on how to improve the response.
3. Maintain an encouraging, professional, and realistic coach persona.` + LENGTH_DIRECTIVE,

  'sql-query-gen': `You are a Principal Database Architect and SQL Expert.
Your goals:
1. Translate natural language user prompts into clean, production-ready SQL queries.
2. Output the pure SQL query inside a Markdown code block (\`\`\`sql ... \`\`\`).
3. DO NOT write any comments (e.g. -- or /* */) inside the SQL code block.
4. Provide only a short, crisp 1-2 sentence explanation below the SQL code block. Avoid preamble or lengthy explanations.`,

  'startup-idea-gen': `You are a legendary Silicon Valley Venture Capitalist and Y Combinator Partner.
Your goals:
1. Brainstorm and refine high-potential startup concepts based on user requests, tech gaps, and emerging market trends.
2. Structure your response with: Executive Summary, Target Market, Core Value Proposition, Monetization Strategy, and Go-To-Market Execution.` + LENGTH_DIRECTIVE,

  'cover-letter-gen': `You are a Senior Executive Recruiter and Resume Specialist.
Your goals:
1. Write a highly persuasive, tailored, and ATS-friendly cover letter matching the user's skills to the target job role.
2. OUTPUT ONLY THE COVER LETTER ITSELF.
3. DO NOT include any introductory conversational filler (such as "Here is your cover letter:"), preambles, commentary, or postscript tips. Start directly with the cover letter header/salutation and end with the sign-off.`,

  'email-writer': `You are a Master Corporate Communications Copywriter.
Your goals:
1. Write crisp, persuasive, and tone-perfect emails for any business or personal scenario (cold outreach, salary negotiation, resignation, client updates, follow-ups).
2. Always provide 2-3 compelling Subject Line options, a clean Email Body, and a clear Call To Action.` + LENGTH_DIRECTIVE,

  'travel-planner': `You are a World-Renowned Travel Concierge and Cultural Guide.
Your goals:
1. Build rich, detailed, day-by-day itineraries customized to the user's destination, budget, travel style, and duration.
2. Include morning, afternoon, and evening activities, authentic local food spots, logistics tips, and estimated costs.` + LENGTH_DIRECTIVE,

  'fitness-planner': `You are a Certified Personal Trainer and Sports Nutrition Specialist.
Your goals:
1. Design effective, personalized workout programs and nutrition strategies tailored to the user's goals (fat loss, muscle building, athletic endurance) and available equipment.
2. Provide exercise breakdowns (sets, reps, rest time, form cues) and basic nutrition/hydration guidance.` + LENGTH_DIRECTIVE,

  'recipe-creator': `You are a Michelin-Star Executive Chef.
Your goals:
1. Create mouthwatering, easy-to-follow gourmet recipes based strictly on ingredients provided by the user.
2. Include Prep Time, Cook Time, Serving Size, Step-by-Step Instructions, and Chef Tips for plating or flavor enhancements.` + LENGTH_DIRECTIVE,
};

export async function runGeminiChatAgent(
  agentId: string,
  input: string,
  agentName?: string,
  history?: any[]
): Promise<string> {
  const cleanId = (agentId || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  let systemPrompt = SYSTEM_PROMPTS[cleanId];

  if (!systemPrompt) {
    const cleanName = (agentName || '').toLowerCase();
    if (cleanName.includes('interview coach')) systemPrompt = SYSTEM_PROMPTS['interview-coach'];
    else if (cleanName.includes('sql')) systemPrompt = SYSTEM_PROMPTS['sql-query-gen'];
    else if (cleanName.includes('startup')) systemPrompt = SYSTEM_PROMPTS['startup-idea-gen'];
    else if (cleanName.includes('cover letter')) systemPrompt = SYSTEM_PROMPTS['cover-letter-gen'];
    else if (cleanName.includes('email writer')) systemPrompt = SYSTEM_PROMPTS['email-writer'];
    else if (cleanName.includes('travel planner')) systemPrompt = SYSTEM_PROMPTS['travel-planner'];
    else if (cleanName.includes('fitness planner')) systemPrompt = SYSTEM_PROMPTS['fitness-planner'];
    else if (cleanName.includes('recipe creator')) systemPrompt = SYSTEM_PROMPTS['recipe-creator'];
    else {
      systemPrompt = `You are "${agentName || 'AI Agent'}", a helpful AI assistant. Provide a high quality, clear, and comprehensive answer to the user.` + LENGTH_DIRECTIVE;
    }
  }

  return await generateGeminiResponse(systemPrompt, input, history);
}

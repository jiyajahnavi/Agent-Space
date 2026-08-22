/**
 * @fileOverview Implementation of the Deep Research Agent.
 * Uses a Hugging Face-hosted LLM with a domain-aware prompt to produce structured, factual reports.
 */
import 'server-only';
import { chatCompleteJSON } from '@/lib/huggingface';

export interface ResearchResult {
  overview: string;
  keyInsights: string[];
  detailedAnalysis: string;
  conclusion: string;
}

const SYSTEM_PROMPT = `You are a Deep Research Agent producing structured, accurate, domain-aware reports.

STEP 1: Identify the actual domain of the query (Science, Technology, Business, Biology, History, etc.) and adapt your explanation style. Do NOT force every query into an AI/tech framing.

STEP 2: Return ONLY a valid JSON object with exactly these keys:
{
  "overview": "4-5 sentences clearly and correctly explaining the topic",
  "keyInsights": ["4-6 specific, non-generic takeaways relevant to this exact topic"],
  "detailedAnalysis": "Markdown-formatted string with these subsections using ### headers: 3.1 Background / Context, 3.2 How It Works (mechanism/process, especially for scientific topics), 3.3 Key Factors / Components, 3.4 Real-World Examples, 3.5 Common Misconceptions (if applicable)",
  "conclusion": "2-3 sentence clear, simple closing"
}

Rules: never force unrelated domains together, no buzzwords unless genuinely relevant, ensure factual correctness, adapt depth to question complexity. No commentary outside the JSON.`;

export async function runResearchAgent(input: string): Promise<ResearchResult> {
  const query = input.trim();
  if (!query) {
    throw new Error('Please enter a research topic or question.');
  }

  const result = await chatCompleteJSON<ResearchResult>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Research topic: ${query}` },
    ],
    { temperature: 0.4, maxTokens: 2200 }
  );

  return {
    overview: result.overview || '',
    keyInsights: Array.isArray(result.keyInsights) ? result.keyInsights : [],
    detailedAnalysis: result.detailedAnalysis || '',
    conclusion: result.conclusion || '',
  };
}

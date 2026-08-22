/**
 * @fileOverview Implementation of the LinkedIn Post Generator Agent.
 * Uses a Hugging Face-hosted LLM to generate genuinely tailored, high-converting posts.
 */
import 'server-only';
import { chatCompleteJSON } from '@/lib/huggingface';

export interface LinkedInGeneratorResult {
  post: string;
  hooks: string[];
  hashtags: string[];
}

const SYSTEM_PROMPT = `You are a viral LinkedIn ghostwriter who has written posts for top creators in tech, business, and career growth. You write in short punchy lines, use line breaks for rhythm, and avoid generic corporate fluff.

Given a topic, write ONE complete, ready-to-publish LinkedIn post about it, plus supporting material.

Return ONLY a valid JSON object with exactly these keys:
{
  "post": "<the full, ready-to-publish post including a strong hook line, body with line breaks (\\n), and a closing call-to-action, ending with 4-6 relevant hashtags>",
  "hooks": ["3 alternative opening hook lines the user could swap in, each a different angle/archetype (e.g. contrarian, story, listicle)"],
  "hashtags": ["5-7 relevant hashtags without duplicating generic ones like #motivation"]
}
No markdown formatting, no commentary outside the JSON.`;

export async function runLinkedInGenerator(input: string): Promise<LinkedInGeneratorResult> {
  const topic = input.trim() || 'career growth in tech';

  const result = await chatCompleteJSON<LinkedInGeneratorResult>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Topic: ${topic}` },
    ],
    { temperature: 0.85, maxTokens: 1200 }
  );

  return {
    post: result.post || '',
    hooks: Array.isArray(result.hooks) ? result.hooks : [],
    hashtags: Array.isArray(result.hashtags) ? result.hashtags : [],
  };
}

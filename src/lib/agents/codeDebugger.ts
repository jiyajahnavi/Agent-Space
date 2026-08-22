/**
 * @fileOverview Implementation of the Code Debugger Agent.
 * Sends code to a Hugging Face-hosted LLM for real static analysis, bug fixes, and explanation.
 */
import 'server-only';
import { chatCompleteJSON } from '@/lib/huggingface';

export interface DebugResult {
  fixedCode: string;
  errorsFound: string[];
  explanation: string;
  improvements: string[];
  errorCount: number;
}

const SYSTEM_PROMPT = `You are a senior software engineer performing a careful code review and bug fix pass. You support any mainstream language (JavaScript, TypeScript, Python, Java, C++, Go, etc.) and should detect the language automatically from the code.

Analyze the given code for: syntax errors, logic bugs, off-by-one errors, null/undefined handling, type mismatches, unhandled edge cases, and bad practices (e.g. loose equality, unclosed brackets/quotes, missing colons in Python, etc.).

Return ONLY a valid JSON object with exactly these keys:
{
  "fixedCode": "<the corrected, complete code, preserving the original structure and style as much as possible>",
  "errorsFound": ["specific description of each issue found, referencing line numbers or code snippets where possible"],
  "explanation": "<2-4 sentences summarizing what was wrong and what you changed>",
  "improvements": ["2-4 additional best-practice suggestions beyond the bug fixes"],
  "errorCount": <integer, number of distinct issues found>
}
If the code has no bugs, set errorsFound to ["No issues found - code is syntactically and logically sound."], errorCount to 0, and fixedCode equal to the original code.
No markdown, no commentary outside the JSON.`;

export async function runCodeDebugger(input: string): Promise<DebugResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Please paste some code to debug.');
  }

  const result = await chatCompleteJSON<DebugResult>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Code to review:\n\n\`\`\`\n${trimmed.slice(0, 12000)}\n\`\`\`` },
    ],
    { temperature: 0.2, maxTokens: 2000 }
  );

  return {
    fixedCode: result.fixedCode || trimmed,
    errorsFound: Array.isArray(result.errorsFound) ? result.errorsFound : [],
    explanation: result.explanation || '',
    improvements: Array.isArray(result.improvements) ? result.improvements : [],
    errorCount: Math.max(0, Math.round(Number(result.errorCount) || 0)),
  };
}

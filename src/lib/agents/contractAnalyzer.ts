/**
 * @fileOverview Implementation of the Legal Summarizer / Contract Analyzer.
 * Uses a Hugging Face-hosted LLM for real clause-level risk assessment.
 */
import 'server-only';
import { chatCompleteJSON } from '@/lib/huggingface';

export interface ContractAnalysisResult {
  summary: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  riskyClauses: string[];
  explanation: string;
}

const SYSTEM_PROMPT = `You are an experienced contracts attorney reviewing an agreement for a client (not giving formal legal advice, but a practical risk read).

Given the contract text, identify actual risky clauses (liability, indemnity, termination, penalties, non-compete, IP assignment, uncapped damages, auto-renewal, jurisdiction, etc.) with real quotes or close paraphrases from the text.

Return ONLY a valid JSON object with exactly these keys:
{
  "summary": "<2-3 sentences describing what kind of agreement this is and its overall shape>",
  "riskLevel": "<'Low' | 'Medium' | 'High', based on how one-sided/aggressive the risky clauses are>",
  "riskyClauses": ["specific risky clause descriptions, each naming the clause type and quoting/paraphrasing the relevant text"],
  "explanation": "<2-4 sentences explaining the reasoning behind the risk level and what to negotiate or watch out for>"
}
If no meaningful risk is found, riskyClauses should be ["No significant risk clauses detected in the provided text."] and riskLevel "Low".
No markdown, no commentary outside the JSON.`;

export async function runContractAnalyzer(input: string): Promise<ContractAnalysisResult> {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 20) {
    throw new Error('Please provide contract text or upload a PDF with readable content before running the analyzer.');
  }

  const result = await chatCompleteJSON<ContractAnalysisResult>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Contract text:\n\n${trimmed.slice(0, 14000)}` },
    ],
    { temperature: 0.25, maxTokens: 1800 }
  );

  const riskLevel: ContractAnalysisResult['riskLevel'] =
    result.riskLevel === 'High' || result.riskLevel === 'Medium' || result.riskLevel === 'Low'
      ? result.riskLevel
      : 'Low';

  return {
    summary: result.summary || '',
    riskLevel,
    riskyClauses: Array.isArray(result.riskyClauses) ? result.riskyClauses : [],
    explanation: result.explanation || '',
  };
}

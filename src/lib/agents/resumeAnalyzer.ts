/**
 * @fileOverview Implementation of the Resume Analyzer Agent.
 * Sends resume text to a Hugging Face-hosted LLM for a real ATS-style review.
 */
import 'server-only';
import { chatCompleteJSON } from '@/lib/huggingface';

export interface ResumeAnalysisResult {
  score: number;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  prediction: string;
  aiInsights: string;
}

const SYSTEM_PROMPT = `You are an expert technical recruiter and ATS (Applicant Tracking System) specialist with 15 years of experience screening resumes for software, data, and product roles.

Given the resume text below (and any extra context/job description the candidate supplied), produce a rigorous, honest evaluation. Do not be generically positive - call out real gaps.

Return ONLY a valid JSON object with exactly these keys:
{
  "score": <integer 0-100, realistic ATS compatibility + quality score>,
  "verdict": "<one short verdict, e.g. 'Good', 'Needs Improvement', 'Excellent', 'Average'>",
  "strengths": ["3-5 specific strengths, referencing actual content from the resume"],
  "weaknesses": ["3-5 specific weaknesses or gaps, referencing actual content"],
  "suggestions": ["4-6 concrete, actionable improvement suggestions"],
  "prediction": "<1-2 sentences predicting how this resume performs against ATS filters and human screeners for roles it targets>",
  "aiInsights": "<2-3 sentences of deeper behavioral/career-trajectory analysis>"
}
No markdown, no commentary outside the JSON.`;

export async function runResumeAnalyzer(input: string): Promise<ResumeAnalysisResult> {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 20) {
    throw new Error('Please provide resume text or upload a PDF with readable content before running the analyzer.');
  }

  const result = await chatCompleteJSON<ResumeAnalysisResult>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Resume content and context:\n\n${trimmed.slice(0, 12000)}` },
    ],
    { temperature: 0.3, maxTokens: 1400 }
  );

  return {
    score: Math.max(0, Math.min(100, Math.round(Number(result.score) || 0))),
    verdict: result.verdict || 'Analysis complete',
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
    suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
    prediction: result.prediction || '',
    aiInsights: result.aiInsights || '',
  };
}

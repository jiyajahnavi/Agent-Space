/**
 * @fileOverview Central registry for all AI agents and their execution logic.
 * All run() functions call Hugging Face-hosted models server-side (see src/lib/huggingface.ts).
 * This module must only be imported from server code (API routes), never from a client component.
 */
import 'server-only';
import { runResumeAnalyzer } from './resumeAnalyzer';
import { runCodeDebugger } from './codeDebugger';
import { runLinkedInGenerator } from './linkedinGenerator';
import { runResearchAgent } from './researchAgent';
import { runContractAnalyzer } from './contractAnalyzer';

export interface AgentRegistryEntry {
  id: string;
  name: string;
  description: string;
  inputType: 'text' | 'file';
  run: (input: string) => Promise<any>;
}

export const agentRegistry: Record<string, AgentRegistryEntry> = {
  'resume-analyzer': {
    id: 'resume-analyzer',
    name: 'Resume Analyzer',
    description: 'Analyze resumes and generate ATS score with suggestions',
    inputType: 'file',
    run: (input) => runResumeAnalyzer(input),
  },
  'code-debugger': {
    id: 'code-debugger',
    name: 'Code Debugger',
    description: 'Identifies bugs and suggests fixes with detailed explanations',
    inputType: 'text',
    run: (input) => runCodeDebugger(input),
  },
  'code-debugger-pro': {
    id: 'code-debugger-pro',
    name: 'Code Debugger Pro',
    description: 'Advanced Logic Fixer',
    inputType: 'text',
    run: (input) => runCodeDebugger(input),
  },
  'linkedin-poster': {
    id: 'linkedin-poster',
    name: 'LinkedIn Poster',
    description: 'Engagement Growth Tool',
    inputType: 'text',
    run: (input) => runLinkedInGenerator(input),
  },
  'research-agent': {
    id: 'research-agent',
    name: 'Research Agent',
    description: 'Deep multi-step reasoning and structured analysis engine',
    inputType: 'text',
    run: (input) => runResearchAgent(input),
  },
  'legal-summarizer': {
    id: 'legal-summarizer',
    name: 'Legal Summarizer',
    description: 'Contract Risk Analysis',
    inputType: 'file',
    run: (input) => runContractAnalyzer(input),
  }
};

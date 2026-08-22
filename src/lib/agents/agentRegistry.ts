/**
 * @fileOverview Central registry for all AI agents and their execution logic.
 * This module must only be imported from server code (API routes), never from a client component.
 */
import 'server-only';
import { runResumeAnalyzer } from './resumeAnalyzer';
import { runCodeDebugger } from './codeDebugger';
import { runLinkedInGenerator } from './linkedinGenerator';
import { runResearchAgent } from './researchAgent';
import { runContractAnalyzer } from './contractAnalyzer';
import { runGeminiChatAgent } from './chatAgentsGemini';

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
  },

  // Explore page Chat Agents powered by Gemini API
  'interview-coach': {
    id: 'interview-coach',
    name: 'Interview Coach',
    description: 'Simulates high-stakes job interviews and provides real-time feedback on your answers.',
    inputType: 'text',
    run: (input) => runGeminiChatAgent('interview-coach', input, 'Interview Coach'),
  },
  'sql-query-gen': {
    id: 'sql-query-gen',
    name: 'SQL Query Gen',
    description: 'Translates natural language questions into perfect SQL queries for any database schema.',
    inputType: 'text',
    run: (input) => runGeminiChatAgent('sql-query-gen', input, 'SQL Query Gen'),
  },
  'startup-idea-gen': {
    id: 'startup-idea-gen',
    name: 'Startup Idea Gen',
    description: 'Generates high-potential startup ideas based on emerging market trends and tech gaps.',
    inputType: 'text',
    run: (input) => runGeminiChatAgent('startup-idea-gen', input, 'Startup Idea Gen'),
  },
  'cover-letter-gen': {
    id: 'cover-letter-gen',
    name: 'Cover Letter Gen',
    description: 'Writes tailored cover letters by matching your skills to a specific job description.',
    inputType: 'text',
    run: (input) => runGeminiChatAgent('cover-letter-gen', input, 'Cover Letter Gen'),
  },
  'email-writer': {
    id: 'email-writer',
    name: 'Email Writer',
    description: 'Crafts professional, persuasive emails for any scenario. Just describe the intent.',
    inputType: 'text',
    run: (input) => runGeminiChatAgent('email-writer', input, 'Email Writer'),
  },
  'travel-planner': {
    id: 'travel-planner',
    name: 'Travel Planner',
    description: 'Builds the perfect multi-city travel itinerary based on your budget and interests.',
    inputType: 'text',
    run: (input) => runGeminiChatAgent('travel-planner', input, 'Travel Planner'),
  },
  'fitness-planner': {
    id: 'fitness-planner',
    name: 'Fitness Planner',
    description: 'Customizes weekly workout routines based on your goals, equipment, and schedule.',
    inputType: 'text',
    run: (input) => runGeminiChatAgent('fitness-planner', input, 'Fitness Planner'),
  },
  'recipe-creator': {
    id: 'recipe-creator',
    name: 'Recipe Creator',
    description: 'Suggests delicious recipes based only on the ingredients you have in your fridge.',
    inputType: 'text',
    run: (input) => runGeminiChatAgent('recipe-creator', input, 'Recipe Creator'),
  },
};

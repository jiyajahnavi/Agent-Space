import { NextRequest, NextResponse } from 'next/server';
import { agentRegistry } from '@/lib/agents/agentRegistry';
import { extractPdfText } from '@/lib/pdfExtract';
import { chatComplete } from '@/lib/huggingface';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const agentId = formData.get('agentId');
    const textInput = (formData.get('input') as string | null) || '';
    const file = formData.get('file') as File | null;
    // Used only for agents that don't have a specialized implementation below —
    // lets any agent listed in the catalog run for real via a generic HF prompt.
    const agentName = (formData.get('agentName') as string | null) || 'AI Agent';
    const agentDescription = (formData.get('agentDescription') as string | null) || '';
    const agentPromptTemplate = (formData.get('agentPromptTemplate') as string | null) || '';

    if (typeof agentId !== 'string' || !agentId) {
      return NextResponse.json({ error: 'Missing agentId.' }, { status: 400 });
    }

    const agent = agentRegistry[agentId];

    let combinedInput = textInput.trim();

    if (file && file.size > 0) {
      if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 });
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large (max 5MB).' }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfText = await extractPdfText(buffer);

      if (!pdfText || pdfText.length < 10) {
        return NextResponse.json(
          { error: 'Could not extract readable text from this PDF. It may be a scanned image — try pasting the text directly instead.' },
          { status: 422 }
        );
      }

      combinedInput = combinedInput
        ? `${pdfText}\n\n--- Additional context from user ---\n${combinedInput}`
        : pdfText;
    }

    if (!combinedInput.trim()) {
      return NextResponse.json({ error: 'Please provide text input or upload a file.' }, { status: 400 });
    }

    if (agent) {
      const result = await agent.run(combinedInput);
      return NextResponse.json({ result });
    }

    // Generic path: any agent in the catalog without a specialized implementation
    // still runs for real, using its own name/description/prompt template as system context.
    const systemPrompt = `You are "${agentName}", an AI agent. Your purpose: ${agentDescription || 'assist the user with their request.'}${
      agentPromptTemplate ? `\n\nYour operating instructions: ${agentPromptTemplate}` : ''
    }\n\nRespond directly and usefully to the user's input below, staying in character as this agent. Format your response with clear structure (headings, bullet points) where it helps readability. Do not mention that you are a generic or simulated agent.`;

    const responseText = await chatComplete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: combinedInput.slice(0, 10000) },
      ],
      { temperature: 0.6, maxTokens: 1600 }
    );

    return NextResponse.json({ result: responseText });
  } catch (error: any) {
    console.error('Agent run failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Agent execution failed. Please try again.' },
      { status: 500 }
    );
  }
}

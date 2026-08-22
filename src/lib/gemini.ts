/**
 * @fileOverview Direct Gemini API integration for AI Agent responses with multi-turn history.
 * Uses GEMINI_API_KEY from environment variables to generate high-quality responses.
 */
import 'server-only';

export interface ChatHistoryItem {
  role: string;
  text: string;
}

export async function generateGeminiResponse(
  systemInstruction: string,
  userPrompt: string,
  history: ChatHistoryItem[] = []
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '';
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  // Official supported Gemini v1beta model names for Google AI Studio keys
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];

  // Build Gemini contents payload with chat history for multi-turn conversational memory
  let contentsPayload: any[] = [];
  if (history && history.length > 0) {
    contentsPayload = history.map(item => ({
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.text }]
    }));
  }

  // Ensure current user prompt is attached
  const lastMsg = contentsPayload[contentsPayload.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || lastMsg.parts?.[0]?.text !== userPrompt) {
    contentsPayload.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });
  }

  let lastErrorMsg = '';

  for (const modelName of models) {
    // Strategy 1: Call with top-level system_instruction
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: contentsPayload,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2500,
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) return text.trim();
      } else {
        const errJson = await response.json().catch(() => ({}));
        lastErrorMsg = errJson?.error?.message || `HTTP ${response.status}`;
      }
    } catch (e: any) {
      lastErrorMsg = e?.message || 'Network error';
    }

    // Strategy 2: Call without system_instruction (embedded system prompt inside contents)
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const fallbackPayload = [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\nUser Request:\n${userPrompt}` }]
        }
      ];
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contentsPayload.length > 1 ? contentsPayload : fallbackPayload,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2500,
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) return text.trim();
      } else {
        const errJson = await response.json().catch(() => ({}));
        lastErrorMsg = errJson?.error?.message || `HTTP ${response.status}`;
      }
    } catch (e: any) {
      lastErrorMsg = e?.message || 'Network error';
    }
  }

  throw new Error(`Gemini API Error: ${lastErrorMsg || 'Unable to connect to Gemini models. Please check your GEMINI_API_KEY.'}`);
}

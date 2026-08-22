/**
 * @fileOverview Server-only client for Hugging Face Inference Providers.
 *
 * Uses the OpenAI-compatible router endpoint (https://router.huggingface.co/v1/chat/completions),
 * which dispatches to whichever backing provider (Novita, Together, Cerebras, etc.) currently
 * serves the requested model fastest. This file must never be imported from a "use client"
 * component — it reads a server-only secret (HUGGINGFACE_API_KEY).
 */
import 'server-only';

const HF_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions';

// A capable, widely-available instruction-tuned model on the router's free tier.
// Falls back to a second model if the first is temporarily unavailable/overloaded.
const PRIMARY_MODEL = 'meta-llama/Llama-3.3-70B-Instruct';
const FALLBACK_MODEL = 'Qwen/Qwen2.5-72B-Instruct';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompleteOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  model?: string;
}

async function callRouter(model: string, messages: ChatMessage[], options: ChatCompleteOptions) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY is not configured on the server.');
  }

  const body: Record<string, any> = {
    model,
    messages,
    temperature: options.temperature ?? 0.4,
    max_tokens: options.maxTokens ?? 1800,
  };

  if (options.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(HF_ROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Hugging Face router error (${response.status}): ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Hugging Face router returned an empty response.');
  }
  return text;
}

/**
 * Sends a chat completion request. Tries the primary model, and if it errors
 * (e.g. temporarily overloaded/unavailable), retries once against the fallback model.
 */
export async function chatComplete(messages: ChatMessage[], options: ChatCompleteOptions = {}): Promise<string> {
  const model = options.model ?? PRIMARY_MODEL;
  try {
    return await callRouter(model, messages, options);
  } catch (err) {
    if (model === PRIMARY_MODEL) {
      console.warn('Primary HF model failed, retrying with fallback model:', err);
      return await callRouter(FALLBACK_MODEL, messages, options);
    }
    throw err;
  }
}

/**
 * Convenience helper for agents that need strict JSON back. Strips markdown code fences
 * defensively (some models wrap JSON in ```json blocks despite instructions) and parses it.
 */
export async function chatCompleteJSON<T = any>(messages: ChatMessage[], options: ChatCompleteOptions = {}): Promise<T> {
  const raw = await chatComplete(messages, { ...options, jsonMode: true });
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    // Some providers ignore response_format; try to salvage the first {...} block.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error('Model did not return valid JSON.');
  }
}

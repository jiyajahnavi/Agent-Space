/**
 * @fileOverview Client-side helper for invoking the /api/agents/run route.
 * Safe to import from "use client" components — contains no secrets.
 */

export interface RunAgentClientParams {
  agentId: string;
  input: string;
  file?: File | null;
  agentName?: string;
  agentDescription?: string;
  agentPromptTemplate?: string;
  history?: any[];
}

export async function runAgentClient({
  agentId,
  input,
  file,
  agentName,
  agentDescription,
  agentPromptTemplate,
  history,
}: RunAgentClientParams): Promise<any> {
  const formData = new FormData();
  formData.append('agentId', agentId);
  formData.append('input', input);
  if (file) formData.append('file', file);
  if (agentName) formData.append('agentName', agentName);
  if (agentDescription) formData.append('agentDescription', agentDescription);
  if (agentPromptTemplate) formData.append('agentPromptTemplate', agentPromptTemplate);
  if (history && history.length > 0) formData.append('history', JSON.stringify(history));

  const res = await fetch('/api/agents/run', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'Agent execution failed. Please try again.');
  }

  return data.result;
}

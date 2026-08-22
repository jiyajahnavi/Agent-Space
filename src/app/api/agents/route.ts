import { NextResponse } from 'next/server';
import { Agent } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'lib', 'custom-agents-data.json');

// In-memory cache for ultra-fast server response
let customAgentsMemoryCache: Agent[] = [];

// Helper to read agents from server disk
function readAgentsFromDisk(): Agent[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading custom agents from disk:', e);
  }
  return [];
}

// Helper to write agents to server disk
function writeAgentsToDisk(agents: Agent[]) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(agents, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing custom agents to disk:', e);
  }
}

// Initialize memory cache from disk
customAgentsMemoryCache = readAgentsFromDisk();

export async function GET() {
  try {
    // 1. Always start with disk/memory cache
    let agents = [...customAgentsMemoryCache];

    // 2. Try fetching from Supabase if table exists
    try {
      const { data, error } = await supabase.from('agents').select('*');
      if (!error && data && data.length > 0) {
        const dbAgents: Agent[] = data.map(item => (item.data ? item.data : item));
        // Merge DB agents into memory cache
        const cacheIds = new Set(agents.map(a => a.id));
        dbAgents.forEach(a => {
          if (a.id && !cacheIds.has(a.id)) {
            agents.push(a);
          }
        });
        customAgentsMemoryCache = agents;
        writeAgentsToDisk(agents);
      }
    } catch (dbErr) {
      // Supabase table might not exist yet, fallback cleanly to disk
    }

    return NextResponse.json({ agents });
  } catch (error) {
    return NextResponse.json({ agents: customAgentsMemoryCache });
  }
}

export async function POST(request: Request) {
  try {
    const newAgent: Agent = await request.json();
    if (!newAgent || !newAgent.id || !newAgent.owner) {
      return NextResponse.json({ error: 'Invalid agent payload' }, { status: 400 });
    }

    // Update server memory & disk
    const existingIndex = customAgentsMemoryCache.findIndex(a => a.id === newAgent.id);
    if (existingIndex >= 0) {
      customAgentsMemoryCache[existingIndex] = newAgent;
    } else {
      customAgentsMemoryCache.push(newAgent);
    }
    writeAgentsToDisk(customAgentsMemoryCache);

    // Try syncing to Supabase DB in background
    try {
      await supabase.from('agents').upsert({
        id: newAgent.id,
        name: newAgent.name,
        owner: newAgent.owner,
        data: newAgent,
        created_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      // Supabase optional sync notice
    }

    return NextResponse.json({ success: true, agent: newAgent, allAgents: customAgentsMemoryCache });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save agent' }, { status: 500 });
  }
}

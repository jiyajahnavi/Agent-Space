"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Agent } from '@/lib/types';
import { MOCK_AGENTS } from '@/lib/data';

interface AgentsContextType {
  agents: Agent[];
  addAgent: (agent: Agent) => void;
  refreshAgents: () => Promise<void>;
}

const AgentsContext = createContext<AgentsContextType | undefined>(undefined);

export function AgentsProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);

  // Helper to merge custom agents with mock agents without duplicates
  const mergeAgents = (customList: Agent[]) => {
    setAgents(prev => {
      const customIds = new Set(customList.map(a => a.id));
      const filteredMocks = MOCK_AGENTS.filter(a => !customIds.has(a.id));
      const map = new Map<string, Agent>();
      
      [...filteredMocks, ...customList].forEach(item => {
        map.set(item.id, item);
      });

      return Array.from(map.values());
    });
  };

  const refreshAgents = async () => {
    try {
      // 1. Fetch from global server API route
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        if (data.agents && Array.isArray(data.agents)) {
          mergeAgents(data.agents);
          localStorage.setItem('agentspace_custom_agents', JSON.stringify(data.agents));
          return;
        }
      }
    } catch (e) {
      console.warn("Global agents API fetch notice:", e);
    }

    // Fallback to local storage if API route unavailable
    const savedAgents = localStorage.getItem('agentspace_custom_agents');
    if (savedAgents) {
      try {
        const parsed = JSON.parse(savedAgents);
        mergeAgents(parsed);
      } catch (e) {
        console.error("Failed to parse custom agents", e);
      }
    }
  };

  useEffect(() => {
    refreshAgents();

    // Listen to real-time BroadcastChannel for cross-tab sync
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('agentspace_sync_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'NEW_AGENT' || event.data?.type === 'REFRESH') {
            refreshAgents();
          }
        };
      }
    } catch (e) {
      // BroadcastChannel optional
    }

    return () => {
      if (channel) channel.close();
    };
  }, []);

  const addAgent = async (agent: Agent) => {
    // 1. Optimistic update in state & localStorage
    setAgents(prev => {
      const customIds = new Set([agent.id]);
      const filteredPrev = prev.filter(a => a.id !== agent.id);
      const updated = [agent, ...filteredPrev];
      
      const customOnly = updated.filter(a => !MOCK_AGENTS.some(m => m.id === a.id));
      localStorage.setItem('agentspace_custom_agents', JSON.stringify(customOnly));
      return updated;
    });

    // 2. Persist globally to server API
    try {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent),
      });
    } catch (e) {
      console.error("Failed to persist agent to server API", e);
    }

    // 3. Notify other tabs via BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('agentspace_sync_channel');
        channel.postMessage({ type: 'NEW_AGENT', agent });
        channel.close();
      }
    } catch (e) {}
  };

  return (
    <AgentsContext.Provider value={{ agents, addAgent, refreshAgents }}>
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgents() {
  const context = useContext(AgentsContext);
  if (context === undefined) {
    throw new Error('useAgents must be used within an AgentsProvider');
  }
  return context;
}

"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bot, User, Star, GitBranch, X, ArrowRight, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAgents } from '@/context/agents-context';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

// Known developers/users in AgentSpace ecosystem
const DEMO_USERS = [
  { username: 'addy', name: 'Aditya Singh', avatar: '', bio: 'Lead AI Engineer at AgentSpace', followers: 248 },
  { username: 'onenonly066', name: 'onenonly066', avatar: '', bio: 'Autonomous AI Developer', followers: 12 },
  { username: 'debug-master', name: 'Debug Master', avatar: '', bio: 'Code Quality & Debugging Specialist', followers: 89 },
  { username: 'hr-guru', name: 'HR Guru', avatar: '', bio: 'Recruitment & Career Agent Creator', followers: 154 },
];

export function GlobalSearch() {
  const router = useRouter();
  const { agents } = useAgents();
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine authenticated user profile, DEMO_USERS, and all creators from agents list
  const allUsers = useMemo(() => {
    const map = new Map<string, { username: string; name: string; avatar: string; bio: string; followers: number }>();

    // Add DEMO_USERS
    DEMO_USERS.forEach(u => {
      map.set(u.username.toLowerCase().replace(/^@/, ''), u);
    });

    // Add current profile if logged in
    if (profile) {
      const cleanProfileUser = profile.username.toLowerCase().replace(/^@/, '');
      map.set(cleanProfileUser, {
        username: profile.username,
        name: profile.fullName || profile.username,
        avatar: profile.avatarUrl || '',
        bio: 'AgentSpace Developer',
        followers: 0,
      });
    }

    // Add all creators from agents array
    agents.forEach(agent => {
      const ownerClean = agent.owner.replace(/^@/, '');
      const ownerKey = ownerClean.toLowerCase();
      if (!map.has(ownerKey)) {
        map.set(ownerKey, {
          username: ownerClean,
          name: ownerClean,
          avatar: agent.ownerAvatar || '',
          bio: 'AgentSpace AI Developer',
          followers: 0,
        });
      }
    });

    return Array.from(map.values());
  }, [profile, agents]);

  // Filter agents and users matching search query
  const searchResults = useMemo(() => {
    if (!query.trim()) return { agents: [], users: [] };
    const q = query.toLowerCase().trim();

    const matchedAgents = agents.filter(agent =>
      agent.name.toLowerCase().includes(q) ||
      agent.description.toLowerCase().includes(q) ||
      agent.owner.toLowerCase().includes(q) ||
      agent.category.toLowerCase().includes(q) ||
      agent.tags.some(t => t.toLowerCase().includes(q))
    ).slice(0, 5);

    const matchedUsers = allUsers.filter(user =>
      user.username.toLowerCase().includes(q) ||
      user.name.toLowerCase().includes(q) ||
      user.bio.toLowerCase().includes(q)
    ).slice(0, 4);

    return { agents: matchedAgents, users: matchedUsers };
  }, [query, agents, allUsers]);

  const hasResults = searchResults.agents.length > 0 || searchResults.users.length > 0;

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectAgent = (agentId: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/agent/${agentId}`);
  };

  const handleSelectUser = (username: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/profile/${username}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs md:max-w-sm">
      {/* Search Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search agents, repos, users..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-8 h-9 text-xs bg-muted/40 border-muted focus-visible:ring-1 focus-visible:ring-primary rounded-full transition-all w-full"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 min-w-[320px] max-h-[480px] overflow-y-auto">
          {hasResults ? (
            <div className="p-2 space-y-3">
              {/* Agents / Repos Section */}
              {searchResults.agents.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                    <span>Agents & Repositories ({searchResults.agents.length})</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {searchResults.agents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => handleSelectAgent(agent.id)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-primary/10 transition-colors flex items-start justify-between group"
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                              {agent.name}
                            </span>
                            <Badge variant="outline" className="text-[9px] py-0 h-4 border-primary/20 text-primary uppercase">
                              {agent.category}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {agent.description}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/80 pt-0.5">
                            <span>by @{agent.owner}</span>
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                              {agent.stars}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Section */}
              {searchResults.users.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span>Developers & Users ({searchResults.users.length})</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {searchResults.users.map((user) => (
                      <button
                        key={user.username}
                        onClick={() => handleSelectUser(user.username)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-primary/10 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-7 w-7 border border-primary/20 shrink-0">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                              {user.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              @{user.username} • {user.followers} followers
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center space-y-2">
              <Search className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-bold">No results found for "{query}"</p>
              <p className="text-[11px] text-muted-foreground">
                Try searching for agent names, categories, or developer handles.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

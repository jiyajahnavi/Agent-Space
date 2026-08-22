"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, GitFork, Play, Share2, Rocket, Clock, Shield, AlertCircle, FileCode, BookOpen, BarChart3, Code2, MessageSquare, Bot, Code, User, Send, CircleDot, GitPullRequest, MessageCircle, ExternalLink, RotateCcw, History, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AgentRunner } from '@/components/agent/AgentRunner';
import { useAgents } from '@/context/agents-context';
import { useAuth } from '@/context/auth-context';
import { toast } from '@/hooks/use-toast';
import { runAgentClient } from '@/lib/runAgentClient';
import { FormattedMarkdown } from '@/components/agent/FormattedMarkdown';
import { Agent } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface ChatSession {
    id: string;
    title: string;
    updatedAt: string;
    messages: { role: 'user' | 'bot', text: string }[];
}

export default function AgentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { profile } = useAuth();
    const { agents, addAgent } = useAgents();
    const agent = (agents && agents.length > 0)
        ? (agents.find(a => a.id === params?.id) || agents[0])
        : null;

    const [isForking, setIsForking] = useState(false);
    const [isStarred, setIsStarred] = useState(false);
    const [starsCount, setStarsCount] = useState(agent?.stars || 0);
    const [forksCount, setForksCount] = useState(agent?.forks || 0);

    // Sync star & fork count from localStorage & agent
    useEffect(() => {
        if (typeof window !== 'undefined' && agent?.id) {
            const starredState = localStorage.getItem(`agentspace_starred_${agent.id}`);
            setIsStarred(starredState === 'true');
            setStarsCount(agent.stars || 0);

            const savedForks = localStorage.getItem(`agentspace_forks_count_${agent.id}`);
            if (savedForks) {
                setForksCount(parseInt(savedForks, 10));
            } else {
                setForksCount(agent.forks || 0);
            }
        }
    }, [agent?.id, agent?.stars, agent?.forks]);

    const handleForkAgent = async () => {
        if (!agent) return;

        setIsForking(true);
        try {
            const currentOwner = profile?.username || profile?.fullName || 'community-developer';
            const ownerAvatar = profile?.avatarUrl || 'https://picsum.photos/seed/user/200/200';
            const uniqueId = `${agent.id}-fork-${Date.now().toString(36)}`;

            const isParentFileInput = agent.inputType === 'file' ||
                agent.id.startsWith('resume-analyzer') ||
                agent.id.startsWith('legal-summarizer') ||
                (agent.name || '').toLowerCase().includes('resume') ||
                (agent.name || '').toLowerCase().includes('legal summarizer');

            const forkedAgent: Agent = {
                ...agent,
                id: uniqueId,
                name: `${agent.name} (Fork)`,
                owner: currentOwner,
                ownerAvatar: ownerAvatar,
                inputType: isParentFileInput ? 'file' : (agent.inputType || 'text'),
                forks: 0,
                stars: 0,
                runs: '0',
                updatedAt: 'Just now',
                description: agent.description ? `Forked from @${agent.owner}/${agent.name}. ${agent.description}` : `Forked from @${agent.owner}/${agent.name}`,
            };

            // 1. Add forked agent to global state & local storage
            await addAgent(forkedAgent);

            // 2. Increment original agent fork count
            const newForkCount = forksCount + 1;
            setForksCount(newForkCount);
            localStorage.setItem(`agentspace_forks_count_${agent.id}`, newForkCount.toString());

            toast({
                title: "Agent Forked Successfully! 🍴",
                description: `Created a copy of "${agent.name}" under @${currentOwner}. Redirecting...`,
            });

            // 3. Navigate to newly created forked agent page
            router.push(`/agent/${uniqueId}`);
        } catch (error: any) {
            toast({
                title: "Forking Failed",
                description: error?.message || "Could not fork agent. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsForking(false);
        }
    };

    const handleToggleStar = () => {
        if (!agent) return;
        const newState = !isStarred;
        setIsStarred(newState);
        localStorage.setItem(`agentspace_starred_${agent.id}`, String(newState));
        const newCount = newState ? starsCount + 1 : Math.max(0, starsCount - 1);
        setStarsCount(newCount);
        toast({
            title: newState ? "Starred Agent ⭐" : "Unstarred Agent",
            description: newState ? `Added "${agent.name}" to your starred list.` : `Removed star from "${agent.name}".`,
        });
    };

    const handleShareAgent = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            toast({
                title: "Link Copied! 🔗",
                description: "Agent URL copied to your clipboard.",
            });
        }
    };

    if (!agent) {
        return (
            <div className="container mx-auto px-4 py-20 text-center space-y-4">
                <h2 className="text-2xl font-bold">Agent Not Found</h2>
                <p className="text-muted-foreground">The requested agent could not be found.</p>
                <Link href="/explore">
                    <Button>Back to Explore</Button>
                </Link>
            </div>
        );
    }

    const [activeTab, setActiveTab] = useState('demo');
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [userInput, setUserInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);

    // 1. Load sessions list and active session on agent change
    useEffect(() => {
        if (typeof window !== 'undefined' && agent?.id) {
            const rawSessions = localStorage.getItem(`agentspace_sessions_${agent.id}`);
            let list: ChatSession[] = [];
            if (rawSessions) {
                try {
                    list = JSON.parse(rawSessions);
                } catch (e) {
                    console.error('Failed to parse sessions history:', e);
                }
            }
            setSessions(list);

            const savedActiveId = localStorage.getItem(`agentspace_active_session_${agent.id}`);
            if (savedActiveId && list.some(s => s.id === savedActiveId)) {
                setActiveSessionId(savedActiveId);
                const activeSession = list.find(s => s.id === savedActiveId);
                if (activeSession) {
                    setChatMessages(activeSession.messages);
                }
            } else if (list.length > 0) {
                setActiveSessionId(list[0].id);
                setChatMessages(list[0].messages);
            } else {
                setActiveSessionId(null);
                setChatMessages([]);
            }
        }
    }, [agent?.id]);

    // 2. Helper to sync session list in localStorage
    const updateSessionsWithMessages = (newMsgs: { role: 'user' | 'bot', text: string }[], targetSessionId?: string) => {
        if (typeof window === 'undefined' || !agent?.id || newMsgs.length === 0) return;

        let currentId = targetSessionId || activeSessionId;
        if (!currentId) {
            currentId = 'session_' + Date.now();
            setActiveSessionId(currentId);
            localStorage.setItem(`agentspace_active_session_${agent.id}`, currentId);
        }

        const firstUserMsg = newMsgs.find(m => m.role === 'user')?.text || 'New Session';
        const sessionTitle = firstUserMsg.length > 45 ? firstUserMsg.slice(0, 45) + '...' : firstUserMsg;
        const now = new Date().toISOString();

        setSessions(prev => {
            const exists = prev.some(s => s.id === currentId);
            let updatedList: ChatSession[];
            if (exists) {
                updatedList = prev.map(s => s.id === currentId ? { ...s, title: sessionTitle, updatedAt: now, messages: newMsgs } : s);
            } else {
                updatedList = [{ id: currentId, title: sessionTitle, updatedAt: now, messages: newMsgs }, ...prev];
            }
            localStorage.setItem(`agentspace_sessions_${agent.id}`, JSON.stringify(updatedList));
            return updatedList;
        });
    };

    const handleClearChat = () => {
        setChatMessages([]);
        setActiveSessionId(null);
        if (typeof window !== 'undefined' && agent?.id) {
            localStorage.removeItem(`agentspace_active_session_${agent.id}`);
        }
    };

    const handleResumeSession = (session: ChatSession) => {
        setActiveSessionId(session.id);
        setChatMessages(session.messages);
        if (typeof window !== 'undefined' && agent?.id) {
            localStorage.setItem(`agentspace_active_session_${agent.id}`, session.id);
        }
        setActiveTab('demo');
    };

    const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedList = sessions.filter(s => s.id !== sessionId);
        setSessions(updatedList);
        if (typeof window !== 'undefined' && agent?.id) {
            localStorage.setItem(`agentspace_sessions_${agent.id}`, JSON.stringify(updatedList));
            if (activeSessionId === sessionId) {
                handleClearChat();
            }
        }
    };

    const handleSendMessage = async () => {
        if (!userInput.trim() || isProcessing) return;
        const promptText = userInput.trim();
        const newMessages = [...chatMessages, { role: 'user', text: promptText } as const];

        let currentSessionId = activeSessionId;
        if (!currentSessionId) {
            currentSessionId = 'session_' + Date.now();
            setActiveSessionId(currentSessionId);
            if (typeof window !== 'undefined' && agent?.id) {
                localStorage.setItem(`agentspace_active_session_${agent.id}`, currentSessionId);
            }
        }

        setChatMessages(newMessages);
        updateSessionsWithMessages(newMessages, currentSessionId);
        setUserInput('');
        setIsProcessing(true);

        try {
            const responseText = await runAgentClient({
                agentId: agent.id,
                input: promptText,
                agentName: agent.name,
                agentDescription: agent.description,
                agentPromptTemplate: agent.promptTemplate,
                history: chatMessages,
            });

            const finalMsgs = [...newMessages, { role: 'bot', text: responseText } as const];
            setChatMessages(finalMsgs);
            updateSessionsWithMessages(finalMsgs, currentSessionId);
        } catch (error: any) {
            const errMsgs = [
                ...newMessages,
                { role: 'bot', text: error?.message || 'Agent execution failed. Please try again.' } as const
            ];
            setChatMessages(errMsgs);
            updateSessionsWithMessages(errMsgs, currentSessionId);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="bg-card/30 border-b pt-10 pb-6">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                                    <Rocket className="h-3 w-3" />
                                    v1.0.0
                                </Badge>
                                {agent.tags?.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>

                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                                    {agent.name}
                                </h1>
                                <p className="text-muted-foreground mt-2 max-w-2xl text-base">
                                    {agent.description}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                                <div className="flex items-center gap-1.5">
                                    <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                                            {(agent as any).author?.[0]?.toUpperCase() || 'A'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>Created by <strong className="text-foreground">{(agent as any).author || 'Community'}</strong></span>
                                </div>
                                <Separator orientation="vertical" className="h-3" />
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-primary" />
                                    <span>{agent.updatedAt || 'Recently updated'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {agent.githubUrl && (
                                <a href={agent.githubUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="default" size="sm" className="h-9 gap-2 bg-slate-900 hover:bg-black text-white border border-slate-700 shadow-sm">
                                        <ExternalLink className="h-4 w-4" />
                                        View on GitHub
                                    </Button>
                                </a>
                            )}
                            <Button
                                variant={isStarred ? "default" : "outline"}
                                size="sm"
                                className={cn("h-9 gap-2", isStarred && "bg-amber-500 hover:bg-amber-600 text-white border-amber-500")}
                                onClick={handleToggleStar}
                            >
                                <Star className={cn("h-4 w-4", isStarred && "fill-current")} />
                                {isStarred ? "Starred" : "Star"} ({starsCount})
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handleShareAgent}>
                                <Share2 className="h-4 w-4" />
                                Share
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-2 border-primary/30 text-primary hover:bg-primary/10"
                                onClick={handleForkAgent}
                                disabled={isForking}
                            >
                                <GitFork className={cn("h-4 w-4", isForking && "animate-spin")} />
                                {isForking ? "Forking..." : "Fork"} ({forksCount})
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3 space-y-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-12 p-0 mb-6 gap-6 overflow-x-auto">
                                <TabsTrigger value="demo" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 gap-2">
                                    <Play className="h-4 w-4" />
                                    Live Demo
                                </TabsTrigger>
                                <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 gap-2">
                                    <History className="h-4 w-4" />
                                    History
                                    {sessions.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 bg-primary/20 text-primary px-1.5 h-4 text-[10px] font-bold">
                                            {sessions.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="readme" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    README
                                </TabsTrigger>
                                <TabsTrigger value="issues" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 gap-2">
                                    <CircleDot className="h-4 w-4" />
                                    Issues
                                    {agent.issues && agent.issues.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 bg-muted px-1.5 h-4 text-[10px]">{agent.issues.filter(i => i.status === 'open').length}</Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="pulls" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 gap-2">
                                    <GitPullRequest className="h-4 w-4" />
                                    Pull Requests
                                    {agent.pullRequests && agent.pullRequests.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 bg-muted px-1.5 h-4 text-[10px]">{agent.pullRequests.filter(p => p.status === 'open').length}</Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="code" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 gap-2">
                                    <FileCode className="h-4 w-4" />
                                    Config
                                </TabsTrigger>
                                <TabsTrigger value="usage" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 gap-2">
                                    <Code2 className="h-4 w-4" />
                                    SDK
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="demo" className="mt-0 space-y-4">
                                {agent.type === 'chat' && (
                                    <Card className="flex flex-col h-[500px] border-muted">
                                        <CardHeader className="border-b py-3 px-6 bg-muted/20 flex flex-row items-center justify-between">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4 text-primary" />
                                                Chat Interface
                                            </CardTitle>
                                            {chatMessages.length > 0 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleClearChat}
                                                    className="h-7 text-xs gap-1.5 border-muted text-muted-foreground hover:text-foreground"
                                                    title="Start fresh new chat session"
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                    New Chat
                                                </Button>
                                            )}
                                        </CardHeader>
                                        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                                            <div className="flex gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                    <Bot className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="bg-muted/50 rounded-2xl rounded-tl-none p-3 text-sm max-w-[80%]">
                                                    Hello! I'm the <strong>{agent.name}</strong>. How can I help you today?
                                                </div>
                                            </div>

                                            {chatMessages.map((msg, index) => (
                                                <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                                    {msg.role === 'bot' && (
                                                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                            <Bot className="h-4 w-4 text-primary" />
                                                        </div>
                                                    )}
                                                    <div className={`p-3 text-sm max-w-[80%] rounded-2xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted/50 rounded-tl-none'}`}>
                                                        {msg.role === 'bot' ? (
                                                            <FormattedMarkdown content={msg.text} />
                                                        ) : (
                                                            msg.text
                                                        )}
                                                    </div>
                                                    {msg.role === 'user' && (
                                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {isProcessing && (
                                                <div className="flex gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                        <Bot className="h-4 w-4 text-primary animate-pulse" />
                                                    </div>
                                                    <div className="bg-muted/50 rounded-2xl rounded-tl-none p-3 text-sm max-w-[80%] flex items-center gap-2 text-muted-foreground">
                                                        <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                                                        Agent is generating response...
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="border-t p-4">
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }}
                                                className="flex w-full items-center gap-2"
                                            >
                                                <Input
                                                    placeholder={`Message ${agent.name}...`}
                                                    value={userInput}
                                                    onChange={(e) => setUserInput(e.target.value)}
                                                    disabled={isProcessing}
                                                    className="flex-1 bg-muted/20 border-muted focus-visible:ring-primary/30"
                                                />
                                                <Button type="submit" size="icon" disabled={isProcessing || !userInput.trim()}>
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </CardFooter>
                                    </Card>
                                )}

                                {agent.type !== 'chat' && (
                                    <AgentRunner agentId={agent.id} />
                                )}
                            </TabsContent>

                            <TabsContent value="history" className="mt-0 space-y-4">
                                <Card className="border-muted">
                                    <CardHeader className="border-b py-4 px-6 bg-muted/20 flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                                <History className="h-5 w-5 text-primary" />
                                                Agent Session & Execution History
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                All previous prompts and responses with <strong>{agent.name}</strong> are saved here. Click "Resume Chat" to continue any session.
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                handleClearChat();
                                                setActiveTab('demo');
                                            }}
                                            className="gap-2 bg-primary hover:bg-primary/90 text-xs"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Start New Session
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {sessions.length === 0 ? (
                                            <div className="text-center py-12 space-y-3">
                                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground/50">
                                                    <Clock className="h-6 w-6" />
                                                </div>
                                                <h3 className="text-sm font-semibold">No session history yet</h3>
                                                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                                    Start interacting with this agent in the Live Demo tab to save your prompts and responses automatically.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {sessions.map((session) => {
                                                    const isCurrentActive = session.id === activeSessionId;
                                                    const lastMsg = session.messages[session.messages.length - 1];
                                                    return (
                                                        <div
                                                            key={session.id}
                                                            onClick={() => handleResumeSession(session)}
                                                            className={`group p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                                                                isCurrentActive
                                                                    ? 'border-primary/50 bg-primary/5 shadow-sm'
                                                                    : 'border-muted/60 hover:border-primary/30 hover:bg-muted/10'
                                                            }`}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                                                            {session.title || 'Untitled Session'}
                                                                        </h4>
                                                                        {isCurrentActive && (
                                                                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] h-4 px-1.5 font-bold">Active</Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                                                        <Clock className="h-3 w-3" />
                                                                        {new Date(session.updatedAt).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={(e) => handleDeleteSession(session.id, e)}
                                                                    title="Delete session"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>

                                                            <div className="bg-muted/30 rounded-lg p-2.5 text-xs text-muted-foreground line-clamp-2 font-mono">
                                                                {lastMsg?.text || 'No messages'}
                                                            </div>

                                                            <div className="flex items-center justify-between pt-1 text-xs">
                                                                <span className="text-muted-foreground font-medium flex items-center gap-1">
                                                                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                                                                    {session.messages.length} messages
                                                                </span>
                                                                <span className="text-primary font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                                                    Resume Chat <ArrowRight className="h-3.5 w-3.5" />
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="readme" className="mt-0">
                                <Card className="p-6 space-y-4">
                                    <h3 className="text-lg font-bold">About {agent.name}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        {agent.description}
                                    </p>
                                    <div className="pt-4 border-t space-y-2">
                                        <h4 className="text-sm font-semibold">Capabilities</h4>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                            <li>Autonomous task execution</li>
                                            <li>Context-aware response generation</li>
                                            <li>Real-time prompt processing</li>
                                        </ul>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="issues" className="mt-0">
                                <Card className="p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-bold">Issues</h3>
                                        <Button size="sm">New Issue</Button>
                                    </div>
                                    {agent.issues && agent.issues.length > 0 ? (
                                        <div className="space-y-2">
                                            {agent.issues.map((issue) => (
                                                <div key={issue.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium">{issue.title}</p>
                                                        <p className="text-xs text-muted-foreground">Opened by {issue.author}</p>
                                                    </div>
                                                    <Badge variant={issue.status === 'open' ? 'default' : 'secondary'}>
                                                        {issue.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">No open issues reported yet.</p>
                                    )}
                                </Card>
                            </TabsContent>

                            <TabsContent value="pulls" className="mt-0">
                                <Card className="p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-bold">Pull Requests</h3>
                                        <Button size="sm">New Pull Request</Button>
                                    </div>
                                    {agent.pullRequests && agent.pullRequests.length > 0 ? (
                                        <div className="space-y-2">
                                            {agent.pullRequests.map((pr) => (
                                                <div key={pr.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium">{pr.title}</p>
                                                        <p className="text-xs text-muted-foreground">Opened by {pr.author}</p>
                                                    </div>
                                                    <Badge variant={pr.status === 'open' ? 'default' : 'secondary'}>
                                                        {pr.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">No active pull requests.</p>
                                    )}
                                </Card>
                            </TabsContent>

                            <TabsContent value="code" className="mt-0">
                                <Card className="p-6">
                                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                                        <code>{JSON.stringify(agent, null, 2)}</code>
                                    </pre>
                                </Card>
                            </TabsContent>

                            <TabsContent value="usage" className="mt-0">
                                <Card className="p-6 space-y-4">
                                    <h3 className="text-lg font-bold">Integration SDK</h3>
                                    <p className="text-sm text-muted-foreground">Use this agent programmatically in your projects.</p>
                                    <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto">
                                        {`import { AgentSpace } from '@agentspace/sdk';

const agent = new AgentSpace.Agent('${agent.id}');
const response = await agent.run({ input: 'Your prompt here' });
console.log(response);`}
                                    </pre>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="space-y-6">
                        <Card className="p-6 space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Agent Stats</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Star className="h-4 w-4" /> Stars
                                    </span>
                                    <span className="font-bold">{starsCount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <GitFork className="h-4 w-4" /> Forks
                                    </span>
                                    <span className="font-bold">{forksCount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" /> Runs
                                    </span>
                                    <span className="font-bold">{(agent as any).runsCount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Shield className="h-4 w-4" /> License
                                    </span>
                                    <span className="font-bold">{(agent as any).license || 'MIT'}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

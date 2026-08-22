"use client";

import { useState } from 'react';
import { Sparkles, Globe, Lock, Plus, Shield, Loader2, GitBranch, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { generateAgentConfiguration } from '@/ai/flows/generate-agent-configuration-flow';
import { toast } from '@/hooks/use-toast';
import { useAgents } from '@/context/agents-context';
import { useAuth } from '@/context/auth-context';
import { createGithubRepoForAgent } from '@/lib/github-sync';
import { Agent } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';

export default function CreateAgentPage() {
    return (
        <AuthGuard
            title="Authentication Required to Create Agents"
            description="Sign in with your Google or GitHub account to build, configure, and synchronize custom AI agents."
        >
            <CreateAgentContent />
        </AuthGuard>
    );
}

function CreateAgentContent() {
    const router = useRouter();
    const { addAgent } = useAgents();
    const { profile } = useAuth();

    const [description, setDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [promptTemplate, setPromptTemplate] = useState('');
    const [repoName, setRepoName] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    const [syncGithub, setSyncGithub] = useState(true);

    const currentUser = profile?.username || 'developer';
    const isGithubConnected = profile?.provider === 'github' || !!profile?.providerToken;

    async function handleAutoGenerate() {
        if (!description) {
            toast({ title: "Error", description: "Please describe your agent first.", variant: "destructive" });
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateAgentConfiguration({ description });
            setPromptTemplate(result.promptTemplate);

            const nameMatch = result.agentConfig.match(/name: (.*)/);
            if (nameMatch) setRepoName(nameMatch[1].toLowerCase().replace(/\s+/g, '-'));

            toast({ title: "Success", description: "Agent configuration generated successfully!" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to generate configuration.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    }

    async function handleCreate() {
        if (!repoName.trim()) {
            toast({
                title: "Repository Name Required",
                description: "Please provide a name for your agent repository.",
                variant: "destructive"
            });
            return;
        }

        setIsCreating(true);

        try {
            let githubUrl: string | undefined;

            if (syncGithub) {
                const ghResult = await createGithubRepoForAgent({
                    repoName: repoName.trim(),
                    description: description.trim(),
                    visibility,
                    promptTemplate,
                    providerToken: profile?.providerToken,
                    ownerUsername: currentUser,
                });

                if (ghResult.success && ghResult.htmlUrl) {
                    githubUrl = ghResult.htmlUrl;
                }
            }

            const newAgent: Agent = {
                id: repoName.toLowerCase().replace(/[^a-z0-9-_]/g, '-') + '-' + Math.random().toString(36).substring(7),
                name: repoName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                owner: currentUser,
                ownerAvatar: profile?.avatarUrl,
                description: description || `AI Agent for ${repoName}`,
                tags: ['Custom', 'Autonomous'],
                type: 'input-output',
                rating: 5.0,
                runs: '0',
                stars: 1,
                forks: 0,
                issuesCount: 0,
                pullRequestsCount: 0,
                category: 'General',
                updatedAt: 'Just now',
                githubUrl: githubUrl || `https://github.com/${currentUser}/${repoName}`,
                readme: `# ${repoName}\n\n${description || "No description provided."}\n\n## Prompt Template\n\`\`\`\n${promptTemplate || "System: You are an autonomous AI agent."}\n\`\`\``,
                promptTemplate: promptTemplate || "System: You are an autonomous AI agent.",
                configYaml: `name: ${repoName}\ntype: interactive\nowner: ${currentUser}`,
                metadataJson: `{"version": "1.0.0", "syncedWithGithub": true}`,
                usageCode: `// Example usage\nimport { runAgent } from './index';\n\nconst response = await runAgent({ input: "your task" });`,
            };

            addAgent(newAgent);

            toast({
                title: "Agent Repository Created!",
                description: githubUrl 
                  ? `AgentSpace & GitHub repository synced at ${githubUrl}` 
                  : `Successfully created ${newAgent.name}.`,
            });

            router.push(`/agent/${newAgent.id}`);
        } catch (error) {
            toast({
                title: "Creation Failed",
                description: "An error occurred while creating your repository.",
                variant: "destructive"
            });
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="space-y-2 mb-10">
                <h1 className="text-3xl font-headline font-bold">Create a New Agent</h1>
                <p className="text-muted-foreground">Build, configure, and automatically synchronize your agent repository with GitHub.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <section className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="owner">Owner</Label>
                                <div className="flex items-center gap-2 p-2 bg-muted/60 border border-border/80 rounded-xl text-sm font-medium">
                                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                        {currentUser.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="truncate">{currentUser}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="repo-name">Repository name</Label>
                                <Input
                                    id="repo-name"
                                    placeholder="my-awesome-agent"
                                    value={repoName}
                                    onChange={(e) => setRepoName(e.target.value)}
                                    className="h-10 bg-background/50 border-border focus:border-primary rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                            <Input
                                id="description"
                                placeholder="Briefly describe what your agent does..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="h-10 bg-background/50 border-border focus:border-primary rounded-xl"
                            />
                        </div>

                        {/* GitHub Sync Status Card */}
                        <div className="p-4 rounded-xl border border-primary/25 bg-primary/5 flex items-start gap-3">
                            <GitBranch className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-1 flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold flex items-center gap-1.5">
                                        GitHub Automatic Repository Sync
                                        {isGithubConnected && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-500 font-semibold border border-emerald-500/30">
                                                GitHub Authenticated
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    When enabled, AgentSpace will automatically create a new repository on GitHub and commit your agent scaffolding files (`README.md`, `agent.json`, `index.ts`).
                                </p>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox
                                        id="sync-gh"
                                        checked={syncGithub}
                                        onCheckedChange={(c) => setSyncGithub(!!c)}
                                    />
                                    <Label htmlFor="sync-gh" className="text-xs font-medium cursor-pointer">
                                        Sync and create GitHub repository for this agent
                                    </Label>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <Label>Visibility</Label>
                            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as 'public' | 'private')} className="grid gap-4">
                                <div
                                    className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${visibility === 'public' ? 'bg-primary/5 border-primary/40' : 'hover:bg-muted/30 border-border/80'}`}
                                    onClick={() => setVisibility('public')}
                                >
                                    <RadioGroupItem value="public" id="public" className="mt-1" />
                                    <Label htmlFor="public" className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-2 font-bold mb-1">
                                            <Globe className="h-4 w-4 text-primary" />
                                            Public Repository
                                        </div>
                                        <p className="text-xs font-normal text-muted-foreground">Anyone on AgentSpace and GitHub can view and use this agent.</p>
                                    </Label>
                                </div>
                                <div
                                    className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${visibility === 'private' ? 'bg-primary/5 border-primary/40' : 'hover:bg-muted/30 border-border/80'}`}
                                    onClick={() => setVisibility('private')}
                                >
                                    <RadioGroupItem value="private" id="private" className="mt-1" />
                                    <Label htmlFor="private" className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-2 font-bold mb-1">
                                            <Lock className="h-4 w-4 text-amber-500" />
                                            Private Repository
                                        </div>
                                        <p className="text-xs font-normal text-muted-foreground">Only authorized collaborators can view and commit to this agent.</p>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-4 pt-2">
                            <Label htmlFor="prompt">Prompt Template</Label>
                            <Textarea
                                id="prompt"
                                placeholder="The master system prompt and instructions for your agent..."
                                className="min-h-[180px] font-mono text-xs bg-background/50 border-border focus:border-primary rounded-xl"
                                value={promptTemplate}
                                onChange={(e) => setPromptTemplate(e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground italic">Tip: Use {"{{variable}}"} syntax for dynamic user inputs.</p>
                        </div>

                        <div className="pt-4">
                            <Button
                                size="lg"
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold w-full sm:w-auto px-8 gap-2 rounded-xl shadow-md"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Syncing with GitHub & AgentSpace...
                                    </>
                                ) : (
                                    <>
                                        Create & Sync Agent
                                        <GitBranch className="h-4 w-4 ml-1" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <Card className="border-primary/20 bg-primary/5 rounded-2xl shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                AI Scaffolding Generator
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Describe your agent concept, and let AI generate the prompt and repo configuration.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="ai-desc" className="text-xs">Agent Purpose</Label>
                                <Textarea
                                    id="ai-desc"
                                    placeholder="e.g. An agent that analyzes Github PRs and generates automated code reviews."
                                    className="bg-background/80 text-xs min-h-[90px] rounded-xl"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleAutoGenerate}
                                className="w-full bg-primary hover:bg-primary/90 text-xs font-medium gap-2 rounded-xl"
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        Auto-Generate Configuration
                                        <Sparkles className="h-3 w-3" />
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80 rounded-2xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Shield className="h-4 w-4 text-emerald-500" />
                                GitHub Sync Benefits
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs text-muted-foreground">
                            <div className="flex gap-2">
                                <Plus className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                                <p>Automatic repo creation under your GitHub account.</p>
                            </div>
                            <div className="flex gap-2">
                                <Plus className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                                <p>Commits initial <code className="text-foreground">README.md</code>, <code className="text-foreground">agent.json</code>, and <code className="text-foreground">index.ts</code> code.</p>
                            </div>
                            <div className="flex gap-2">
                                <Plus className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                                <p>Seamless version control and collaboration on AgentSpace.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

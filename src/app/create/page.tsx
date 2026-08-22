"use client";

import { useState, useRef } from 'react';
import { Sparkles, Globe, Lock, Plus, Shield, Loader2, GitBranch, ExternalLink, FileCode, UploadCloud, X, FileText, CheckCircle2, Code } from 'lucide-react';
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
    const [agentCode, setAgentCode] = useState('');
    const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
    const [repoName, setRepoName] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    const [syncGithub, setSyncGithub] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentUser = profile?.username || 'developer';
    const isGithubConnected = profile?.provider === 'github' || !!profile?.providerToken;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "File Too Large", description: "Please upload a file smaller than 5MB.", variant: "destructive" });
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setAgentCode(content || '');
            setUploadedFile({ name: file.name, size: file.size });
            toast({ title: "Code File Loaded", description: `Successfully loaded code from ${file.name}` });
        };
        reader.onerror = () => {
            toast({ title: "Error", description: "Failed to read code file.", variant: "destructive" });
        };
        reader.readAsText(file);
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
        setAgentCode('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    async function handleAutoGenerate() {
        if (!description) {
            toast({ title: "Error", description: "Please describe your agent first.", variant: "destructive" });
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateAgentConfiguration({ description });
            setAgentCode(result.promptTemplate);

            const nameMatch = result.agentConfig.match(/name: (.*)/);
            if (nameMatch) setRepoName(nameMatch[1].toLowerCase().replace(/\s+/g, '-'));

            toast({ title: "Success", description: "Agent code scaffolding generated!" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to generate code.", variant: "destructive" });
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

        if (!agentCode.trim()) {
            toast({
                title: "Agent Code Required",
                description: "Please upload a code file or paste your agent code.",
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
                    promptTemplate: agentCode,
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
                tags: ['Custom', 'Uploaded Code'],
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
                readme: `# ${repoName}\n\n${description || "No description provided."}\n\n## Agent Source Code (${uploadedFile?.name || 'index.ts'})\n\`\`\`ts\n${agentCode}\n\`\`\``,
                promptTemplate: agentCode,
                configYaml: `name: ${repoName}\ntype: code-agent\nowner: ${currentUser}`,
                metadataJson: `{"version": "1.0.0", "syncedWithGithub": true, "filename": "${uploadedFile?.name || 'index.ts'}"}`,
                usageCode: agentCode,
            };

            addAgent(newAgent);

            toast({
                title: "Agent Created!",
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
                <h1 className="text-3xl font-headline font-bold flex items-center gap-3">
                    <Code className="h-8 w-8 text-primary" />
                    Create a New Agent
                </h1>
                <p className="text-muted-foreground">Upload your agent code file, configure repository settings, and automatically sync with GitHub.</p>
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
                                    When enabled, AgentSpace will automatically create a new repository on GitHub and commit your uploaded agent code files (`index.ts`, `agent.json`, `README.md`).
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

                        {/* File Upload Section replacing Prompt Template */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <FileCode className="h-4 w-4 text-primary" />
                                    Upload Agent Code
                                </Label>
                                <span className="text-xs text-muted-foreground">Supports .ts, .js, .py, .json, .txt, .md</span>
                            </div>

                            {!uploadedFile ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-muted hover:border-primary/50 bg-background/50 hover:bg-primary/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
                                >
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <UploadCloud className="h-6 w-6" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-bold text-foreground">Click to upload your agent code file</p>
                                        <p className="text-xs text-muted-foreground">or drag and drop your script file here (max 5MB)</p>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".ts,.js,.py,.json,.txt,.md,.sh"
                                        onChange={handleFileUpload}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/30 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                                {uploadedFile.name}
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB — Code file attached and ready</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleRemoveFile}
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        title="Remove file"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
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
                                        Create & Sync Agent Code
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
                                AI Code Generator
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Describe your agent concept, and let AI generate the initial agent code.
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
                                        Generating Code...
                                    </>
                                ) : (
                                    <>
                                        Auto-Generate Agent Code
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
                                Code & GitHub Sync Benefits
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs text-muted-foreground">
                            <div className="flex gap-2">
                                <Plus className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                                <p>Upload custom code scripts directly into AgentSpace.</p>
                            </div>
                            <div className="flex gap-2">
                                <Plus className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                                <p>Commits your code file directly to GitHub as <code className="text-foreground">index.ts</code>.</p>
                            </div>
                            <div className="flex gap-2">
                                <Plus className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                                <p>Full version control and instant repository deployment.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

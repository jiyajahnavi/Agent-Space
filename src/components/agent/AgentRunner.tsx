/**
 * @fileOverview Orchestrates the agent execution flow: input capture, calling the
 * server-side /api/agents/run route (which talks to Hugging Face or Gemini), and rendering output.
 * Features persistent input/output memory across page refreshes and navigation.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Play, Terminal, Sparkles, Loader2, FileUp, FileText, X, RotateCcw } from 'lucide-react';
import { OutputDisplay } from './OutputDisplay';
import { runAgentClient } from '@/lib/runAgentClient';
import { toast } from '@/hooks/use-toast';
import { useAgents } from '@/context/agents-context';

interface AgentRunnerProps {
    agentId: string;
}

// Agents whose input is a document (PDF upload with optional extra text context).
const FILE_INPUT_AGENTS = new Set(['resume-analyzer', 'resume-analyzer-devraj', 'legal-summarizer']);

export function AgentRunner({ agentId }: AgentRunnerProps) {
    const { agents } = useAgents();
    const agentMeta = agents.find(a => a.id === agentId);

    const [input, setInput] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [output, setOutput] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isFileInput = FILE_INPUT_AGENTS.has(agentId);

    // Persistent storage: Load saved input/output from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && agentId) {
            const saved = localStorage.getItem(`agentspace_runner_${agentId}`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.input) setInput(parsed.input);
                    if (parsed.output) setOutput(parsed.output);
                } catch (e) {
                    console.error('Failed to parse saved runner state:', e);
                }
            }
        }
    }, [agentId]);

    // Save input/output to localStorage whenever they update
    useEffect(() => {
        if (typeof window !== 'undefined' && agentId) {
            if (input || output) {
                localStorage.setItem(`agentspace_runner_${agentId}`, JSON.stringify({ input, output }));
            }
        }
    }, [input, output, agentId]);

    const handleClear = () => {
        setInput('');
        setFile(null);
        setOutput(null);
        if (typeof window !== 'undefined' && agentId) {
            localStorage.removeItem(`agentspace_runner_${agentId}`);
        }
    };

    const handleRun = async () => {
        if (!isFileInput && !input.trim()) {
            toast({ title: "Input Required", description: "Please provide input for the agent.", variant: "destructive" });
            return;
        }

        if (isFileInput && !file && !input.trim()) {
            toast({ title: "File Required", description: "Please upload a document or provide text content.", variant: "destructive" });
            return;
        }

        setIsProcessing(true);
        setOutput(null);

        try {
            const result = await runAgentClient({
                agentId,
                input,
                file,
                agentName: agentMeta?.name,
                agentDescription: agentMeta?.description,
                agentPromptTemplate: agentMeta?.promptTemplate,
            });
            setOutput(result);

            // Save execution run to history sessions
            if (typeof window !== 'undefined' && agentId) {
                const rawSessions = localStorage.getItem(`agentspace_sessions_${agentId}`);
                let list: any[] = [];
                if (rawSessions) {
                    try { list = JSON.parse(rawSessions); } catch (e) { list = []; }
                }
                const executionSession = {
                    id: 'session_' + Date.now(),
                    title: (input || (file ? file.name : 'Agent Execution')).slice(0, 45),
                    updatedAt: new Date().toISOString(),
                    messages: [
                        { role: 'user', text: input || (file ? `File uploaded: ${file.name}` : 'Run Execution') },
                        { role: 'bot', text: typeof result === 'string' ? result : JSON.stringify(result) }
                    ]
                };
                list = [executionSession, ...list];
                localStorage.setItem(`agentspace_sessions_${agentId}`, JSON.stringify(list));
            }
        } catch (error: any) {
            toast({ title: "Execution Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                toast({ title: "Invalid File", description: "Please upload a PDF document.", variant: "destructive" });
                return;
            }
            setFile(selectedFile);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[500px]">
            <Card className="flex flex-col border-muted">
                <CardHeader className="border-b py-3 px-6 bg-muted/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        Execution Console
                    </CardTitle>
                    {(input || output || file) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                            title="Clear memory and start fresh"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Start Fresh
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="flex-1 p-6 space-y-6">
                    {isFileInput ? (
                        <div className="space-y-4">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Upload Document (PDF)</Label>
                            {!file ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all group"
                                >
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <FileUp className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                        <p className="text-xs text-muted-foreground mt-1">PDF format only (Max 5MB)</p>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setFile(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Additional Context (Optional)</Label>
                                <Textarea
                                    placeholder="Paste specific job requirements or notes..."
                                    className="min-h-[100px] resize-none bg-muted/10 border-muted focus-visible:ring-primary/30"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Input Data</Label>
                            <Textarea
                                placeholder="Enter text to process..."
                                className="min-h-[200px] resize-none bg-muted/10 border-muted focus-visible:ring-primary/30"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/20 rounded-lg px-3 py-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                        Powered by AI Agent execution engine. Runs server-side.
                    </div>
                </CardContent>
                <CardFooter className="border-t p-4 flex justify-end">
                    <Button onClick={handleRun} disabled={isProcessing} className="gap-2 bg-primary hover:bg-primary/90">
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Play className="h-3.5 w-3.5" />
                                Run Agent
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            <Card className="flex flex-col border-muted bg-muted/5 overflow-hidden">
                <CardHeader className="border-b py-3 px-6 bg-muted/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Result Output
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-6 overflow-y-auto">
                    {output ? (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <OutputDisplay output={output} />
                        </div>
                    ) : isProcessing ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground/60 py-12 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm">Running inference on server...</p>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground/40 py-12">
                            <Terminal className="h-12 w-12 mb-4 opacity-20" />
                            <p className="text-sm">Agent output will appear here after execution</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
    return <label className={`text-sm font-medium leading-none ${className}`}>{children}</label>;
}

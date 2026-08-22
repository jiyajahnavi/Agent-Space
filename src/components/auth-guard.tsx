"use client";

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, LogIn, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface AuthGuardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AuthGuard({
  children,
  title = "Authentication Required",
  description = "Please sign in with Google or GitHub to explore AI agents, execute battles, and build custom workflows."
}: AuthGuardProps) {
  const { profile, loading, signInWithGoogle, signInWithGithub } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center space-y-4 text-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Verifying authentication status...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-xl">
        <Card className="border-primary/30 bg-card/60 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden text-center">
          <div className="bg-primary/10 py-6 border-b border-primary/20 flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
              <Lock className="h-8 w-8" />
            </div>
          </div>

          <CardHeader className="pt-6 pb-2 space-y-2">
            <Badge variant="outline" className="w-fit mx-auto border-primary/30 text-primary uppercase text-[10px] tracking-wider px-3">
              Protected Page
            </Badge>
            <CardTitle className="text-2xl font-headline font-bold">{title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4 pb-8 px-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => signInWithGoogle()}
                className="bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-semibold gap-2 h-11 px-6 rounded-xl shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Sign In with Google
              </Button>

              <Button
                onClick={() => signInWithGithub()}
                className="bg-slate-900 hover:bg-black text-white font-semibold gap-2 h-11 px-6 rounded-xl shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Sign In with GitHub
              </Button>
            </div>

            <div className="pt-2">
              <Link href="/auth">
                <Button variant="link" className="text-xs text-muted-foreground gap-1">
                  <LogIn className="h-3.5 w-3.5" />
                  Go to Auth / Login Page
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`}>
      {children}
    </span>
  );
}

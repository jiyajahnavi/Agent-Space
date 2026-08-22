"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2.5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-5 h-5 mr-2.5 fill-current" viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';

  const { profile, signInWithGoogle, signInWithGithub, signInWithEmail, signUpWithEmail } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab as 'login' | 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Redirect if already logged in
  useEffect(() => {
    if (profile) {
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    }
  }, [profile, router, searchParams]);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      const { error, redirected } = await signInWithGoogle();
      if (error) {
        setErrorMsg(error.message);
        toast({
          title: "Authentication failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (!redirected) {
        toast({
          title: "Welcome to AgentSpace!",
          description: "Successfully authenticated with Google.",
        });
        const redirect = searchParams.get('redirect') || '/';
        router.push(redirect);
      }
    } catch (err: any) {
      setErrorMsg("An unexpected error occurred during Google Sign-In.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setErrorMsg(null);
    setIsGithubLoading(true);
    try {
      const { error, redirected } = await signInWithGithub();
      if (error) {
        setErrorMsg(error.message);
        toast({
          title: "Authentication failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (!redirected) {
        toast({
          title: "Welcome to AgentSpace!",
          description: "Successfully authenticated with GitHub.",
        });
        const redirect = searchParams.get('redirect') || '/';
        router.push(redirect);
      }
    } catch (err: any) {
      setErrorMsg("An unexpected error occurred during GitHub Sign-In.");
    } finally {
      setIsGithubLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginEmail || !loginPassword) {
      setErrorMsg("Please fill in both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signInWithEmail(loginEmail, loginPassword);
      if (error) {
        setErrorMsg(error.message);
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        const redirect = searchParams.get('redirect') || '/';
        router.push(redirect);
      }
    } catch (err: any) {
      setErrorMsg("Failed to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!signupName || !signupEmail || !signupPassword) {
      setErrorMsg("Please complete all required fields.");
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setErrorMsg("You must accept the Terms of Service to create an account.");
      return;
    }

    setIsSubmitting(true);
    try {
      const usernameClean = signupUsername.trim() || signupEmail.split('@')[0];
      const { error } = await signUpWithEmail(signupEmail, signupPassword, signupName, usernameClean);
      if (error) {
        setErrorMsg(error.message);
        toast({
          title: "Registration error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Created!",
          description: "Welcome to AgentSpace ecosystem.",
        });
        const redirect = searchParams.get('redirect') || '/';
        router.push(redirect);
      }
    } catch (err: any) {
      setErrorMsg("Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 py-12 relative overflow-hidden bg-dot-grid">
      {/* Dynamic Background Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to AgentSpace
        </Link>

        {/* Main Card */}
        <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-primary" />

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/15 text-primary mb-3 border border-primary/20">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-headline font-bold tracking-tight">
              {activeTab === 'login' ? 'Welcome to AgentSpace' : 'Create your account'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'login'
                ? 'Sign in to access your custom AI agents & deployments'
                : 'Join the ecosystem for autonomous AI agent developers'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-6 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm flex items-start gap-2.5 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Single Page Tab Selector */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'login' | 'signup'); setErrorMsg(null); }} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6 bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg font-medium text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
                Log In
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg font-medium text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Social OAuth Buttons (Google & GitHub) */}
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 bg-background hover:bg-muted/60 border-border text-foreground font-medium rounded-xl transition-all shadow-sm flex items-center justify-center"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isGithubLoading || isSubmitting}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <GoogleIcon />
                      <span className="text-xs sm:text-sm font-semibold">Google</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 bg-background hover:bg-muted/60 border-border text-foreground font-medium rounded-xl transition-all shadow-sm flex items-center justify-center"
                  onClick={handleGithubSignIn}
                  disabled={isGoogleLoading || isGithubLoading || isSubmitting}
                >
                  {isGithubLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <GithubIcon />
                      <span className="text-xs sm:text-sm font-semibold">GitHub</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="relative flex items-center justify-center pt-1">
                <div className="border-t border-border w-full" />
                <span className="bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground font-medium shrink-0">
                  Or continue with email
                </span>
                <div className="border-t border-border w-full" />
              </div>
            </div>

            {/* LOGIN FORM TAB */}
            <TabsContent value="login" className="mt-0 space-y-4">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email address</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="name@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="h-11 bg-background/50 border-border focus:border-primary rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline font-medium"
                      onClick={() => toast({ title: "Password Reset", description: "Password reset link will be sent to your email." })}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="h-11 bg-background/50 border-border focus:border-primary rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(c) => setRememberMe(!!c)}
                  />
                  <Label htmlFor="remember" className="text-xs font-normal text-muted-foreground cursor-pointer">
                    Remember this device for 30 days
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading || isGithubLoading}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-md mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In to AgentSpace'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* SIGNUP FORM TAB */}
            <TabsContent value="signup" className="mt-0 space-y-4">
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Alex Morgan"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    className="h-10 bg-background/50 border-border focus:border-primary rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="alexm"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      className="h-10 bg-background/50 border-border focus:border-primary rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="alex@domain.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      className="h-10 bg-background/50 border-border focus:border-primary rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      className="h-10 bg-background/50 border-border focus:border-primary rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    required
                    className="h-10 bg-background/50 border-border focus:border-primary rounded-xl"
                  />
                </div>

                <div className="flex items-start space-x-2 py-1">
                  <Checkbox
                    id="terms"
                    checked={agreeTerms}
                    onCheckedChange={(c) => setAgreeTerms(!!c)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-xs leading-tight font-normal text-muted-foreground cursor-pointer">
                    I agree to AgentSpace&apos;s <span className="text-primary hover:underline">Terms of Service</span> and <span className="text-primary hover:underline">Privacy Policy</span>.
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading || isGithubLoading}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-md mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    'Create AgentSpace Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Footer Security Badge */}
          <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secured with OAuth 2.0 & Encrypted Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}

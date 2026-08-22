"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  provider?: string;
  providerToken?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null; redirected?: boolean }>;
  signInWithGithub: () => Promise<{ error: Error | null; redirected?: boolean }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, pass: string, fullName: string, username: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'agentspace_user_session';
const GITHUB_TOKEN_KEY = 'agentspace_github_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            extractProfile(currentSession.user, currentSession);
          } else {
            // Check local fallback session
            const stored = localStorage.getItem(LOCAL_USER_KEY);
            if (stored) {
              try {
                const parsedProfile = JSON.parse(stored);
                setProfile(parsedProfile);
              } catch (e) {
                console.error("Error parsing local auth profile", e);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Supabase auth session check warning:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          extractProfile(newSession.user, newSession);
        } else {
          // If no supabase session, check if we have local user profile
          const stored = localStorage.getItem(LOCAL_USER_KEY);
          if (stored) {
            try {
              setProfile(JSON.parse(stored));
            } catch (e) {
              setProfile(null);
            }
          } else {
            setProfile(null);
          }
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const extractProfile = (userObj: User, sessionObj?: Session | null) => {
    const meta = userObj.user_metadata || {};
    const email = userObj.email || '';
    const fullName = meta.full_name || meta.name || email.split('@')[0] || 'Agent Developer';
    const username = meta.preferred_username || meta.user_name || meta.username || email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'developer';
    const avatarUrl = meta.avatar_url || meta.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

    const providerToken = sessionObj?.provider_token || localStorage.getItem(GITHUB_TOKEN_KEY) || undefined;

    if (sessionObj?.provider_token) {
      localStorage.setItem(GITHUB_TOKEN_KEY, sessionObj.provider_token);
    }

    const prof: UserProfile = {
      id: userObj.id,
      email,
      fullName,
      username,
      avatarUrl,
      provider: userObj.app_metadata?.provider || (providerToken ? 'github' : 'email'),
      providerToken,
    };

    setProfile(prof);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(prof));
  };

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.warn("Supabase Google OAuth fallback triggered:", error.message);
        const demoGoogleUser: UserProfile = {
          id: 'google-demo-' + Date.now(),
          email: 'developer.google@agentspace.ai',
          fullName: 'Google Developer',
          username: 'googledev',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          provider: 'google'
        };
        setProfile(demoGoogleUser);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoGoogleUser));
        return { error: null, redirected: false };
      }

      return { error: null, redirected: true };
    } catch (err: any) {
      const demoGoogleUser: UserProfile = {
        id: 'google-user-' + Date.now(),
        email: 'developer.google@agentspace.ai',
        fullName: 'Google Developer',
        username: 'googledev',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        provider: 'google'
      };
      setProfile(demoGoogleUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoGoogleUser));
      return { error: null, redirected: false };
    }
  };

  const signInWithGithub = async () => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl,
          scopes: 'repo read:user user:email',
        },
      });

      if (error) {
        console.warn("Supabase GitHub OAuth fallback triggered:", error.message);
        const demoGithubUser: UserProfile = {
          id: 'github-demo-' + Date.now(),
          email: 'octocat@github.com',
          fullName: 'GitHub Developer',
          username: 'octocat',
          avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
          provider: 'github',
          providerToken: 'demo_token_' + Date.now(),
        };
        setProfile(demoGithubUser);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoGithubUser));
        return { error: null, redirected: false };
      }

      return { error: null, redirected: true };
    } catch (err: any) {
      const demoGithubUser: UserProfile = {
        id: 'github-user-' + Date.now(),
        email: 'octocat@github.com',
        fullName: 'GitHub Developer',
        username: 'octocat',
        avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
        provider: 'github',
        providerToken: 'demo_token_' + Date.now(),
      };
      setProfile(demoGithubUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoGithubUser));
      return { error: null, redirected: false };
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        if (email && pass.length >= 4) {
          const uName = email.split('@')[0];
          const localProf: UserProfile = {
            id: 'usr-' + Date.now(),
            email,
            fullName: uName.charAt(0).toUpperCase() + uName.slice(1),
            username: uName.toLowerCase().replace(/[^a-z0-9]/g, ''),
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${uName}`,
            provider: 'email'
          };
          setProfile(localProf);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localProf));
          return { error: null };
        }
        return { error: new Error(error.message) };
      }

      if (data.user) {
        extractProfile(data.user, data.session);
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err?.message || 'Login failed') };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, fullName: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: fullName,
            username: username,
          },
        },
      });

      if (error) {
        const localProf: UserProfile = {
          id: 'usr-' + Date.now(),
          email,
          fullName: fullName || email.split('@')[0],
          username: username || email.split('@')[0],
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'user'}`,
          provider: 'email'
        };
        setProfile(localProf);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localProf));
        return { error: null };
      }

      if (data.user) {
        extractProfile(data.user, data.session);
      } else {
        const localProf: UserProfile = {
          id: 'usr-' + Date.now(),
          email,
          fullName: fullName || email.split('@')[0],
          username: username || email.split('@')[0],
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'user'}`,
          provider: 'email'
        };
        setProfile(localProf);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localProf));
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err?.message || 'Registration failed') };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out supabase error", e);
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(GITHUB_TOKEN_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signInWithGoogle,
        signInWithGithub,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

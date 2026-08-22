"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';

export interface FollowRecord {
  followerUsername: string;
  followerName: string;
  followerAvatar?: string;
  targetUsername: string;
  targetName: string;
  createdAt: string;
}

interface FollowContextType {
  follows: FollowRecord[];
  followUser: (targetUsername: string, targetName: string) => void;
  unfollowUser: (targetUsername: string) => void;
  isFollowing: (targetUsername: string) => boolean;
  getFollowers: (username: string) => { username: string; name: string; avatar?: string }[];
  getFollowing: (username: string) => { username: string; name: string; avatar?: string }[];
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

const STORAGE_KEY = 'agentspace_follows_v1';

export function FollowProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [follows, setFollows] = useState<FollowRecord[]>([]);

  const fetchGlobalFollows = async () => {
    try {
      const res = await fetch('/api/follows');
      if (res.ok) {
        const data = await res.json();
        if (data.follows && Array.isArray(data.follows)) {
          setFollows(data.follows);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.follows));
          return;
        }
      }
    } catch (e) {}

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setFollows(JSON.parse(saved));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchGlobalFollows();
  }, []);

  const followUser = async (targetUsername: string, targetName: string) => {
    if (!profile) return;
    const followerUsername = profile.username.toLowerCase();
    const targetKey = targetUsername.toLowerCase();

    if (followerUsername === targetKey) return;

    const record: FollowRecord = {
      followerUsername: profile.username,
      followerName: profile.fullName || profile.username,
      followerAvatar: profile.avatarUrl || '',
      targetUsername: targetUsername,
      targetName: targetName,
      createdAt: new Date().toISOString(),
    };

    setFollows(prev => {
      const exists = prev.some(
        f => f.followerUsername.toLowerCase() === followerUsername && f.targetUsername.toLowerCase() === targetKey
      );
      if (exists) return prev;
      const updated = [...prev, record];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'FOLLOW', record }),
      });
    } catch (e) {}
  };

  const unfollowUser = async (targetUsername: string) => {
    if (!profile) return;
    const followerUsername = profile.username.toLowerCase();
    const targetKey = targetUsername.toLowerCase();

    setFollows(prev => {
      const updated = prev.filter(
        f => !(f.followerUsername.toLowerCase() === followerUsername && f.targetUsername.toLowerCase() === targetKey)
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UNFOLLOW', followerUsername: profile.username, targetUsername }),
      });
    } catch (e) {}
  };

  const isFollowingUser = (targetUsername: string): boolean => {
    if (!profile) return false;
    const followerUsername = profile.username.toLowerCase();
    const targetKey = targetUsername.toLowerCase();
    return follows.some(
      f => f.followerUsername.toLowerCase() === followerUsername && f.targetUsername.toLowerCase() === targetKey
    );
  };

  const getFollowers = (username: string) => {
    const key = username.toLowerCase();
    return follows
      .filter(f => f.targetUsername.toLowerCase() === key)
      .map(f => ({
        username: f.followerUsername,
        name: f.followerName,
        avatar: f.followerAvatar,
      }));
  };

  const getFollowing = (username: string) => {
    const key = username.toLowerCase();
    return follows
      .filter(f => f.followerUsername.toLowerCase() === key)
      .map(f => ({
        username: f.targetUsername,
        name: f.targetName,
        avatar: '',
      }));
  };

  return (
    <FollowContext.Provider
      value={{
        follows,
        followUser,
        unfollowUser,
        isFollowing: isFollowingUser,
        getFollowers,
        getFollowing,
      }}
    >
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
}

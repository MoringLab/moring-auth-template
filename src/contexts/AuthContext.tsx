'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// User type definition
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  preferred_username?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthEnabled: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if auth is enabled (Supabase credentials exist)
  const isAuthEnabled = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SSO_CLIENT_ID
  );

  // Check for existing session on mount
  useEffect(() => {
    if (!isAuthEnabled) {
      setIsLoading(false);
      return;
    }

    const supabase = createSupabaseClient();

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
            preferred_username: session.user.user_metadata?.preferred_username,
          });
        }
      } catch (error) {
        console.error('[Auth] Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          preferred_username: session.user.user_metadata?.preferred_username,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthEnabled]);

  // Initiate OAuth login
  const login = useCallback(() => {
    if (!isAuthEnabled) {
      console.warn('[Auth] Auth is not enabled');
      return;
    }

    // Redirect to login API route
    window.location.href = '/api/auth/login';
  }, [isAuthEnabled]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });

      if (isAuthEnabled) {
        const supabase = createSupabaseClient();
        await supabase.auth.signOut();
      }

      setUser(null);
      router.refresh();
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    }
  }, [isAuthEnabled, router]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAuthEnabled,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
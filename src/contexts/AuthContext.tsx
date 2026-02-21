import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type UserRole = 'pharmacy' | 'vendor' | 'admin';

interface AppUser {
  id: string;
  auth_id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  otpVerified: boolean;
  setOtpVerified: (v: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpVerified, setOtpVerified] = useState(false);

  const fetchAppUser = async (authId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle();
    if (data) {
      setAppUser(data as AppUser);
    }
    return data;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer to avoid Supabase deadlock
          setTimeout(() => fetchAppUser(session.user.id), 0);
        } else {
          setAppUser(null);
          setOtpVerified(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAppUser(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    setOtpVerified(false);
    setAppUser(null);
    await supabase.auth.signOut();
    // Force navigation to login to prevent stale route
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ session, user, appUser, loading, otpVerified, setOtpVerified, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

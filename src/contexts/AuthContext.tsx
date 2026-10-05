import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getMyProfile, type Profile } from '../lib/authApi';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Fournit la vraie session Supabase (même projet que l'appli mobile) à
 * toute l'application. `getSession()` restaure la session depuis le
 * stockage local au chargement, puis `onAuthStateChange` la tient à jour
 * (connexion, déconnexion, rafraîchissement de token, retour d'OAuth).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadProfile(userId: string) {
    try {
      const p = await getMyProfile(userId);
      setProfile(p);
    } catch {
      // Le profil est créé par un trigger côté base dès l'inscription ;
      // s'il n'est pas encore là on le laisse simplement à null plutôt
      // que de bloquer tout l'écran.
      setProfile(null);
    }
  }

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      if (data.session?.user) {
        await loadProfile(data.session.user.id);
      }
      if (isMounted) setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      if (newSession?.user) {
        void loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function refreshProfile() {
    if (session?.user) {
      await loadProfile(session.user.id);
    }
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    isLoading,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un <AuthProvider>');
  return ctx;
}

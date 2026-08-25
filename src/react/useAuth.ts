import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { remoteAccountServicesEnabled } from '../infrastructure/runtime-environment.js';

export interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!remoteAccountServicesEnabled) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void import('../infrastructure/firebase.js').then(({ onAuthChange }) => {
      if (!cancelled) unsubscribe = onAuthChange((next) => { setUser(next); setLoading(false); });
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; unsubscribe?.(); };
  }, []);

  return {
    user,
    loading,
    signIn: async () => {
      if (!remoteAccountServicesEnabled) return;
      const { signInWithGoogle } = await import('../infrastructure/firebase.js');
      await signInWithGoogle();
    },
    signOut: async () => {
      if (!remoteAccountServicesEnabled) return;
      const { signOutUser } = await import('../infrastructure/firebase.js');
      await signOutUser();
    },
  };
}

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange, signInWithGoogle, signOutUser } from '../infrastructure/firebase.js';

export interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthChange((next) => { setUser(next); setLoading(false); }), []);

  return {
    user,
    loading,
    signIn: () => signInWithGoogle().then(() => undefined),
    signOut: () => signOutUser(),
  };
}

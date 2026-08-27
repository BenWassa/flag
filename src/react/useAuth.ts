import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { remoteAccountServicesEnabled } from '../infrastructure/runtime-environment.js';
import type { CloudSyncStatus } from '../infrastructure/cloud-sync-service.js';

export interface AuthState {
  user: User | null;
  loading: boolean;
  cloudStatus: CloudSyncStatus;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteCloudCopy: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('signed-out');

  useEffect(() => {
    if (!remoteAccountServicesEnabled) {
      setLoading(false);
      return;
    }

    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeCloud: (() => void) | undefined;
    let cancelled = false;
    void Promise.all([
      import('../infrastructure/firebase.js'),
      import('../infrastructure/cloud-sync-service.js'),
    ]).then(([firebase, cloud]) => {
      if (cancelled) return;
      unsubscribeAuth = firebase.onAuthChange((next) => { setUser(next); setLoading(false); });
      unsubscribeCloud = cloud.subscribeCloudSyncStatus(setCloudStatus);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; unsubscribeAuth?.(); unsubscribeCloud?.(); };
  }, []);

  return {
    user,
    loading,
    cloudStatus,
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
    deleteCloudCopy: async () => {
      if (!remoteAccountServicesEnabled || !user) return;
      const { deleteCloudCopy } = await import('../infrastructure/cloud-sync-service.js');
      await deleteCloudCopy(user);
    },
    deleteAccount: async () => {
      if (!remoteAccountServicesEnabled || !user) return;
      const { deleteCloudAccount } = await import('../infrastructure/cloud-sync-service.js');
      await deleteCloudAccount(user);
    },
  };
}

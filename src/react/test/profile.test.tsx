import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AtlasActions } from '../actions.js';
import { AtlasActionsContext } from '../actions.js';

const auth = vi.hoisted(() => ({
  current: null as unknown as {
    user: { uid: string; displayName: string; email: string; photoURL: null } | null;
    loading: boolean;
    cloudStatus: 'signed-out' | 'reconciling' | 'saving' | 'synced' | 'degraded' | 'unauthorised';
    signIn: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    deleteCloudCopy: ReturnType<typeof vi.fn>;
    deleteAccount: ReturnType<typeof vi.fn>;
  },
}));

vi.mock('../../infrastructure/runtime-environment.js', () => ({ isDevelopmentSandbox: false }));
vi.mock('../useAuth.js', () => ({ useAuth: () => auth.current }));

function actions(): AtlasActions {
  return {
    goHome: vi.fn(), goBack: vi.fn(), openProfile: vi.fn(), openDomain: vi.fn(), openScope: vi.fn(),
    playScope: vi.fn(), learnScope: vi.fn(), startFlags: vi.fn(), revealFlag: vi.fn(), toggleAllFlagNames: vi.fn(),
    answerFlag: vi.fn(), answerLocation: vi.fn(), answerOutline: vi.fn(), setNeighborQuery: vi.fn(),
    submitNeighbor: vi.fn(), submitNeighborQuery: vi.fn(), advance: vi.fn(), exitRound: vi.fn(), review: vi.fn(), repeat: vi.fn(),
  };
}

async function renderProfile() {
  const { ProfileScreen } = await import('../screens/PassiveScreens.js');
  return render(<AtlasActionsContext value={actions()}><ProfileScreen /></AtlasActionsContext>);
}

beforeEach(() => {
  auth.current = {
    user: null,
    loading: false,
    cloudStatus: 'signed-out',
    signIn: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    deleteCloudCopy: vi.fn().mockResolvedValue(undefined),
    deleteAccount: vi.fn().mockResolvedValue(undefined),
  };
});

describe('Profile cloud account states', () => {
  it('keeps signed-out copy honest and local-first', async () => {
    await renderProfile();
    expect(screen.getByText(/progress is saved on this device/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeTruthy();
    expect(screen.queryByText(/automatically saved to your account/i)).toBeNull();
  });

  it('communicates syncing and degraded states without blocking account controls', async () => {
    auth.current.user = { uid: 'allowed', displayName: 'Atlas Learner', email: 'learner@example.com', photoURL: null };
    auth.current.cloudStatus = 'reconciling';
    const view = await renderProfile();
    expect(screen.getByRole('status').textContent).toContain('Checking cloud progress');

    view.unmount();
    auth.current.cloudStatus = 'degraded';
    await renderProfile();
    expect(screen.getByRole('status').textContent).toContain('Progress is still saved on this device');
    expect((screen.getByRole('button', { name: 'Sign out' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('does not offer cloud deletion to an unauthorised signed-in account', async () => {
    auth.current.user = { uid: 'other', displayName: 'Other account', email: 'other@example.com', photoURL: null };
    auth.current.cloudStatus = 'unauthorised';
    await renderProfile();
    expect(screen.getByRole('status').textContent).toContain("Cloud backup isn't available for this account");
    expect(screen.queryByRole('button', { name: 'Delete cloud copy' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete account' })).toBeNull();
  });

  it('confirms account deletion and surfaces partial deletion failure precisely', async () => {
    auth.current.user = { uid: 'allowed', displayName: 'Atlas Learner', email: 'learner@example.com', photoURL: null };
    auth.current.cloudStatus = 'synced';
    auth.current.deleteAccount.mockRejectedValueOnce(new Error(
      'Cloud progress was deleted, but Google requires a recent sign-in before Atlas can delete the account. Sign in again, then retry account deletion.',
    ));
    await renderProfile();

    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    expect(screen.getByText(/Progress on this device stays here/i)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText(/Cloud progress was deleted, but Google requires a recent sign-in/i)).toBeTruthy();
    expect(auth.current.deleteAccount).toHaveBeenCalledTimes(1);
  });
});

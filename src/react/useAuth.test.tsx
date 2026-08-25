import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { useAuth } from './useAuth.js';

const firebaseCalls = vi.hoisted(() => ({ observe: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }));

vi.mock('../infrastructure/firebase.js', () => ({
  onAuthChange: firebaseCalls.observe,
  signInWithGoogle: firebaseCalls.signIn,
  signOutUser: firebaseCalls.signOut,
}));

function AuthProbe() {
  const auth = useAuth();
  return <output>{auth.loading ? 'loading' : 'ready'}</output>;
}

test('development mode becomes ready without initialising Firebase Auth', async () => {
  render(<AuthProbe />);
  await waitFor(() => expect(screen.getByText('ready')).toBeTruthy());
  expect(firebaseCalls.observe).not.toHaveBeenCalled();
  expect(firebaseCalls.signIn).not.toHaveBeenCalled();
  expect(firebaseCalls.signOut).not.toHaveBeenCalled();
});

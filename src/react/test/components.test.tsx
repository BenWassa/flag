import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { COUNTRIES } from '../../data/countries.js';
import { createInitialAchievementState } from '../../domain/achievements.js';
import { createInitialLocationProgress } from '../../domain/map-game.js';
import { createInitialNeighborProgress } from '../../domain/neighbor-game.js';
import { createInitialProgress } from '../../domain/progress.js';
import type { AtlasActions } from '../actions.js';
import { AtlasActionsContext } from '../actions.js';
import { Launcher, type LauncherModel } from '../components/Launcher.js';
import { DomainScreen, HomeScreen } from '../screens/PassiveScreens.js';

function actions(): AtlasActions {
  return {
    goHome: vi.fn(), goBack: vi.fn(), openDomain: vi.fn(), openScope: vi.fn(),
    selectRegion: vi.fn(), selectContinent: vi.fn(), startFlags: vi.fn(),
    startLocations: vi.fn(), startOutlines: vi.fn(), startNeighbors: vi.fn(),
    revealFlag: vi.fn(), toggleAllFlagNames: vi.fn(), answerFlag: vi.fn(),
    answerLocation: vi.fn(), answerOutline: vi.fn(), setNeighborQuery: vi.fn(),
    submitNeighbor: vi.fn(), submitNeighborQuery: vi.fn(), advance: vi.fn(),
    exitRound: vi.fn(), review: vi.fn(), repeat: vi.fn(),
  };
}

function ledgers() {
  const ids = COUNTRIES.map((country) => country.id);
  return {
    flags: createInitialProgress(COUNTRIES),
    locations: createInitialLocationProgress(ids),
    outlines: createInitialProgress(COUNTRIES),
    neighbors: createInitialNeighborProgress(ids),
  };
}

describe('React screen actions', () => {
  it('opens a domain through a component event', async () => {
    const atlasActions = actions();
    render(<AtlasActionsContext value={atlasActions}><HomeScreen ledgers={ledgers()} persisting /></AtlasActionsContext>);

    await userEvent.click(screen.getByRole('button', { name: /Flags/i }));

    expect(atlasActions.openDomain).toHaveBeenCalledWith('flags');
    expect(screen.getByRole('heading', { name: 'Atlas' })).toBeTruthy();
  });

  it('keeps unsupported continents non-interactive', () => {
    render(<AtlasActionsContext value={actions()}><DomainScreen domain="locations" ledgers={ledgers()} achievements={createInitialAchievementState()} persisting /></AtlasActionsContext>);

    expect(screen.getByText('Africa')).toBeTruthy();
    const unavailable = screen.getAllByText('Coming soon');
    expect(unavailable.length).toBeGreaterThan(0);
    expect(unavailable.every((label) => label.closest('button') === null)).toBe(true);
  });

  it('routes launcher region and Play choices directly', async () => {
    const atlasActions = actions();
    const stats = { total: 10, unseen: 10, learning: 0, mastered: 0, due: 0, cleared: 0 };
    const model: LauncherModel = {
      domain: 'flags',
      continentScope: { kind: 'continent', id: 'africa', label: 'Africa' },
      stats,
      regions: [{ scope: { kind: 'region', id: 'west-africa', label: 'West Africa' }, stats }],
      unitLabel: 'flags', persisting: true, storageNotice: '', showMap: false,
    };
    render(<AtlasActionsContext value={atlasActions}><Launcher model={model} /></AtlasActionsContext>);

    await userEvent.click(screen.getByRole('button', { name: /West Africa/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Play Africa' }));

    expect(atlasActions.selectRegion).toHaveBeenCalledWith('flags', 'west-africa');
    expect(atlasActions.startFlags).toHaveBeenCalledWith('test');
  });
});

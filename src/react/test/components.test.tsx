import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CONTINENTS } from '../../data/continents.js';
import { COUNTRIES } from '../../data/countries.js';
import { createInitialAchievementState } from '../../domain/achievements.js';
import { createInitialLocationProgress } from '../../domain/map-game.js';
import { createInitialNeighborProgress } from '../../domain/neighbor-game.js';
import { createInitialProgress } from '../../domain/progress.js';
import { scopeSupportsDomain } from '../../domain/scope-support.js';
import type { AtlasActions } from '../actions.js';
import { AtlasActionsContext } from '../actions.js';
import { Launcher, type LauncherModel } from '../components/Launcher.js';
import { DomainScreen, HomeScreen } from '../screens/PassiveScreens.js';

function actions(): AtlasActions {
  return {
    goHome: vi.fn(), goBack: vi.fn(), openProfile: vi.fn(), openDomain: vi.fn(), openScope: vi.fn(),
    playScope: vi.fn(), learnScope: vi.fn(), startFlags: vi.fn(),
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

  it('keeps continent interaction aligned with canonical domain support', () => {
    render(<AtlasActionsContext value={actions()}><DomainScreen domain="locations" ledgers={ledgers()} achievements={createInitialAchievementState()} persisting /></AtlasActionsContext>);

    for (const continent of CONTINENTS) {
      const scope = { kind: 'continent' as const, id: continent.id, label: continent.name };
      const supported = scopeSupportsDomain(scope, 'locations');
      const label = screen.getByText(continent.name);
      const button = label.closest('button');
      if (supported) {
        expect(button, `${continent.name} Locations should be interactive`).not.toBeNull();
      } else {
        expect(button, `${continent.name} Locations should remain non-interactive`).toBeNull();
        expect(label.parentElement?.textContent).toContain('Coming soon');
      }
    }
  });

  it('plays a launcher scope from a single row tap', async () => {
    const atlasActions = actions();
    const stats = { total: 10, unseen: 10, learning: 0, mastered: 0, due: 0, cleared: 0 };
    const model: LauncherModel = {
      domain: 'flags',
      continentScope: { kind: 'continent', id: 'africa', label: 'Africa' },
      stats,
      regions: [{ scope: { kind: 'region', id: 'west-africa', label: 'West Africa' }, stats }],
      unitLabel: 'flags', persisting: true, storageNotice: '',
    };
    render(<AtlasActionsContext value={atlasActions}><Launcher model={model} /></AtlasActionsContext>);

    await userEvent.click(screen.getByRole('button', { name: 'Play West Africa' }));
    expect(atlasActions.playScope).toHaveBeenCalledWith('flags', 'west-africa', expect.anything());

    await userEvent.click(screen.getByRole('button', { name: 'Play All Africa' }));
    expect(atlasActions.playScope).toHaveBeenCalledWith('flags', 'africa', expect.anything());

    await userEvent.click(screen.getByRole('button', { name: 'Learn Africa' }));
    expect(atlasActions.learnScope).toHaveBeenCalledWith('flags', 'africa', expect.anything());
  });
});

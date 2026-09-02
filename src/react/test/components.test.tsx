import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CONTINENTS } from '../../data/continents.js';
import { COUNTRIES } from '../../data/countries.js';
import { createInitialAchievementState, regionDomainMasteryKey } from '../../domain/achievements.js';
import { createInitialLocationProgress } from '../../domain/map-game.js';
import { createInitialNeighborProgress } from '../../domain/neighbor-game.js';
import { createInitialProgress } from '../../domain/progress.js';
import { scopeSupportsDomain } from '../../domain/scope-support.js';
import { SpatialCommand } from '../../spatial/SpatialCommand.js';
import { deriveSpatialState } from '../../spatial/spatial-state.js';
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
    render(<AtlasActionsContext value={atlasActions}><HomeScreen ledgers={ledgers()} achievements={createInitialAchievementState()} persisting /></AtlasActionsContext>);

    expect(screen.queryByRole('heading', { name: 'World Crown' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /Flags/i }));

    expect(atlasActions.openDomain).toHaveBeenCalledWith('flags');
    expect(screen.getByRole('heading', { name: 'Atlas' })).toBeTruthy();
  });

  it('keeps fallback Home mode names and progress without redundant World metadata', () => {
    render(<AtlasActionsContext value={actions()}><HomeScreen ledgers={ledgers()} achievements={createInitialAchievementState()} persisting /></AtlasActionsContext>);

    for (const [label, total] of [['Flags', 195], ['Locations', 195], ['Outlines', 195], ['Neighbours', 193]] as const) {
      const mode = screen.getByRole('button', { name: new RegExp(`${label}.*0 of ${total} cleared`, 'i') });
      expect(mode.textContent).not.toContain('World');
      expect(mode.querySelector('small')).toBeNull();
    }
  });

  it('shows the World Crown only when the persisted achievement is earned', () => {
    const earned = { ...createInitialAchievementState(), worldCrown: true };
    render(<AtlasActionsContext value={actions()}><HomeScreen ledgers={ledgers()} achievements={earned} persisting /></AtlasActionsContext>);

    expect(screen.getByRole('heading', { name: 'World Crown' })).toBeTruthy();
    expect(screen.getByText('Earned · all six continents complete')).toBeTruthy();
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
      activeScope: { kind: 'continent', id: 'africa', label: 'Africa' },
      stats,
      regions: [{
        scope: { kind: 'region', id: 'west-africa', label: 'West Africa' },
        stats,
        domainMastered: false,
        complete: false,
      }],
      unitLabel: 'flags', persisting: true, storageNotice: '',
    };
    render(<AtlasActionsContext value={atlasActions}><Launcher model={model} /></AtlasActionsContext>);

    await userEvent.click(screen.getByRole('button', { name: /Play West Africa.*10 flags.*0 of 10 cleared/i }));
    expect(atlasActions.playScope).toHaveBeenCalledWith('flags', 'west-africa', expect.anything());

    await userEvent.click(screen.getByRole('button', { name: /Play All Africa.*10 flags.*0 of 10 cleared/i }));
    expect(atlasActions.playScope).toHaveBeenCalledWith('flags', 'africa', expect.anything());

    await userEvent.click(screen.getByRole('button', { name: 'Learn Africa' }));
    expect(atlasActions.learnScope).toHaveBeenCalledWith('flags', 'africa', expect.anything());
  });

  it('composes fallback launcher names from action, progress and earned state', () => {
    const stats = { total: 10, unseen: 2, learning: 2, mastered: 6, due: 1, cleared: 7 };
    const model: LauncherModel = {
      domain: 'flags',
      continentScope: { kind: 'continent', id: 'africa', label: 'Africa' },
      activeScope: { kind: 'continent', id: 'africa', label: 'Africa' },
      stats,
      regions: [
        { scope: { kind: 'region', id: 'west-africa', label: 'West Africa' }, stats, domainMastered: true, complete: false },
        { scope: { kind: 'region', id: 'southern-africa', label: 'Southern Africa' }, stats, domainMastered: true, complete: true },
      ],
      unitLabel: 'flags', persisting: true, storageNotice: '',
    };
    render(<AtlasActionsContext value={actions()}><Launcher model={model} /></AtlasActionsContext>);

    const mastered = screen.getByRole('button', { name: /Play West Africa.*Mastered.*10 flags.*1 due.*7 of 10 cleared/i });
    expect(mastered.closest('.region-row')?.classList.contains('region-row--mastered')).toBe(true);
    expect(screen.getByText('Mastered', { exact: true }).textContent).toBe('Mastered');

    const complete = screen.getByRole('button', { name: /Play Southern Africa.*Complete.*10 flags.*1 due.*7 of 10 cleared/i });
    expect(complete.closest('.region-row')?.classList.contains('region-row--complete')).toBe(true);
    expect(screen.getByText('Complete', { exact: true }).textContent).toBe('Complete');
  });

  it('exposes the same earned semantics in the Spatial command controls', () => {
    const achievements = {
      ...createInitialAchievementState(),
      regionDomainMasteries: [regionDomainMasteryKey('west-africa', 'flags')],
      completeRegions: ['southern-africa'],
    };
    const state = deriveSpatialState({
      route: { name: 'learning', domain: 'flags', scope: { kind: 'continent', id: 'africa', label: 'Africa' } },
      view: 'scope',
      achievements,
    });
    render(<AtlasActionsContext value={actions()}><SpatialCommand state={state} ledgers={ledgers()} achievements={achievements} persisting /></AtlasActionsContext>);

    expect(screen.getByRole('button', { name: /West Africa.*Mastered/i }).classList.contains('spatial-chip--mastered')).toBe(true);
    expect(screen.getByRole('button', { name: /Southern Africa.*complete/i }).classList.contains('spatial-chip--complete')).toBe(true);
    const unearned = screen.getByRole('button', { name: /North Africa/i });
    expect(unearned.classList.contains('spatial-chip--mastered')).toBe(false);
    expect(unearned.classList.contains('spatial-chip--complete')).toBe(false);
  });
});

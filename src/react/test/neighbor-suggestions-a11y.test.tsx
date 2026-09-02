import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getNeighborScopeConfig, landAdjacencyForScope } from '../../data/neighbors/index.js';
import { buildNeighborSession, createInitialNeighborProgress } from '../../domain/neighbor-game.js';
import type { AtlasActions } from '../actions.js';
import { AtlasActionsContext } from '../actions.js';
import { NeighborQuizScreen } from '../screens/NeighborScreens.js';

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

function neighborSession() {
  const config = getNeighborScopeConfig('west-africa')!;
  const adjacency = landAdjacencyForScope('west-africa')!;
  return buildNeighborSession(
    adjacency,
    createInitialNeighborProgress(config.countryIds),
    config.scope,
    config.countryIds,
    'test',
    'neighbors-a11y-round',
    1,
    ['GHA'],
  );
}

function renderSuggestions(atlasActions: AtlasActions = actions()) {
  render(
    <AtlasActionsContext value={atlasActions}>
      <NeighborQuizScreen session={neighborSession()} lastOutcome={null} query="Ken" />
    </AtlasActionsContext>,
  );
  return atlasActions;
}

describe('Neighbours suggestion accessibility', () => {
  it('uses a labelled search input plus ordinary suggestion buttons without partial combobox/listbox semantics', () => {
    renderSuggestions();

    const input = screen.getByLabelText('Country');
    expect(input.getAttribute('role')).toBeNull();
    expect(input.getAttribute('aria-autocomplete')).toBeNull();
    expect(input.getAttribute('aria-controls')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('listbox')).toBeNull();

    const suggestions = screen.getByRole('group', { name: 'Country suggestions' });
    expect(within(suggestions).getByRole('button', { name: 'Kenya' })).toBeTruthy();
    expect(suggestions.querySelector('[role="option"]')).toBeNull();
  });

  it('keeps suggestions predictably reachable and activatable in native tab order', async () => {
    const atlasActions = renderSuggestions();
    const user = userEvent.setup();
    const input = screen.getByLabelText('Country');
    const submit = screen.getByRole('button', { name: 'Submit' });
    const kenya = within(screen.getByRole('group', { name: 'Country suggestions' })).getByRole('button', { name: 'Kenya' });

    input.focus();
    await user.tab();
    expect(document.activeElement).toBe(submit);
    await user.tab();
    expect(document.activeElement).toBe(kenya);
    await user.keyboard('{Enter}');

    expect(atlasActions.submitNeighbor).toHaveBeenCalledWith('KEN');
  });
});

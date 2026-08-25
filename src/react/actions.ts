import { createContext, useContext } from 'react';
import type { LearningDomain } from '../domain/models.js';

export interface AtlasActions {
  goHome(): void;
  goBack(): void;
  openProfile(): void;
  openDomain(domain: LearningDomain): void;
  openScope(domain: LearningDomain, scopeId: string): void;
  selectRegion(domain: LearningDomain, scopeId: string, surface?: 'list' | 'map'): void;
  selectContinent(domain: LearningDomain, scopeId: string): void;
  startFlags(mode: 'learn' | 'test'): void;
  startLocations(mode: 'learn' | 'test', element?: HTMLElement | null): void;
  startOutlines(mode: 'learn' | 'test', element?: HTMLElement | null): void;
  startNeighbors(mode: 'learn' | 'test'): void;
  revealFlag(countryId: string): void;
  toggleAllFlagNames(): void;
  answerFlag(countryId: string): void;
  answerLocation(countryId: string, element?: HTMLElement | null): void;
  answerOutline(countryId: string): void;
  setNeighborQuery(value: string): void;
  submitNeighbor(countryId: string): void;
  submitNeighborQuery(): void;
  advance(domain: LearningDomain): void;
  exitRound(): void;
  review(domain: LearningDomain): void;
  repeat(domain: LearningDomain): void;
}

export const AtlasActionsContext = createContext<AtlasActions | null>(null);

export function useAtlasActions(): AtlasActions {
  const actions = useContext(AtlasActionsContext);
  if (!actions) throw new Error('Atlas actions are unavailable outside the application shell.');
  return actions;
}

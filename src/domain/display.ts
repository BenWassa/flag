import type { LearningDomain } from './models.js';

const DOMAIN_DISPLAY_NAMES: Record<LearningDomain, string> = {
  flags: 'Flags',
  locations: 'Locations',
  outlines: 'Outlines',
  neighbors: 'Neighbours',
};

export function domainDisplayName(domain: LearningDomain): string {
  return DOMAIN_DISPLAY_NAMES[domain];
}

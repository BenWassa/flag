import assert from 'node:assert/strict';
import { COUNTRIES } from '../dist/data/countries.js';
import { AFRICA_LAND_ADJACENCY } from '../dist/data/neighbors/index.js';
import { createInitialProgress } from '../dist/domain/progress.js';
import {
  buildProgressSummary,
  buildScopeProgressSummaries,
  evidenceForCountry,
} from '../dist/domain/progress-summary.js';

const africa = { kind: 'continent', id: 'africa', label: 'Africa' };
const europe = { kind: 'continent', id: 'europe', label: 'Europe' };
const flags = createInitialProgress(COUNTRIES);
const locations = { version: 1, records: {} };
const outlines = { version: 1, records: {} };
const neighbors = { version: 1, records: {} };
const ledgers = { flags, locations, outlines, neighbors };
const now = new Date('2026-08-21T12:00:00Z');

const africaSummaries = buildScopeProgressSummaries(ledgers, africa, now);
assert.deepEqual(
  africaSummaries.map((summary) => summary.domain),
  ['flags', 'locations', 'outlines', 'neighbors'],
  'Progress exposes the four learning domains in a stable order.',
);
assert.ok(africaSummaries.every((summary) => summary.supported), 'Africa supports all four production domains.');
assert.equal(
  africaSummaries.find((summary) => summary.domain === 'flags')?.total,
  54,
  'Africa Flags uses the 54-country curriculum.',
);
assert.equal(
  africaSummaries.find((summary) => summary.domain === 'locations')?.total,
  54,
  'Africa Locations uses the full generated map curriculum.',
);
assert.equal(
  africaSummaries.find((summary) => summary.domain === 'neighbors')?.total,
  Object.keys(AFRICA_LAND_ADJACENCY).length,
  'Neighbours excludes targets whose complete neighbour set is unsupported.',
);

const freshFlags = buildProgressSummary(ledgers, africa, 'flags', now);
assert.equal(freshFlags.unseen, 54, 'Missing records are counted as unseen evidence, not missing curriculum.');
assert.equal(freshFlags.action, 'learn', 'Fresh supported curriculum recommends Learn.');

flags.records.GHA.status = 'mastered';
flags.records.GHA.nextReviewAt = '2026-08-20T12:00:00Z';
const dueFlags = buildProgressSummary(ledgers, africa, 'flags', now);
assert.equal(dueFlags.due, 1, 'Due review is derived from stored review timing.');
assert.equal(dueFlags.strong, 1, 'A due country can still retain strong source evidence.');
assert.equal(dueFlags.action, 'review', 'Due work takes priority over Learn and Play recommendations.');
assert.equal(evidenceForCountry(ledgers, 'flags', 'GHA', now).status, 'due');

const unsupported = buildProgressSummary(ledgers, europe, 'locations', now);
assert.equal(unsupported.supported, false, 'Unsupported continent/domain combinations remain explicitly unavailable.');
assert.equal(unsupported.total, 0, 'Unsupported curriculum is excluded from totals.');
assert.equal(unsupported.action, null, 'Unsupported curriculum never receives a practice recommendation.');

locations.records.GHA = {
  countryId: 'GHA',
  status: 'learning',
  masteryStreak: 1,
  lifetimeResolved: 1,
  lifetimeFirstTryCorrect: 0,
  lifetimeIncorrectGuesses: 1,
  revealCount: 0,
  lapseCount: 0,
  confusionCounts: {},
};
const locationSummary = buildProgressSummary(ledgers, africa, 'locations', now);
assert.equal(locationSummary.learning, 1, 'Location-specific records map into shared learning evidence.');

neighbors.records.GHA = {
  countryId: 'GHA',
  status: 'mastered',
  masteryStreak: 3,
  lifetimeRounds: 3,
  lifetimeCompleted: 3,
  lifetimeCleanCompletions: 3,
  lifetimeWrongGuesses: 0,
  revealCount: 0,
  lapseCount: 0,
  confusionCounts: {},
};
const neighborEvidence = evidenceForCountry(ledgers, 'neighbors', 'GHA', now);
assert.equal(neighborEvidence.status, 'strong', 'Internal mastered status is presented as Strong evidence.');

console.log('Progress summary verification passed.');

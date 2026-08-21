import assert from 'node:assert/strict';
import { COUNTRIES } from '../dist/data/countries.js';
import { createInitialAchievementState } from '../dist/domain/achievements.js';
import { getAfricaNeighborScopeConfig } from '../dist/data/neighbors/index.js';
import { createInitialLocationProgress } from '../dist/domain/map-game.js';
import { createInitialNeighborProgress } from '../dist/domain/neighbor-game.js';
import { createInitialProgress } from '../dist/domain/progress.js';
import { countryIdsForSupportedScope } from '../dist/domain/scope-support.js';
import {
  buildProgressSummary,
  buildScopeProgressSummaries,
  evidenceForCountry,
} from '../dist/domain/progress-summary.js';
import { renderProgress } from '../dist/ui/views/progress.js';

const africa = { kind: 'continent', id: 'africa', label: 'Africa' };
const europe = { kind: 'continent', id: 'europe', label: 'Europe' };
const flags = createInitialProgress(COUNTRIES);
const locations = createInitialLocationProgress(countryIdsForSupportedScope(africa, 'locations'));
const outlines = createInitialProgress(COUNTRIES.filter((country) => country.continentId === 'africa'));
const neighbors = createInitialNeighborProgress(countryIdsForSupportedScope(africa, 'neighbors'));
const ledgers = { flags, locations, outlines, neighbors };
const now = new Date('2026-08-21T12:00:00Z');

const africaSummaries = buildScopeProgressSummaries(ledgers, africa, now);
assert.deepEqual(
  africaSummaries.map((summary) => summary.domain),
  ['flags', 'locations', 'outlines', 'neighbors'],
  'Progress exposes the four learning domains in a stable order.',
);
assert.ok(africaSummaries.every((summary) => summary.supported), 'Africa supports all four production domains.');
for (const summary of africaSummaries) {
  assert.deepEqual(
    summary.countryIds,
    countryIdsForSupportedScope(africa, summary.domain),
    `${summary.domain} membership comes from the canonical scope support seam.`,
  );
}
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
const africaNeighborScope = getAfricaNeighborScopeConfig('africa');
assert.ok(africaNeighborScope, 'Africa has a canonical Neighbours scope config.');
assert.equal(
  africaSummaries.find((summary) => summary.domain === 'neighbors')?.total,
  africaNeighborScope.countryIds.length,
  'Neighbours uses the canonical teachable target set and excludes incomplete geography.',
);

const freshFlags = buildProgressSummary(ledgers, africa, 'flags', now);
assert.equal(freshFlags.unseen, 54, 'Missing records are counted as unseen evidence, not missing curriculum.');
assert.equal(freshFlags.action, 'learn', 'Fresh supported curriculum recommends Learn.');

flags.records.GHA.status = 'mastered';
flags.records.GHA.nextReviewAt = '2026-08-20T12:00:00Z';
const dueFlags = buildProgressSummary(ledgers, africa, 'flags', now);
assert.equal(dueFlags.due, 1, 'Due review is derived from stored review timing.');
assert.equal(dueFlags.strong, 0, 'Due evidence is presented as a distinct live state rather than double-counted as strong.');
assert.equal(dueFlags.action, 'review', 'Due work takes priority over Learn and Play recommendations.');
assert.equal(evidenceForCountry(ledgers, 'flags', 'GHA', now).status, 'due');

const unsupported = buildProgressSummary(ledgers, europe, 'locations', now);
assert.equal(unsupported.supported, false, 'Unsupported continent/domain combinations remain explicitly unavailable.');
assert.equal(unsupported.total, 0, 'Unsupported curriculum is excluded from totals.');
assert.equal(unsupported.action, null, 'Unsupported curriculum never receives a practice recommendation.');

locations.records.GHA.status = 'learning';
const locationSummary = buildProgressSummary(ledgers, africa, 'locations', now);
assert.equal(locationSummary.learning, 1, 'Location-specific records map into shared learning evidence.');

neighbors.records.GHA.status = 'mastered';
const neighborEvidence = evidenceForCountry(ledgers, 'neighbors', 'GHA', now);
assert.equal(neighborEvidence.status, 'strong', 'Internal mastered status is presented as Strong evidence.');

const earned = createInitialAchievementState();
earned.regionDomainMasteries = ['west-africa:flags'];
const rendered = renderProgress(ledgers, earned, 'domain:flags', false, true);
assert.match(rendered, /Due for review/, 'Progress exposes live due evidence.');
assert.match(rendered, /Earned achievements/, 'Progress exposes the persisted achievement section.');
assert.match(rendered, /West Africa/, 'Progress renders the earned region/domain read model.');
assert.doesNotMatch(rendered, /toward mastery/, 'Progress does not leak scheduler thresholds.');

console.log('Progress summary verification passed.');

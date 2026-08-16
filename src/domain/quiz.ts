import { CONFUSION_CLUSTERS } from '../data/confusions.js';
import type { Country, ProgressState, Question, StudyMode, StudyScope } from './models.js';
import { countriesInScope, getRecord, isDue, learningPriority } from './progress.js';

export interface BuildQuizInput {
  countries: Country[];
  progress: ProgressState;
  scope: StudyScope;
  mode: StudyMode;
  size: number;
  sessionId: string;
  targetCountryIds?: string[];
  now?: Date;
}

export function buildQuiz({
  countries,
  progress,
  scope,
  mode,
  size,
  sessionId,
  targetCountryIds,
  now = new Date(),
}: BuildQuizInput): Question[] {
  const scoped = targetCountryIds
    ? countries.filter((country) => targetCountryIds.includes(country.id))
    : countriesInScope(countries, scope);
  const actualSize = Math.min(size, scoped.length);
  const rng = createSeededRandom(hashString(sessionId));
  const targets = selectTargets(scoped, progress, mode, actualSize, now, rng);
  const positions = balancedPositions(targets.length, rng);

  return targets.map((target, index) => {
    const distractors = chooseDistractors(target, countries, progress, 3, rng);
    const correctIndex = positions[index];
    const optionCountryIds = [...distractors.map((country) => country.id)];
    optionCountryIds.splice(correctIndex, 0, target.id);

    return {
      id: `${sessionId}:${index}:${target.id}`,
      countryId: target.id,
      optionCountryIds,
      correctIndex,
    };
  });
}

function selectTargets(
  scoped: Country[],
  progress: ProgressState,
  mode: StudyMode,
  size: number,
  now: Date,
  rng: () => number,
): Country[] {
  if (mode === 'test') return shuffle(scoped, rng).slice(0, size);

  const unseen = shuffle(
    scoped.filter((country) => getRecord(progress, country.id).status === 'unseen'),
    rng,
  );

  if (unseen.length > 0) {
    const selected = unseen.slice(0, size);
    if (selected.length < size) {
      const remaining = scoped.filter((country) => !selected.some((item) => item.id === country.id));
      selected.push(...rankLearningCandidates(remaining, progress, now, rng).slice(0, size - selected.length));
    }
    return selected;
  }

  const learning = scoped.filter((country) => getRecord(progress, country.id).status === 'learning');
  const dueMastered = scoped.filter((country) => isDue(getRecord(progress, country.id), now));
  const otherMastered = scoped.filter(
    (country) => getRecord(progress, country.id).status === 'mastered' && !isDue(getRecord(progress, country.id), now),
  );

  const targetLearning = Math.min(Math.ceil(size * 0.7), learning.length);
  const targetRetention = Math.min(Math.max(1, Math.floor(size * 0.2)), dueMastered.length);

  const selected = [
    ...rankLearningCandidates(learning, progress, now, rng).slice(0, targetLearning),
    ...rankLearningCandidates(dueMastered, progress, now, rng).slice(0, targetRetention),
  ];

  const remainder = scoped.filter((country) => !selected.some((item) => item.id === country.id));
  selected.push(...rankLearningCandidates(remainder, progress, now, rng).slice(0, size - selected.length));

  if (selected.length < size) {
    selected.push(...shuffle(otherMastered, rng).slice(0, size - selected.length));
  }

  return shuffle(selected.slice(0, size), rng);
}

function rankLearningCandidates(
  countries: Country[],
  progress: ProgressState,
  now: Date,
  rng: () => number,
): Country[] {
  return [...countries].sort((a, b) => {
    const aScore = learningPriority(getRecord(progress, a.id), now) + rng() * 3;
    const bScore = learningPriority(getRecord(progress, b.id), now) + rng() * 3;
    return bScore - aScore;
  });
}

function chooseDistractors(
  target: Country,
  allCountries: Country[],
  progress: ProgressState,
  count: number,
  rng: () => number,
): Country[] {
  const record = getRecord(progress, target.id);
  const chosen: Country[] = [];

  const pushUnique = (country?: Country) => {
    if (!country || country.id === target.id || chosen.some((item) => item.id === country.id)) return;
    chosen.push(country);
  };

  Object.entries(record.confusionCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([countryId]) => pushUnique(allCountries.find((country) => country.id === countryId)));

  const curatedCluster = CONFUSION_CLUSTERS.find((cluster) => cluster.includes(target.id));
  if (curatedCluster) {
    shuffle(curatedCluster.filter((id) => id !== target.id), rng).forEach((id) =>
      pushUnique(allCountries.find((country) => country.id === id)),
    );
  }

  shuffle(allCountries.filter((country) => country.regionId === target.regionId), rng).forEach(pushUnique);
  shuffle(allCountries.filter((country) => country.continentId === target.continentId), rng).forEach(pushUnique);
  shuffle(allCountries, rng).forEach(pushUnique);

  return chosen.slice(0, count);
}

export function balancedPositions(count: number, rng: () => number): number[] {
  const base = Array.from({ length: count }, (_, index) => index % 4);

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const candidate = shuffle(base, rng);
    if (!hasTripleRun(candidate)) return candidate;
  }

  return base;
}

function hasTripleRun(values: number[]): boolean {
  return values.some((value, index) => index >= 2 && value === values[index - 1] && value === values[index - 2]);
}

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

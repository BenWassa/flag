import type { Country, ProgressState, Question, StudyMode, StudyScope } from './models.js';
import type { MapCountryGeometry } from './map-models.js';
import { getRecord } from './progress.js';
import { buildQuiz, createSeededRandom, hashString } from './quiz.js';

const FRAME_SIZE = 100;
const FRAME_PADDING = 8;
const SUPPORTED_PATH_COMMANDS = /^[MLZmlz0-9eE+.,\-\s]+$/;
const POINT_PATTERN = /(-?\d+(?:\.\d+)?(?:e[-+]?\d+)?),(-?\d+(?:\.\d+)?(?:e[-+]?\d+)?)/gi;

export interface OutlineGeometry {
  countryId: string;
  /** Fixed 0..100 frame. Only the silhouette path varies between questions. */
  path: string;
  aspectRatio: number;
  subpathCount: number;
}

export interface OutlineAsset {
  scope: StudyScope;
  countryIds: readonly string[];
  /** Includes active-scope countries plus same-continent context for distractors. */
  geometries: Readonly<Record<string, OutlineGeometry>>;
}

export interface BuildOutlineQuizInput {
  countries: Country[];
  progress: ProgressState;
  scope: StudyScope;
  mode: StudyMode;
  size: number;
  sessionId: string;
  asset: OutlineAsset;
  targetCountryIds?: string[];
  now?: Date;
}

interface RawBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Normalize one canonical generated polygon into a fixed 100×100 silhouette
 * frame. `outlinePath` is preferred when the generator retains a whole-country
 * silhouette separately from viewport-clipped Locations geometry. Otherwise
 * the map `path` is used directly. Both fields come from the same canonical
 * Natural Earth topology/projection pipeline.
 *
 * The production d3-geo polygon pipeline emits M/L/Z paths. Rejecting other
 * commands is deliberate: a generator change must be reviewed rather than
 * silently normalized with incorrect SVG command semantics.
 */
export function normalizeOutlineGeometry(geometry: MapCountryGeometry): OutlineGeometry {
  const source = geometry.outlinePath ?? geometry.path;
  if (!source) throw new Error(`Outline geometry missing canonical path for ${geometry.countryId}.`);
  if (!SUPPORTED_PATH_COMMANDS.test(source)) {
    throw new Error(`Unsupported SVG command in canonical outline path for ${geometry.countryId}.`);
  }

  const points = [...source.matchAll(POINT_PATTERN)];
  if (points.length < 3) throw new Error(`Canonical outline path is too small for ${geometry.countryId}.`);

  const bounds = points.reduce<RawBounds>((result, match) => {
    const x = Number(match[1]);
    const y = Number(match[2]);
    return {
      minX: Math.min(result.minX, x),
      minY: Math.min(result.minY, y),
      maxX: Math.max(result.maxX, x),
      maxY: Math.max(result.maxY, y),
    };
  }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  if (!(width > 0) || !(height > 0)) throw new Error(`Degenerate canonical outline path for ${geometry.countryId}.`);

  const inner = FRAME_SIZE - FRAME_PADDING * 2;
  const scale = Math.min(inner / width, inner / height);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  const path = source.replace(POINT_PATTERN, (_point, rawX: string, rawY: string) => {
    const x = FRAME_SIZE / 2 + (Number(rawX) - centerX) * scale;
    const y = FRAME_SIZE / 2 + (Number(rawY) - centerY) * scale;
    return `${formatCoordinate(x)},${formatCoordinate(y)}`;
  });

  return {
    countryId: geometry.countryId,
    path,
    aspectRatio: width / height,
    subpathCount: (source.match(/[Mm]/g) ?? []).length,
  };
}

export function buildOutlineAsset(
  scope: StudyScope,
  active: readonly MapCountryGeometry[],
  context: readonly MapCountryGeometry[] = [],
): OutlineAsset {
  const all = [...active, ...context];
  const geometries = Object.fromEntries(all.map((geometry) => {
    const normalized = normalizeOutlineGeometry(geometry);
    return [normalized.countryId, normalized];
  }));

  return {
    scope,
    countryIds: active.map((geometry) => geometry.countryId),
    geometries,
  };
}

/**
 * Reuse the established target-selection/mastery curriculum, then replace only
 * the flag-oriented distractors with outline-specific plausible alternatives.
 */
export function buildOutlineQuiz(input: BuildOutlineQuizInput): Question[] {
  const supported = input.countries.filter((country) => input.asset.geometries[country.id]);
  const base = buildQuiz({
    countries: supported,
    progress: input.progress,
    scope: input.scope,
    mode: input.mode,
    size: input.size,
    sessionId: input.sessionId,
    targetCountryIds: input.targetCountryIds,
    now: input.now,
  });
  const rng = createSeededRandom(hashString(`${input.sessionId}:outline-distractors`));

  return base.map((question) => {
    const target = supported.find((country) => country.id === question.countryId);
    if (!target) throw new Error(`Outline quiz target missing from curriculum: ${question.countryId}.`);

    const distractors = chooseOutlineDistractors(target, supported, input.progress, input.asset, 3, rng);
    if (distractors.length !== 3) {
      throw new Error(`Outline quiz could not build three distractors for ${target.id}.`);
    }

    const optionCountryIds = distractors.map((country) => country.id);
    optionCountryIds.splice(question.correctIndex, 0, target.id);
    return { ...question, optionCountryIds };
  });
}

export function chooseOutlineDistractors(
  target: Country,
  candidates: Country[],
  progress: ProgressState,
  asset: OutlineAsset,
  count: number,
  rng: () => number,
): Country[] {
  const targetShape = asset.geometries[target.id];
  if (!targetShape) return [];
  const confusionCounts = getRecord(progress, target.id).confusionCounts;
  const seenNames = new Set([canonicalName(target.name)]);

  return candidates
    .filter((candidate) => candidate.id !== target.id && asset.geometries[candidate.id])
    .map((candidate) => ({
      candidate,
      score: distractorScore(target, candidate, targetShape, asset.geometries[candidate.id], confusionCounts) + rng() * 3,
    }))
    .sort((left, right) => right.score - left.score)
    .flatMap(({ candidate }) => {
      const name = canonicalName(candidate.name);
      if (seenNames.has(name)) return [];
      seenNames.add(name);
      return [candidate];
    })
    .slice(0, count);
}

function distractorScore(
  target: Country,
  candidate: Country,
  targetShape: OutlineGeometry,
  candidateShape: OutlineGeometry,
  confusionCounts: Record<string, number>,
): number {
  let score = (confusionCounts[candidate.id] ?? 0) * 1000;
  if (candidate.regionId === target.regionId) score += 90;
  else if (candidate.continentId === target.continentId) score += 30;

  const ratioDistance = Math.abs(Math.log(targetShape.aspectRatio / candidateShape.aspectRatio));
  score += Math.max(0, 55 - ratioDistance * 48);

  const partDistance = Math.abs(Math.log1p(targetShape.subpathCount) - Math.log1p(candidateShape.subpathCount));
  score += Math.max(0, 20 - partDistance * 14);
  return score;
}

function canonicalName(value: string): string {
  return value.trim().toLocaleLowerCase('en');
}

function formatCoordinate(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/0+$/, '').replace(/\.$/, '');
}

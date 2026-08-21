// Stored progress outlives the release that wrote it, can be truncated by a
// crashed write, and can be edited by hand. Every persisted field is parsed
// as `unknown` and rebuilt with these primitives, so a single `null` record
// or a `masteryStreak` of `null` never reaches a view as a thrown TypeError
// or a rendered NaN. Shared by every domain's storage module (and by
// evidence-storage.ts), which previously each carried their own copy.

export function parseJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

export function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function toConfusionCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {};
  const counts: Record<string, number> = {};
  for (const [countryId, raw] of Object.entries(value as Record<string, unknown>)) {
    const count = toCount(raw);
    if (count > 0) counts[countryId] = count;
  }
  return counts;
}

import type { Country } from '../../domain/models.js';
import { flagUrl } from '../../infrastructure/flags.js';

/**
 * Flags are fetched from a CDN, so any render can fail offline before the
 * service worker has cached that country. The frame reserves the row height and
 * carries a labelled fallback that `markFailedFlags` reveals on error, so a
 * missing image never becomes a silent dead end mid-round.
 */
export function flagImage(
  country: Country,
  revealed = false,
  frameClass = '',
  priority = false,
): string {
  const alt = revealed ? `${country.name} flag` : 'Flag to identify';
  const loading = priority ? 'eager' : 'lazy';
  const fetchPriority = priority ? 'high' : 'auto';
  // Thumbnails have no room for a sentence, so they show a mark and keep the
  // wording for assistive technology rather than shrinking type below 11px.
  const fallback = priority
    ? 'Flag image unavailable'
    : '<span aria-hidden="true">—</span><span class="visually-hidden">Flag image unavailable</span>';
  return `
    <span class="flag-frame ${frameClass}">
      <img class="flag-image" src="${flagUrl(country.iso2)}" alt="${alt}" loading="${loading}" fetchpriority="${fetchPriority}" decoding="async">
      <span class="flag-fallback">${fallback}</span>
    </span>
  `;
}

/**
 * Attach error handling to freshly rendered flags. Called immediately after the
 * view is written so listeners are in place before the network settles.
 */
export function markFailedFlags(scope: ParentNode): void {
  scope.querySelectorAll<HTMLImageElement>('img.flag-image').forEach((image) => {
    const fail = (): void => image.closest('.flag-frame')?.classList.add('flag-frame--failed');
    if (image.complete && image.naturalWidth === 0) {
      fail();
      return;
    }
    image.addEventListener('error', fail, { once: true });
  });
}

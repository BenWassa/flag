import type { Country } from '../../domain/models.js';
import { flagUrl } from '../../infrastructure/flags.js';

export function flagImage(
  country: Country,
  revealed = false,
  className = '',
  priority = false,
): string {
  const alt = revealed ? `${country.name} flag` : 'Flag to identify';
  const loading = priority ? 'eager' : 'lazy';
  const fetchPriority = priority ? 'high' : 'auto';
  return `<img class="flag-image ${className}" src="${flagUrl(country.iso2)}" alt="${alt}" loading="${loading}" fetchpriority="${fetchPriority}" decoding="async">`;
}

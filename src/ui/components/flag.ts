import type { Country } from '../../domain/models.js';
import { flagUrl } from '../../infrastructure/flags.js';

export function flagImage(country: Country, revealed = false, className = ''): string {
  const alt = revealed ? `${country.name} flag` : 'Flag to identify';
  return `<img class="flag-image ${className}" src="${flagUrl(country.iso2)}" alt="${alt}" loading="eager" decoding="async">`;
}

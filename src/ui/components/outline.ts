import type { OutlineGeometry } from '../../domain/outline.js';

/**
 * The unanswered SVG deliberately contains no country name, ISO code, title,
 * filename, answer-specific dimensions, or answer-bearing accessibility text.
 * The normalized path is the only country-specific DOM content because the
 * silhouette itself is the question.
 */
export function outlineSilhouette(geometry: OutlineGeometry, className = ''): string {
  return `
    <div class="outline-frame ${className}">
      <svg class="outline-svg" viewBox="0 0 100 100" role="img" aria-label="Country silhouette to identify" focusable="false" preserveAspectRatio="xMidYMid meet">
        <path d="${geometry.path}"></path>
      </svg>
    </div>
  `;
}

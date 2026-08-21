import { continentIcon } from './continent-icons.js';

/**
 * Source-derived continent geography, promoted into the earned crest treatment
 * by CSS only when the canonical achievement read model says it is earned.
 */
export function continentAchievementMark(continentId: string, earned: boolean): string {
  return `
    <span class="progress-continent-mark ${earned ? 'progress-continent-mark--crest' : ''}" aria-hidden="true">
      ${continentIcon(continentId)}
    </span>
  `;
}

/** Singular Atlas Crown artwork. It is never rendered as a locked decoration. */
export function worldCrownIcon(): string {
  return `
    <svg class="progress-world-crown" viewBox="0 0 48 48" aria-hidden="true" focusable="false" fill="currentColor">
      <path fill-rule="evenodd" d="M8 14.5 16.4 23 24 9.5 31.6 23 40 14.5 36.6 36H11.4L8 14.5Zm5.8 17.5h20.4l1.7-10.8-5.4 5.4L24 15.1l-6.5 11.5-5.4-5.4L13.8 32Z"/>
      <path d="M12 39h24v3H12z"/>
    </svg>
  `;
}

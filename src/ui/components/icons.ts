export type IconName = 'back' | 'close' | 'chevron' | 'ledger';

const PATHS: Record<IconName, string> = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  close: '<path d="M7 7l10 10M17 7L7 17"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  ledger: '<path d="M5 19v-6M12 19V5M19 19V9"/>',
};

export function icon(name: IconName, className = ''): string {
  return `<svg class="ui-icon ${className}" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${PATHS[name]}</svg>`;
}

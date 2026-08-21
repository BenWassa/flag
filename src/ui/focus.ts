export type RenderFocusIntent = 'none' | 'restore-or-autofocus';

/**
 * The browser owns focus during initial document boot. Later renders belong to
 * the client-side application and should preserve or deliberately move focus.
 */
export function renderFocusIntent(hasCompletedInitialRender: boolean): RenderFocusIntent {
  return hasCompletedInitialRender ? 'restore-or-autofocus' : 'none';
}

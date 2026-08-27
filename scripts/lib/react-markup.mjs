/**
 * Renders the production React screens to static markup so the plain-Node
 * invariant suite can assert against what learners are actually served.
 *
 * Before #100 those assertions ran against the legacy `src/ui/views/*` string
 * renderers, which stopped being the production path when React took over the
 * shipped screens. Asserting through this helper keeps the same invariants
 * while pointing them at the real production presentation.
 */
import { createElement } from 'react';
import { register } from 'node:module';
import { renderToStaticMarkup } from 'react-dom/server';

register('./asset-stub-loader.mjs', import.meta.url);

const { AtlasActionsContext } = await import('../../.verify-dist/react/actions.js');

/**
 * Every Atlas action is a no-op here: these assertions are about rendered
 * output, and behaviour is covered by the component and browser layers.
 */
const NOOP_ACTIONS = new Proxy({}, { get: () => () => {} });

/** Renders one screen with the Atlas action context its hooks require. */
export function renderScreen(Screen, props = {}) {
  return renderToStaticMarkup(
    createElement(AtlasActionsContext.Provider, { value: NOOP_ACTIONS }, createElement(Screen, props)),
  );
}

/** Loads a production screen module through the asset stub. */
export async function loadScreens(modulePath) {
  return import(`../../.verify-dist/react/screens/${modulePath}`);
}

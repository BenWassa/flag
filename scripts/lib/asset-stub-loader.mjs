/**
 * Vite resolves image imports to URLs; plain Node cannot. The verifier suite
 * imports the production React screens directly, so static asset specifiers are
 * redirected to a URL-shaped stub. Nothing asserts on the stub value — the
 * screens under test render markup, not artwork (#100).
 */
const ASSET_PATTERN = /\.(png|jpe?g|svg|webp|avif|gif)(\?.*)?$/;

export async function resolve(specifier, context, next) {
  if (ASSET_PATTERN.test(specifier)) {
    return { url: new URL('./asset-stub-value.mjs', import.meta.url).href, shortCircuit: true };
  }
  return next(specifier, context);
}

import { COUNTRY_BY_ID } from './data/countries.js';
import { loadMapAsset } from './data/maps/index.js';
import { landAdjacencyForScope } from './data/neighbors/index.js';
import type { MapRegionAsset } from './domain/map-models.js';
import { deriveNeighborMapModel } from './domain/neighbor-map.js';
import { patchNeighborMapShell, renderNeighborMap } from './ui/components/neighbor-map.js';

const root = document.querySelector<HTMLElement>('#app');
const assetByScopeId = new Map<string, MapRegionAsset>();
const assetPromiseByScopeId = new Map<string, Promise<MapRegionAsset | null>>();
let detachedShell: { key: string; node: HTMLElement } | null = null;

function nameForId(countryId: string): string {
  return COUNTRY_BY_ID.get(countryId)?.name ?? countryId;
}

function idsFrom(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function stateFingerprint(foundIds: readonly string[], revealedIds: readonly string[]): string {
  return `${foundIds.join(',')}|${revealedIds.join(',')}`;
}

function loadScopeAsset(scopeId: string): Promise<MapRegionAsset | null> {
  const cached = assetByScopeId.get(scopeId);
  if (cached) return Promise.resolve(cached);

  const existing = assetPromiseByScopeId.get(scopeId);
  if (existing) return existing;

  const promise = loadMapAsset(scopeId)
    .then((asset) => {
      assetPromiseByScopeId.delete(scopeId);
      if (asset) assetByScopeId.set(scopeId, asset);
      return asset;
    })
    .catch((error: unknown) => {
      assetPromiseByScopeId.delete(scopeId);
      throw error;
    });
  assetPromiseByScopeId.set(scopeId, promise);
  return promise;
}

function captureShell(node: Node): void {
  if (!(node instanceof Element)) return;
  const shell = node.matches('.neighbor-map-shell')
    ? node
    : node.querySelector<HTMLElement>('.neighbor-map-shell');
  if (!(shell instanceof HTMLElement)) return;
  const key = shell.dataset.neighborMapKey;
  if (!key) return;
  detachedShell = { key, node: shell };
}

function roundFromHost(host: HTMLElement) {
  const targetId = host.dataset.targetId;
  const scopeId = host.dataset.scopeId;
  if (!targetId) throw new Error('Neighbor map host is missing its target id.');
  if (!scopeId) throw new Error('Neighbor map host is missing its scope id.');
  const adjacency = landAdjacencyForScope(scopeId);
  if (!adjacency) throw new Error(`No canonical adjacency is available for scope ${scopeId}.`);
  const neighborIds = adjacency[targetId] ?? [];
  if (!neighborIds.length) throw new Error(`No canonical adjacency is available for ${targetId}.`);
  return {
    targetId,
    neighborIds,
    foundIds: idsFrom(host.dataset.foundIds),
    revealedIds: idsFrom(host.dataset.revealedIds),
  };
}

function hostKey(host: HTMLElement): string {
  const key = host.dataset.neighborMapKey;
  if (!key) throw new Error('Neighbor map host is missing its session key.');
  return key;
}

function renderFailure(host: HTMLElement): void {
  if (!host.isConnected) return;
  host.dataset.neighborMapStatus = 'error';
  host.innerHTML = '<p class="neighbor-map-unavailable">Map unavailable. Continue with the country entry field.</p>';
}

function applyAsset(host: HTMLElement, asset: MapRegionAsset): void {
  if (!host.isConnected) return;
  const round = roundFromHost(host);
  const key = hostKey(host);
  const fingerprint = stateFingerprint(round.foundIds, round.revealedIds);
  const model = deriveNeighborMapModel(asset, round, nameForId);

  const reusable = detachedShell?.key === key ? detachedShell.node : null;
  if (detachedShell && !reusable) detachedShell = null;
  if (reusable) {
    detachedShell = null;
    host.replaceChildren(reusable);
    patchNeighborMapShell(reusable, model, fingerprint);
  } else {
    host.innerHTML = renderNeighborMap(asset, model, key, fingerprint);
  }
  host.dataset.neighborMapStatus = 'ready';
}

function hydrateHost(host: HTMLElement): void {
  if (host.dataset.neighborMapStatus === 'loading' || host.dataset.neighborMapStatus === 'ready') return;
  const key = host.dataset.neighborMapKey;
  const scopeId = host.dataset.scopeId;
  if (!key || !scopeId) return;

  const cached = assetByScopeId.get(scopeId);
  if (cached) {
    try {
      applyAsset(host, cached);
    } catch {
      renderFailure(host);
    }
    return;
  }

  host.dataset.neighborMapStatus = 'loading';
  void loadScopeAsset(scopeId)
    .then((asset) => {
      if (!host.isConnected) return;
      if (!asset) {
        renderFailure(host);
        return;
      }
      applyAsset(host, asset);
    })
    .catch(() => renderFailure(host));
}

function discoverHosts(): void {
  if (!root) return;
  root.querySelectorAll<HTMLElement>('[data-neighbor-map-host]').forEach(hydrateHost);
}

function hasFocusedNeighborEntry(): boolean {
  return document.activeElement instanceof HTMLElement
    && document.activeElement.closest('.neighbor-entry') !== null;
}

function syncNeighborEntryViewport(): void {
  if (!root) return;
  if (!root.querySelector('.neighbor-quiz-page') || !hasFocusedNeighborEntry()) {
    root.removeAttribute('data-neighbor-entry-active');
    root.style.removeProperty('--neighbor-visual-height');
    return;
  }

  root.dataset.neighborEntryActive = 'true';
  const viewport = window.visualViewport;
  if (!viewport || viewport.scale !== 1) {
    root.style.removeProperty('--neighbor-visual-height');
    return;
  }

  root.style.setProperty('--neighbor-visual-height', `${Math.round(viewport.height)}px`);
}

if (root) {
  new MutationObserver((records) => {
    for (const record of records) for (const node of record.removedNodes) captureShell(node);
    discoverHosts();
    queueMicrotask(syncNeighborEntryViewport);
  }).observe(root, { childList: true, subtree: true });

  document.addEventListener('focusin', syncNeighborEntryViewport);
  document.addEventListener('focusout', () => queueMicrotask(syncNeighborEntryViewport));
  window.visualViewport?.addEventListener('resize', syncNeighborEntryViewport);

  discoverHosts();
  syncNeighborEntryViewport();
}

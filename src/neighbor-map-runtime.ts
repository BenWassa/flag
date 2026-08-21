import { COUNTRY_BY_ID } from './data/countries.js';
import { loadMapAsset } from './data/maps/index.js';
import { AFRICA_LAND_ADJACENCY } from './data/neighbors/index.js';
import type { MapRegionAsset } from './domain/map-models.js';
import { deriveNeighborMapModel } from './domain/neighbor-map.js';
import { patchNeighborMapShell, renderNeighborMap } from './ui/components/neighbor-map.js';

const root = document.querySelector<HTMLElement>('#app');
let africaAsset: MapRegionAsset | null = null;
let africaAssetPromise: Promise<MapRegionAsset | null> | null = null;
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

function loadAfricaAsset(): Promise<MapRegionAsset | null> {
  if (africaAsset) return Promise.resolve(africaAsset);
  africaAssetPromise ??= loadMapAsset('africa').then((asset) => {
    africaAsset = asset;
    return asset;
  });
  return africaAssetPromise;
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
  if (!targetId) throw new Error('Neighbor map host is missing its target id.');
  const neighborIds = AFRICA_LAND_ADJACENCY[targetId] ?? [];
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
  if (!key) return;

  if (africaAsset) {
    try {
      applyAsset(host, africaAsset);
    } catch {
      renderFailure(host);
    }
    return;
  }

  host.dataset.neighborMapStatus = 'loading';
  void loadAfricaAsset()
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

function hasFocusedNeighborInput(): boolean {
  return document.activeElement instanceof HTMLElement
    && document.activeElement.matches('[data-neighbor-input]');
}

function syncNeighborEntryViewport(): void {
  if (!root) return;
  if (!root.querySelector('.neighbor-quiz-page') || !hasFocusedNeighborInput()) {
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

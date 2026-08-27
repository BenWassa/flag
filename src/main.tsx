import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './map-viewport.js';
import './neighbor-map-runtime.js';
import { AtlasApp } from './react/AtlasApp.js';
import { AppErrorBoundary } from './react/components/AppErrorBoundary.js';
import { remoteAccountServicesEnabled } from './infrastructure/runtime-environment.js';

const root = document.querySelector('#app');
if (!(root instanceof HTMLDivElement)) throw new Error('App root not found.');

createRoot(root).render(<StrictMode><AppErrorBoundary><AtlasApp /></AppErrorBoundary></StrictMode>);

// Account-backed persistence is deliberately outside the application startup
// dependency chain. A Firebase import/network failure must never prevent Atlas
// from rendering or using its local learning repositories. Development sandbox
// builds do not import the production Firebase module at all.
if (remoteAccountServicesEnabled) {
  void import('./infrastructure/cloud-sync-service.js').then(({ CLOUD_STATE_RESTORED_EVENT, startCloudSync }) => {
    // AppStore is intentionally local-first and constructed synchronously. If a
    // sign-in restores stronger/new cloud state, one durable hash-route reload
    // reconstructs AppStore through the same local migrations/sanitisers. The
    // reconciliation write is stable, so the next load does not loop.
    window.addEventListener(CLOUD_STATE_RESTORED_EVENT, () => window.location.reload(), { once: true });
    startCloudSync();
  }).catch(() => undefined);
}

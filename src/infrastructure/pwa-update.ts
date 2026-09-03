export const PWA_UPDATE_MIN_INTERVAL_MS = 15 * 60 * 1000;
export const PWA_UPDATE_FOREGROUND_ABSENCE_MS = 5 * 60 * 1000;
export const PWA_UPDATE_VISIBLE_INTERVAL_MS = 60 * 60 * 1000;

const PWA_UPDATE_LAUNCH_DELAY_MS = 750;
const PWA_UPDATE_WAITING_RETRY_MS = 10_000;
const ADOPTED_BUILD_SESSION_KEY = 'flag-atlas-adopted-build';

interface UpdateSafetyQuery {
  type: 'ATLAS_UPDATE_SAFETY_QUERY';
  requestId: string;
  buildIdentity: string;
}

interface UpdateActivatedMessage {
  type: 'ATLAS_UPDATE_ACTIVATED';
  buildIdentity: string;
}

type WorkerMessage = UpdateSafetyQuery | UpdateActivatedMessage;

export interface PwaUpdateLifecycle {
  signalSafetyChange(): void;
  dispose(): void;
}

interface PwaUpdateLifecycleOptions {
  isApplicationSafe(): boolean;
}

let activeSafetySignal: (() => void) | null = null;

export function signalPwaUpdateSafetyChange(): void {
  activeSafetySignal?.();
}

function currentBuildIdentity(): string {
  return document.querySelector<HTMLMetaElement>('meta[name="atlas-build"]')?.content ?? 'development';
}

function workerMessage(value: unknown): value is WorkerMessage {
  if (!value || typeof value !== 'object') return false;
  const type = (value as { type?: unknown }).type;
  return type === 'ATLAS_UPDATE_SAFETY_QUERY' || type === 'ATLAS_UPDATE_ACTIVATED';
}

export function installPwaUpdateLifecycle({ isApplicationSafe }: PwaUpdateLifecycleOptions): PwaUpdateLifecycle {
  if (!('serviceWorker' in navigator)) return { signalSafetyChange() {}, dispose() {} };

  let disposed = false;
  let registration: ServiceWorkerRegistration | null = null;
  let hiddenAt: number | null = document.visibilityState === 'hidden' ? Date.now() : null;
  let lastUpdateAttemptAt = 0;
  let compositionActive = false;
  let controllerChanged = false;
  let reloadTarget: string | null = null;
  let launchTimer: number | null = null;

  const safeNow = () => isApplicationSafe()
    && !compositionActive
    && !document.querySelector('.is-launching');

  const reloadForActivatedBuild = (buildIdentity: string) => {
    if (buildIdentity === currentBuildIdentity()) return;
    const previouslyAdopted = sessionStorage.getItem(ADOPTED_BUILD_SESSION_KEY);
    if (previouslyAdopted === buildIdentity) return;
    sessionStorage.setItem(ADOPTED_BUILD_SESSION_KEY, buildIdentity);
    window.location.reload();
  };

  const attemptAdoption = () => {
    if (disposed || !registration?.waiting || !safeNow()) return;
    registration.waiting.postMessage({ type: 'ATLAS_UPDATE_ATTEMPT' });
  };
  activeSafetySignal = attemptAdoption;

  const watchInstallingWorker = (worker: ServiceWorker | null) => {
    if (!worker) return;
    const installed = () => {
      if (worker.state === 'installed') attemptAdoption();
    };
    worker.addEventListener('statechange', installed);
    installed();
  };

  const watchRegistration = (next: ServiceWorkerRegistration) => {
    registration = next;
    watchInstallingWorker(next.installing);
    next.addEventListener('updatefound', () => watchInstallingWorker(next.installing));
    attemptAdoption();
  };

  const requestUpdate = async (allowThrottleBypass = false) => {
    if (disposed || !registration || !navigator.onLine) return;
    const now = Date.now();
    if (!allowThrottleBypass && now - lastUpdateAttemptAt < PWA_UPDATE_MIN_INTERVAL_MS) return;
    lastUpdateAttemptAt = now;
    try {
      await registration.update();
    } catch {
      // Update discovery is deliberately non-fatal. The current cached build
      // remains authoritative until a replacement installs successfully.
    } finally {
      attemptAdoption();
    }
  };

  const message = (event: MessageEvent<unknown>) => {
    if (!workerMessage(event.data)) return;
    if (event.data.type === 'ATLAS_UPDATE_SAFETY_QUERY') {
      event.ports[0]?.postMessage({
        type: 'ATLAS_UPDATE_SAFETY_RESPONSE',
        requestId: event.data.requestId,
        safe: safeNow(),
      });
      return;
    }

    reloadTarget = event.data.buildIdentity;
    if (reloadTarget === currentBuildIdentity()) return;
    // The worker sends ATLAS_UPDATE_ACTIVATED only after clients.claim()
    // resolves. controllerchange is retained as a second signal because some
    // engines deliver it before the worker message and some just after it.
    if (controllerChanged || navigator.serviceWorker.controller) reloadForActivatedBuild(reloadTarget);
  };

  const controllerChange = () => {
    controllerChanged = true;
    if (reloadTarget) reloadForActivatedBuild(reloadTarget);
  };

  const visibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      return;
    }
    const wasHiddenAt = hiddenAt;
    hiddenAt = null;
    attemptAdoption();
    if (wasHiddenAt !== null && Date.now() - wasHiddenAt >= PWA_UPDATE_FOREGROUND_ABSENCE_MS) {
      void requestUpdate();
    }
  };

  const online = () => {
    // An online transition follows an offline period, so it may bypass the
    // ordinary per-client throttle once and converge promptly.
    void requestUpdate(true);
  };

  const compositionStart = () => { compositionActive = true; };
  const compositionEnd = () => { compositionActive = false; attemptAdoption(); };

  navigator.serviceWorker.addEventListener('message', message);
  navigator.serviceWorker.addEventListener('controllerchange', controllerChange);
  document.addEventListener('visibilitychange', visibilityChange);
  document.addEventListener('compositionstart', compositionStart);
  document.addEventListener('compositionend', compositionEnd);
  window.addEventListener('online', online);

  const longSessionTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible' && navigator.onLine) void requestUpdate();
  }, PWA_UPDATE_VISIBLE_INTERVAL_MS);
  // This is not network polling: it only asks an already-waiting Atlas worker
  // to retry the fail-closed client handshake. It covers a blocking tab that
  // disappears without emitting a safety-boundary signal in another client.
  const waitingRetryTimer = window.setInterval(attemptAdoption, PWA_UPDATE_WAITING_RETRY_MS);

  const register = async () => {
    if (disposed) return;
    try {
      const next = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
      if (disposed) return;
      watchRegistration(next);
      launchTimer = window.setTimeout(() => {
        launchTimer = null;
        void requestUpdate();
      }, PWA_UPDATE_LAUNCH_DELAY_MS);
    } catch {
      // Registration failure must not prevent Atlas from running without the
      // update/offline enhancement available in this session.
    }
  };

  const load = () => { void register(); };
  window.addEventListener('load', load);
  if (document.readyState === 'complete') void register();

  return {
    signalSafetyChange: attemptAdoption,
    dispose() {
      disposed = true;
      if (activeSafetySignal === attemptAdoption) activeSafetySignal = null;
      if (launchTimer !== null) window.clearTimeout(launchTimer);
      window.clearInterval(longSessionTimer);
      window.clearInterval(waitingRetryTimer);
      window.removeEventListener('load', load);
      window.removeEventListener('online', online);
      document.removeEventListener('visibilitychange', visibilityChange);
      document.removeEventListener('compositionstart', compositionStart);
      document.removeEventListener('compositionend', compositionEnd);
      navigator.serviceWorker.removeEventListener('message', message);
      navigator.serviceWorker.removeEventListener('controllerchange', controllerChange);
    },
  };
}

import { parseRoutePath, serializeRoutePath, type AppRoute } from './routes.js';

export interface RouteNavigationOptions {
  replace?: boolean;
}

export interface AppRouter {
  current(): AppRoute | null;
  navigate(route: AppRoute, options?: RouteNavigationOptions): void;
  back(): void;
  subscribe(listener: (route: AppRoute | null) => void): () => void;
}

export function createHashRouter(browserWindow: Window): AppRouter {
  const listeners = new Set<(route: AppRoute | null) => void>();
  let lastObservedUrl = browserWindow.location.href;

  const read = (): AppRoute | null => {
    const hashPath = browserWindow.location.hash.slice(1) || '/';
    return parseRoutePath(hashPath);
  };

  const emit = (): void => {
    for (const listener of listeners) listener(read());
  };

  const observeBrowserNavigation = (): void => {
    if (browserWindow.location.href === lastObservedUrl) return;
    lastObservedUrl = browserWindow.location.href;
    emit();
  };

  browserWindow.addEventListener('popstate', observeBrowserNavigation);
  browserWindow.addEventListener('hashchange', observeBrowserNavigation);

  return {
    current: read,
    navigate(route, options = {}) {
      const hash = `#${serializeRoutePath(route)}`;
      const url = `${browserWindow.location.pathname}${browserWindow.location.search}${hash}`;
      if (options.replace) browserWindow.history.replaceState(null, '', url);
      else browserWindow.history.pushState(null, '', url);
      lastObservedUrl = browserWindow.location.href;
      emit();
    },
    back() {
      browserWindow.history.back();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

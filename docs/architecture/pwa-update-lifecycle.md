# PWA update lifecycle

**Status:** architecture decision  
**Tracking:** #191  
**Audit baseline:** `99880921a98a006ba3daae391d50a4b3c447acbe`  
**Primary production host:** GitHub Pages  
**Secondary production host:** Firebase Hosting

## Product contract

Atlas is an offline-capable mobile-first application, not a site that expects learners to manage browser caches. When a newer production build is available and the device is online, Atlas should discover it automatically and converge onto it promptly without pull-to-refresh, manual reload, storage clearing or reinstallation.

Freshness must not destroy immediate learning work. An active ephemeral round is more important than taking an application update a few minutes earlier.

The invariant is therefore:

> Atlas automatically discovers the newest available build when online and automatically adopts it at the next safe application boundary. An update must not reload away an active learning round or create a mixed-version application.

Caching remains first-class. The update lifecycle coordinates cached versions; it does not disable the PWA cache.

## Current production audit

The baseline audited for this decision is `99880921a98a006ba3daae391d50a4b3c447acbe`.

### Registration

`vite-plugin-pwa` uses `injectManifest` to build `src/sw.ts` as the stable production `sw.js`. `injectRegister` is disabled; Atlas registers the worker itself from `src/react/AtlasApp.tsx` after `window.load` (or immediately if the document is already complete):

```ts
navigator.serviceWorker.register('./sw.js')
```

There is no explicit `updateViaCache` policy, no application-owned `registration.update()` schedule and no page/worker protocol for a waiting update.

### Worker lifecycle

The current worker runs both of these unconditionally:

```ts
self.skipWaiting();
clientsClaim();
```

That makes a new worker activate and claim clients as quickly as possible. This was sufficient for the earlier production-PWA recovery gate, but it is not the consistency model Atlas now requires. Atlas lazy-loads content-hashed geography and other versioned chunks, so an old document must not unpredictably start fetching through a new worker whose cache/application graph belongs to another build.

Workbox explicitly cautions against indiscriminate `skipWaiting()` when a page lazy-loads uniquely versioned resources: the old page can request assets that the new deployment no longer exposes. Atlas falls into that category.

### Production artifact

The exact Pages artifact for the audit baseline contains:

- stable mutable entry names including `app.js`, `map-viewport.js`, `neighbor-map-runtime.js` and stable CSS filenames;
- content-hashed application chunks under `assets/`;
- content-hashed lazy continent geography chunks;
- a generated `sw.js` with a Workbox precache manifest.

Workbox gives stable precached shell URLs content revisions. Content-hashed shell chunks are precached with their URL hash as identity. Lazy continent geography stays out of the precache and is cached at runtime after successful use.

This split is sound and should be preserved.

### Manual custom-cache generation

`src/sw.ts` currently uses `flag-atlas-v30` / `flag-atlas-v29` to name and clean custom runtime caches. `scripts/verify-vite-build.mjs` and the PWA fixture builder also encode the current number.

That counter has historically been advanced when shell/cache-affecting changes ship. Routine release freshness must no longer depend on a developer remembering to increment it. Workbox revisions and content-addressed build assets already provide mechanical application-release invalidation.

A manual cache schema generation may remain only for a genuinely incompatible change to Atlas's own runtime-cache data/policy, and that narrow role must be explicit.

### Existing A → B regression

`tests/browser/pwa-runtime.spec.ts` already has a valuable two-production-artifact harness. It proves service-worker control, cached shell reopening, previously used lazy geography offline, expected failure for first-ever lazy geography while offline, and same-origin update recovery.

Its current deployment transition is not product-owned: the test itself calls `registration.update()` and then manually reloads the page. That is useful recovery evidence but does not prove automatic discovery or automatic safe adoption.

## Platform constraints

### The service-worker lifecycle is the version boundary

A stable service-worker URL is the correct update mechanism. The browser compares the worker script during an update check and installs a changed worker. A newly installed worker normally waits while an older worker still controls clients.

Atlas should use that waiting phase deliberately rather than fighting it.

### Explicit checks are standard

`ServiceWorkerRegistration.update()` is the standard API for requesting an update check. Browser-originated periodic checks remain useful fallback behaviour, but Atlas should not rely on an unspecified browser schedule for product freshness.

Registering with `updateViaCache: 'none'` ensures the service-worker script and its imports are not satisfied from the HTTP cache during the update algorithm. This is the correct policy for a small stable `sw.js` whose job is to identify the application release.

### Activation affects the registration, not one convenient tab

Activating a waiting worker can change which worker controls existing clients. Therefore update safety cannot be decided by whichever Atlas tab happens to notice the update first.

If one client is safely on Home while another is in Locations Play, the Home client must not force global activation. Atlas needs a small all-client safety handshake before requesting `skipWaiting()`.

### Stock forced-auto-update modes are not the Atlas policy

`vite-plugin-pwa` can configure automatic update/reload behaviour that uses `skipWaiting`/`clientsClaim`. Its own guidance warns that automatic reload can lose form data. Atlas has a stronger version of that problem: active quiz state is intentionally ephemeral.

Atlas therefore keeps application-owned registration/update coordination rather than delegating adoption to an unconditional auto-update mode.

### Suspended mobile applications cannot depend on timers

Chrome/Android and Safari/iOS support the standard service-worker lifecycle, but a backgrounded mobile web app may have timers throttled or suspended. Foreground and connectivity events are therefore primary discovery opportunities. A long-session interval is only a supplementary trigger while Atlas is actually running and visible.

## Chosen lifecycle

The lifecycle is:

```text
render Atlas immediately
        |
        v
register stable ./sw.js
(updateViaCache: none)
        |
        v
non-blocking update check
        |
        v
new worker installs and WAITS
        |
        v
mark update pending
        |
        v
query all live Atlas window clients
        |
        +---- any client unsafe / no response ----+
        |                                         |
        |                                keep update waiting
        |                                         |
        |                                retry at next safe signal
        |
        +---- all relevant clients safe ----------+
                                                  |
                                                  v
                                      tell waiting worker to activate
                                                  |
                                                  v
                                           controllerchange
                                                  |
                                                  v
                                     one guarded reload per client
                                                  |
                                                  v
                                         new build owns document
```

There is no routine learner-facing confirmation step. If the application can safely update itself, it should do so.

## Discovery policy

Service-worker registration remains outside the critical first-render path. Once registration exists, Atlas owns conservative update discovery.

Use these triggers:

1. **Launch:** request one non-blocking update check shortly after registration when online.
2. **Foreground:** when Atlas becomes visible after being hidden for at least **5 minutes**, request a check if the general throttle permits it.
3. **Reconnect:** on an `online` transition, request a check. A reconnect after an offline/failed attempt may bypass the normal throttle once so an offline session can converge promptly.
4. **Long-running session:** while Atlas remains visible and online, an **hourly** interval may request a check.

Use a **15-minute minimum interval between ordinary automatic update attempts**. The throttle applies across launch/foreground/interval triggers within a client; ordinary route changes and user actions never trigger checks.

The implementation may adjust these constants slightly if browser evidence demonstrates a concrete need, but it must preserve the intent: launch/reconnect/meaningful-foreground freshness without network requests on every visibility event.

Update errors are non-fatal and silent unless they reveal a material application problem. Failure to check for a newer version cannot block the cached current version from starting.

## Safe update boundary

A client reports **unsafe** whenever reloading would discard meaningful immediate state. This includes at minimum:

- any live Flags Play round or its session-backed results;
- any live Locations round or its session-backed results;
- any live Outlines round or its session-backed results;
- any live Neighbours round or its session-backed results;
- Neighbours text entry during a live round;
- any pending asynchronous round launch/transition;
- active IME composition or other meaningful unsaved editable input.

A client is **safe** when it is on a durable stable navigation surface, has no active ephemeral round/session, has no pending launch and has no meaningful unsaved editable interaction. Expected safe examples include Home, Profile, domain/scope launchers and equivalent stable Spatial Atlas navigation surfaces.

The rule is state-based rather than a brittle list of route names. A future surface that acquires meaningful ephemeral input becomes unsafe even if its route was historically safe.

Completing or deliberately exiting a round re-evaluates any pending update automatically. Atlas does not persist or cloud-sync active quiz sessions merely to make update reloads convenient.

## Waiting-worker coordination

Use the smallest robust cross-client protocol needed for update safety. The service worker is the natural coordinator; Atlas does not need a general leader-election or cross-tab state system.

A practical protocol is:

1. a page observes a waiting worker and asks for an adoption attempt;
2. the coordinator enumerates in-scope `window` clients, including uncontrolled clients where claiming could affect them;
3. it sends a nonce-scoped `UPDATE_SAFETY_QUERY` to each current client;
4. every client answers `safe` or `unsafe` from authoritative current application state;
5. missing or timed-out responses fail closed as unsafe;
6. immediately before commit, the coordinator revalidates the relevant client set so a newly opened client cannot be skipped accidentally;
7. only when every relevant live client is safe does the waiting worker receive the activation/`SKIP_WAITING` command;
8. a client becoming safe after a previous refusal requests another adoption attempt.

Clients that close disappear from a later enumeration, so a stale unsafe tab cannot permanently wedge the update.

### `clientsClaim()`

Retain `clientsClaim()` unless implementation evidence demonstrates a better first-install contract.

Its current useful behaviour is that the first installed worker can control the already-open first-visit document, allowing subsequently requested lazy geography to be runtime-cached during that first session. Removing it casually would weaken a tested offline behaviour.

`clientsClaim()` is safe under the new model only because update activation is no longer unconditional. The all-client safety query must include any in-scope window that could be claimed when the new worker activates.

## Controlled adoption and reload

Once the waiting worker activates, `controllerchange` is the page signal that a new controller is ready.

Each affected client performs exactly one controlled reload for the committed update. Reload logic must distinguish a coordinated update from ordinary initial control/claim and must be guarded against loops, for example with a short-lived per-build/controller adoption marker.

Do not reload merely because `controllerchange` fired during first installation.

This gives Atlas one consistency rule: a document and its application module graph belong to one build. The new worker does not become the ordinary fetch authority for an old active document until Atlas has determined that replacing that document is safe.

## Cold launch and reopen

A returning learner may begin from cached application A while production B is already deployed.

When online:

1. render cached/current A without waiting for the network;
2. register/recover the stable worker;
3. request the launch update check;
4. download/install B in the background if available;
5. if every client is already safe, activate and perform the one controlled reload promptly;
6. if the learner has entered meaningful active work first, defer until the next safe boundary.

The same contract applies to an ordinary browser tab and an installed standalone PWA. A learner should not need to know whether the browser found B during registration, launch update, foreground update or reconnect update.

If no controlled clients remain, the browser may naturally promote a waiting worker through the normal lifecycle; the next cold launch then loads the current build without a forced page reload.

## Cache and version ownership

### Routine application releases

Use existing mechanical identities:

- Workbox revision hashes for stable precached URLs such as `index.html`, stable JS entries and stable CSS;
- content hashes in Vite chunk filenames;
- the generated production build identity for diagnostics.

No routine application release should require incrementing a hand-maintained service-worker/cache number.

### Atlas runtime caches

Give custom caches a stable Atlas-owned namespace plus an explicit schema generation only where the cached data/policy itself is incompatible. For example, `flag-atlas-runtime-v1` and `flag-atlas-flags-v1` are preferable to treating every application deployment as a new cache schema.

Increment that schema generation only when the runtime cache contract genuinely changes in a way that requires replacement. Document the reason in the implementing change.

Cache cleanup must remain restricted to Atlas-owned cache names. `benwassa.github.io` is a shared origin; Atlas must never delete arbitrary CacheStorage entries belonging to another application.

Do not purge the working offline shell merely because an update check failed. Workbox may clean its own obsolete precaches through its supported lifecycle once the replacement worker is installed/activated.

## Offline and failure behaviour

Offline remains a valid steady state:

- cached Atlas starts and continues working;
- a failed update request is ignored by startup;
- existing cached shell/runtime geography is not purged;
- first-ever lazy geography while offline remains outside the current promise;
- durable learner progress continues through existing local persistence.

On connectivity restoration Atlas triggers update discovery automatically. A newer worker may install in the background, then follows the same all-client safe-adoption rule.

If B is malformed, unreachable or fails to install, A remains the active application. Atlas must not convert “could not update” into “cannot launch”.

## Build identity and diagnostics

Introduce one mechanically generated **Atlas build identity** derived from the exact production commit/build. It is diagnostic metadata, not a second product release/version system.

The build pipeline should inject the exact checked-out production SHA into a stable diagnostic seam available to tests and debugging, for example:

```html
<meta name="atlas-build" content="<full commit sha>">
```

and/or a compile-time constant shared by the page/update coordinator.

The Pages and Firebase workflows already check out the successful `workflow_run.head_sha`; build identity must use that same resolved SHA rather than assuming the workflow's own `GITHUB_SHA` always names the deployed application commit.

The existing `ATLAS_PWA_RUNTIME_BUILD_MARKER` test-fixture concept should be evolved into this same seam rather than leaving a parallel identity system.

Ordinary learners do not need visible version chrome.

## Hosting and HTTP-cache policy

Service-worker correctness cannot depend on a particular CDN cache configuration. The stable worker URL plus explicit `update()` and `updateViaCache: 'none'` is the primary freshness mechanism.

### GitHub Pages

GitHub Pages is the primary production origin and the repository does not have a per-path response-header configuration surface in its Pages workflow. Therefore Atlas must remain correct under the headers Pages supplies.

Do not move to timestamp query strings or a new worker filename to compensate for hosting limitations.

### Firebase Hosting

Firebase Hosting supports path-specific response headers through `firebase.json`. The implementation should use them as a complementary optimisation:

| Resource class | Intended Firebase policy |
| --- | --- |
| `sw.js` | revalidate (`no-cache` or equivalent `max-age=0, must-revalidate`) |
| `index.html` / navigation shell | revalidate |
| stable mutable `app.js`, stable runtime entries and stable CSS | revalidate |
| content-addressed hashed JS/assets | long-lived immutable caching |
| stable manifest/icons | revalidate unless the filename itself is content-addressed |

GitHub Pages must still pass the same A → B lifecycle without these project-controlled headers.

### Required live-header evidence

This architecture pass inspected the actual deployment configuration, successful Pages/Firebase deployment records and exact Pages build artifact. The available research harness could not reliably retrieve raw response headers from the live Atlas origins, so no exact live header values are asserted here.

Issue #191 must capture the real deployed headers for the exact implementation SHA on both hosts for:

- root/navigation document;
- `index.html` where directly addressable;
- `sw.js`;
- `app.js`;
- representative stable CSS;
- representative hashed chunk.

If observed behaviour differs from the assumptions above, correct the host-specific optimisation without weakening the application-owned update lifecycle.

## Test strategy

The implementation gate must exercise two real production artifacts at one origin. The test server may expose version switches and request logs, but the browser test must not perform the update action that production code is supposed to own.

### Fresh install

Prove:

- first online visit installs/controls correctly;
- the shell reopens offline;
- first-session lazy geography retains the current runtime-cache behaviour.

### Returning A → B learner

1. install and use production artifact A;
2. populate shell and lazy-geography caches;
3. switch the same origin to production artifact B;
4. reopen or foreground Atlas;
5. observe Atlas itself request the service-worker update — no test-side `registration.update()` as the simulated learner action;
6. observe B install/wait;
7. observe automatic safe activation and exactly one reload;
8. assert the running build identity is B;
9. assert no manual browser reload was required.

Server request logging or browser service-worker inspection may be used as evidence that the production runtime initiated discovery.

### Active-round deferral

Start a real round on A, deploy B and prove B can be discovered/installed without destroying that round. Finish or exit to the defined safe boundary and prove adoption then occurs automatically.

### Offline transition

Run A offline, deploy B while disconnected, restore connectivity and prove the `online` trigger discovers B and safe adoption follows.

### Long-open session

Exercise the foreground/interval policy without reloading the page first and prove Atlas requests the update itself.

### Multi-client

Use at least two clients under one registration. Keep one in an active round and one on a safe surface. B must wait until both are safe; no tab may reload-loop or force the other out of the round. Closing a blocking tab must allow a later coordination attempt to progress.

### Failure

Make the update endpoint unavailable/broken and prove A remains usable, including its existing offline shell.

### Retained PWA contracts

Continue to prove:

- Pages subpath and service-worker scope correctness;
- offline shell reopening;
- previously cached lazy geography offline;
- honest first-use-lazy-geography offline behaviour;
- current runtime-cache ownership;
- Firebase live-origin PWA behaviour;
- exact `dist/` inspection.

Physical Android/iPhone/installed-PWA evidence remains Issue #71's responsibility and must be gathered only after #191 is merged and deployed.

## Non-goals

This lifecycle does not authorise:

- disabling offline caching;
- arbitrary timestamp/query-string cache busting;
- a release-specific service-worker filename;
- continuous polling;
- persisting/cloud-syncing active quiz sessions solely to permit reloads;
- changing learning, scoring, evidence, Mastery or progress-storage semantics;
- a manual “clear cache” learner feature;
- routine “Refresh now” update UI;
- a general-purpose cross-tab application-state architecture;
- unrelated #71 interaction redesign.

## References

Authoritative/current guidance used for this decision:

- MDN — `ServiceWorkerRegistration.update()`: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update
- MDN — `ServiceWorkerRegistration.updateViaCache`: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/updateViaCache
- MDN — `ServiceWorkerContainer.register()`: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register
- web.dev — The service worker lifecycle: https://web.dev/articles/service-worker-lifecycle
- Workbox — `workbox-core` (`skipWaiting` lifecycle guidance): https://developer.chrome.com/docs/workbox/modules/workbox-core
- Workbox — `workbox-window` update lifecycle: https://developer.chrome.com/docs/workbox/modules/workbox-window
- vite-plugin-pwa — Periodic service-worker updates: https://vite-pwa-org.netlify.app/guide/periodic-sw-updates
- vite-plugin-pwa — Automatic reload/update behaviour: https://vite-pwa-org.netlify.app/guide/auto-update
- Firebase Hosting — advanced configuration / response headers: https://firebase.google.com/docs/hosting/full-config#headers
- WebKit — current Safari web-app/service-worker platform notes: https://webkit.org/blog/

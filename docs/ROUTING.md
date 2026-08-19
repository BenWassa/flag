# Routing and product information architecture

**Status:** Issue #10 architecture, updated through Issues #2, #3, #15, and #16  
**Transport:** hash URLs on GitHub Pages  
**Route source of truth:** `src/routing/routes.ts`  
**Browser adapter:** `src/routing/router.ts`

## Product hierarchy

Navigation is the composition of three independent dimensions:

1. **Learning domain** — Flags, Locations, Outlines, Neighbours.
2. **Geographic scope** — World where applicable, continent, region, and later country/detail where a mechanic requires it.
3. **Activity** — Learn, Test, Review.

The learner should be able to identify all three dimensions on an active task surface without extra navigation chrome.

Current product availability:

| Domain | Current scope | Status |
|---|---|---|
| Flags | World, all continents, all curriculum regions | Available |
| Locations | Africa and its five curriculum regions | Available |
| Outlines | Africa and its five curriculum regions | Available |
| Neighbours | Africa standard targets and its five curriculum regions | Available |

The route model accepts the canonical continent/region hierarchy for all four domains. Availability remains a domain-data concern rather than a reason to create separate routers.

## Product language versus route identifiers

Product copy uses modern British English, so the learner-facing domain name is **Neighbours**. The route segment remains the stable internal/API identifier `neighbors`.

Do not create a spelling-only route migration. Existing deep links such as `/#/neighbors/africa/west-africa` and persisted neighbour-progress namespaces must remain compatible even though document titles, headings and assistive-technology output say **Neighbours**.

## Route schema

The router serialises a typed route to a path first. The hash transport is the only layer that adds `#`.

| State | URL |
|---|---|
| Product Home | `/#/` |
| Progress | `/#/progress` |
| Flags domain | `/#/flags` |
| Flags → Africa | `/#/flags/africa` |
| Flags → West Africa | `/#/flags/africa/west-africa` |
| Flags → West Africa → Learn | `/#/flags/africa/west-africa/learn` |
| Flags → World → Test | `/#/flags/test` |
| Locations domain | `/#/locations` |
| Locations → Africa | `/#/locations/africa` |
| Locations → West Africa | `/#/locations/africa/west-africa` |
| Locations → West Africa → Review | `/#/locations/africa/west-africa/review` |
| Outlines → West Africa | `/#/outlines/africa/west-africa` |
| Neighbours → Africa | `/#/neighbors/africa` |
| Neighbours → West Africa → Learn | `/#/neighbors/africa/west-africa/learn` |

Region routes always include their parent continent. The parser rejects a valid region under the wrong continent, e.g. `/flags/asia/west-africa`.

## Typed route contract

`AppRoute` has only three stable top-level shapes:

- Home;
- Progress;
- Learning route: `{ domain, scope?, activity? }`.

`StudyScope` continues to use the canonical IDs in `src/data/continents.ts`. There is no flag router, map router, outline router, or Neighbours router; all are interpretations of the same learning route.

Key pure functions:

- `parseRoutePath` — URL path → typed route;
- `serializeRoutePath` — typed route → URL path;
- `routeForScope` / `routeForScopeId` — construct canonical learning routes;
- `stableRoute` — remove transient activity while retaining domain/scope;
- `parentRoute` — one conceptual level upward;
- `routeTitle` — deterministic document title using canonical learner-facing domain display names.

`src/routing/router.ts` is a browser transport adapter. Product navigation only consumes typed routes. A future clean-path deployment can replace the hash adapter with a History-path adapter while preserving the route model and product navigation calls.

## Why hash routing on GitHub Pages

### Chosen: hash router

GitHub Pages serves the static `dist/` directory and has no route rewrite in the current deployment workflow. A fragment is never sent to the server, so:

`https://…/flag/#/locations/africa/west-africa`

still requests the known application root. The application can then parse the fragment after `index.html` loads.

Benefits in the current deployment:

- cold deep links do not produce a Pages 404;
- refresh does not require a redirect hack;
- Back/Forward traverses real route URLs;
- installed-PWA launch is deterministic (`./#/`);
- offline navigation remains compatible with the existing service-worker `index.html` fallback.

### Rejected for now: clean History API paths + `404.html`

A path such as `/flag/locations/africa/west-africa` would reach GitHub Pages before application JavaScript and would be unknown unless the repository added a `404.html` redirect/fallback strategy. That adds hosting-specific behaviour, duplicate boot logic, and more failure modes for a cosmetic URL improvement.

Clean paths may become preferable on Firebase Hosting or another host with explicit SPA rewrites. The typed route/path layer is intentionally reusable for that migration.

## URL state versus session state

### URL owns durable navigation

- learning domain;
- continent/region scope;
- stable screens such as Home and Progress;
- activity identity (`learn`, `test`, `review`) while a round is active.

### Session/application state owns round internals

- shuffled target/question order;
- current question index;
- submitted guesses and attempts;
- current feedback/reveal state;
- map asset/session object;
- animations;
- pending auto-advance timers;
- final result object retained for Back/Forward during the current process.

The URL is not an event log and does not attempt to make every quiz frame independently addressable.

## Refresh during an active round

**Decision: return to the stable scope screen.**

If an activity URL is loaded without its matching in-memory round, the app removes the activity segment with `replaceState` and renders its stable parent:

`/#/locations/africa/west-africa/test`

becomes:

`/#/locations/africa/west-africa`

This applies to Learn, Test, and Review. Progress already earned before refresh remains in its domain-specific persisted ledger; incomplete round ordering/feedback is intentionally discarded.

This is preferable to serialising a partial session until there is a versioned, explicitly tested restoration contract.

## Back and Forward semantics

Stable header Back controls use `parentRoute`, not browser-memory assumptions:

- region → continent;
- continent → domain;
- domain → Home;
- activity → stable scope.

This means a learner opening a direct region link still gets the correct conceptual parent when tapping the app Back control.

Browser Back/Forward remains native. Because each transition has a real URL, browser history can reconstruct stable navigation without an application-owned stack. Within the same JavaScript process, Back from an active round to its stable scope and Forward back to that activity can restore the still-live round/result object. A hard refresh deliberately invokes the refresh policy above.

Explicit quiz/result Exit abandons the live round and traverses back to the stable entry. Forward into the abandoned activity is then normalised safely rather than reviving stale state.

## Invalid and unavailable routes

The parser rejects malformed routes, unknown IDs, mismatched continent/region ancestry, unknown activities, and invalid world-activity combinations. An invalid initial hash is replaced with Home.

A syntactically valid route can also point to curriculum that is not enabled. Current examples are Locations, Outlines, or Neighbours outside Africa. The route interpreter canonicalises those to the relevant domain landing screen instead of throwing or rendering a broken game.

## Document titles

Stable titles derive from typed route state and canonical learner-facing display names, for example:

- `Flags · Flag Atlas`;
- `West Africa flags · Flag Atlas`;
- `Test West Africa locations · Flag Atlas`;
- `Test West Africa neighbours · Flag Atlas`.

Completed rounds add the result state explicitly, e.g. `Round complete · West Africa neighbours · Flag Atlas`.

## Home and branding decision

**Keep `Flag Atlas` for now.**

Renaming is not necessary to solve the architecture problem and would create brand churn. The Home IA is a compact Atlas index of learning domains, with Flags, Locations, Outlines, and Neighbours as peers.

The route/domain model therefore supports a future broader product name without another navigation rewrite. Branding is presentation; `flags` is one learning domain rather than the routing root.

## Known limitations

- Locations, Outlines, and Neighbours currently support Africa only.
- Neighbours excludes zero-land-neighbour targets from standard rounds and temporarily defers targets whose complete app-country land-border sets cross the current Africa-only topology boundary.
- Active rounds are not serialised across hard refresh by design.
- Country/detail route segments are not implemented yet; add them only when a concrete domain requires them.
- There is no browser E2E suite in the repository yet. Routing invariants are covered by the compiled verification suite; device/browser play remains a release QA task.

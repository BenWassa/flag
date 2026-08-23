# Routing and product information architecture

**Status:** Issue #10 architecture, updated through Issues #2, #3, #15, #16, #21, and the mode-first IA change<br>
**Transport:** hash URLs on GitHub Pages  
**Route source of truth:** `src/routing/routes.ts`  
**Browser adapter:** `src/routing/router.ts`

## Product hierarchy

Navigation is the composition of three independent dimensions:

1. **Learning domain** — Flags, Locations, Outlines, Neighbours.
2. **Geographic scope** — World where applicable, continent, region, and later country/detail where a mechanic requires it.
3. **Activity** — Learn, Play, Review.

The learner should be able to identify all three dimensions on an active task surface without extra navigation chrome. Before a round, navigation is **mode-first**: the domain is chosen first, then a continent within that domain, then optionally a region within that continent. A domain that ships one continent still renders its continent index, listing the rest as honest shells, rather than skipping to a launcher — the coverage gap is information the learner is owed, not a page to optimise away.

Current product availability:

| Domain | Current scope | Status |
|---|---|---|
| Flags | World, all continents, all curriculum regions | Available |
| Locations | Africa and its five curriculum regions | Available |
| Outlines | Africa and its five curriculum regions | Available |
| Neighbours | Africa standard targets and its five curriculum regions | Available |

The route model accepts the canonical continent/region hierarchy for all four domains. Availability remains a domain-data concern rather than a reason to create separate routers.

## Product language versus route identifiers

Product copy uses modern British English, so the learner-facing domain name is **Neighbours** and the learner-facing assessment activity is **Play**. The route segment remains the stable internal/API identifier `neighbors`, and Play remains the internal activity identifier `test`.

Do not create a copy-only route migration. Existing deep links such as `/#/neighbors/africa/west-africa` and `/#/neighbors/africa/west-africa/test` remain compatible. The `LearningActivity` and `StudyMode` value `test`, `/test` route segment, `start-test` data actions, persistence namespaces, and verification identifiers are technical contracts even though visible text, document titles, accessible names, and live-region announcements say **Play** and **Neighbours**.

## Route schema

The router serialises a typed route to a path first. The hash transport is the only layer that adds `#`.

| State | URL |
|---|---|
| Product Home — mode index | `/#/` |
| Progress | `/#/progress` |
| Flags continent index | `/#/flags` |
| Flags → Africa launcher | `/#/flags/africa` |
| Flags → West Africa | `/#/flags/africa/west-africa` |
| Flags → West Africa → Learn | `/#/flags/africa/west-africa/learn` |
| Flags → World → Play | `/#/flags/test` |
| Locations continent index | `/#/locations` |
| Locations → Africa launcher | `/#/locations/africa` |
| Locations → West Africa | `/#/locations/africa/west-africa` |
| Locations → West Africa → Play | `/#/locations/africa/west-africa/test` |
| Locations → West Africa → Review | `/#/locations/africa/west-africa/review` |
| Outlines continent index | `/#/outlines` |
| Outlines → West Africa | `/#/outlines/africa/west-africa` |
| Neighbours continent index | `/#/neighbors` |
| Neighbours → Africa launcher | `/#/neighbors/africa` |
| Neighbours → West Africa → Learn | `/#/neighbors/africa/west-africa/learn` |

Region routes always include their parent continent. The parser rejects a valid region under the wrong continent, e.g. `/flags/asia/west-africa`.

A bare `/{domain}` route is now a real screen — that domain's continent index — for all four domains, so it is no longer redirected anywhere.

The retired scope-first `/atlas/{continent}` surface no longer parses. Any unparseable hash, including a legacy `/atlas/*` link, is replaced with Home via `replaceState` so the address bar never keeps claiming a screen that does not exist.

## Canonical launcher information architecture

```text
Home (four mode cards)
├── Flags ─────► continent index ──► launcher (continent, optional region)
├── Locations ─► continent index ──► launcher (continent, optional region)
├── Outlines ──► continent index ──► launcher (continent, optional region)
└── Neighbours ► continent index ──► launcher (continent, optional region)
```

Every domain uses the identical three-level shape. Home carries no Play control at all: it commits to a mode and nothing else. On the continent index, each shipped continent is one full-width navigation row that opens the launcher; it does not start a round directly. An unshipped continent renders inert, with no action. Only Flags adds a deliberate world Play/Learn pair above its continent list, because only Flags teaches the world.

One routed launcher represents `(domain, continentScope, selectedRegion | null)`. A region URL does not identify a second screen: `/#/locations/africa/west-africa` is the Africa Locations launcher with West Africa selected. Region rows are selection controls with their existing progress visible; they do not contain a second Play action. The launcher's Play and Learn actions both name and target West Africa, while an explicit All Africa control clears the selection. The region list is always present; an Africa map may progressively enhance Locations, Outlines, and Neighbours without blocking the launcher or becoming a second selection model.

The launcher contains decision-relevant status only. Country ledgers live in Progress, and pre-round learning-state legends, feedback keys, and rules prose do not belong on this route.

## Typed route contract

`AppRoute` has only three stable top-level shapes:

- Home;
- Progress;
- Learning route: `{ domain, scope?, activity? }`.

A learning route with no scope is that domain's continent index — the second level of the hierarchy, not an incomplete route.

`StudyScope` continues to use the canonical IDs in `src/data/continents.ts`. There is no flag router, map router, outline router, or Neighbours router; all are interpretations of the same learning route.

Key pure functions:

- `parseRoutePath` — URL path → typed route;
- `serializeRoutePath` — typed route → URL path;
- `routeForScope` / `routeForScopeId` — construct canonical learning routes;
- `stableRoute` — remove transient activity while retaining domain/scope;
- `parentRoute` — one conceptual level upward: a launcher returns to its domain's continent index, a continent index returns Home;
- `routeTitle` — deterministic document title using canonical learner-facing domain display names.

Application route normalisation adds the availability contract: a scope a domain has not shipped collapses to that domain's continent index — which states the coverage honestly — rather than being silently substituted with a different continent, while activity routes without matching in-memory sessions become their stable launcher route. Availability is deliberately not a parse error: `parseRoutePath` stays a pure grammar, and `normalizeAvailableRoute` owns what is currently shipped.

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

**Decision: return to the stable launcher.**

If an activity URL is loaded without its matching in-memory round, the app removes the activity segment with `replaceState` and renders its stable parent:

`/#/locations/africa/west-africa/test`

becomes:

`/#/locations/africa/west-africa`

This applies to Learn, Play, and Review. The internal URL continues to use `/test` for Play. Progress already earned before refresh remains in its domain-specific persisted ledger; incomplete round ordering/feedback is intentionally discarded.

This is preferable to serialising a partial session until there is a versioned, explicitly tested restoration contract.

## Back and Forward semantics

Launcher navigation distinguishes three operations:

- **Back:** leave the launcher for its true parent — that domain's continent index. This remains true when a region is selected.
- **All Africa:** clear a selected region and return the same launcher to continent scope. It is not Back.
- **Select region:** replace the current launcher URL rather than push. Selecting West Africa and then East Africa creates no chain of abandoned selections.

`parentRoute` for any scoped learning route therefore returns `{ domain }`, and `parentRoute` for a bare domain route returns Home. Because region selection replaces rather than pushes, this keeps the header Back control and browser Back agreeing on the same destination.

Starting Learn or Play pushes an activity route. Browser Back from the round returns to the exact launcher scope that started it, including a selected region. The stable route for `/#/locations/africa/west-africa/test`, for example, is `/#/locations/africa/west-africa`.

Browser Back/Forward otherwise remains native. Because each meaningful transition has a real URL, browser history can reconstruct stable navigation without an application-owned stack. Within the same JavaScript process, Back from an active round to its stable launcher and Forward back to that activity can restore the still-live round/result object. A hard refresh deliberately invokes the refresh policy above.

Explicit quiz/result Exit abandons the live round and traverses back to the stable entry. Forward into the abandoned activity is then normalised safely rather than reviving stale state.

## Invalid and unavailable routes

The parser rejects malformed routes, unknown IDs, mismatched continent/region ancestry, unknown activities, and invalid world-activity combinations. An invalid initial hash is replaced with Home.

A syntactically valid route can also point to curriculum that is not enabled. Current examples are Locations, Outlines, or Neighbours outside Africa. The route interpreter canonicalises those to the relevant Africa launcher instead of throwing or rendering a broken game.

## Document titles

Stable titles derive from typed route state and canonical learner-facing display names, for example:

- `Flags · Atlas` (the Flags continent index);
- `West Africa flags · Atlas`;
- `Play West Africa locations · Atlas`;
- `Play West Africa neighbours · Atlas`.

Completed rounds add the result state explicitly, e.g. `Round complete · West Africa neighbours · Atlas`.

## Home and branding decision

The learner-facing product name is **Atlas**. The Home IA is a compact index of the four learning modes, with Flags, Locations, Outlines, and Neighbours as peers, each carrying its current coverage and accumulated evidence. Home reveals only the next real decision — which mode — and starts no round itself.

Branding remains presentation: stable routes and internal identifiers retain their compatibility names, while `flags` is one learning domain rather than the routing root.

## Known limitations

- Locations, Outlines, and Neighbours currently support Africa only.
- Neighbours excludes zero-land-neighbour targets from standard rounds and temporarily defers targets whose complete app-country land-border sets cross the current Africa-only topology boundary.
- Active rounds are not serialised across hard refresh by design.
- Country/detail route segments are not implemented yet; add them only when a concrete domain requires them.
- There is no browser E2E suite in the repository yet. Routing invariants are covered by the compiled verification suite; device/browser walkthroughs remain a release QA task.

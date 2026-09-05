# Atlas project history and issue lineage

This file is a navigation map for historical decisions. It is **not** a second backlog and does not override `PRODUCT.md`, `DESIGN.md`, current architecture docs or current `main`.

Atlas deliberately preserves closed GitHub issues and `docs/closed/` records because later work often depends on the reasoning, failed experiments, acceptance evidence and compatibility boundaries they contain. Implementation branches are disposable once that history is captured.

## Spatial navigation lineage

```text
#104 map-first launcher exploration
        ↓ product question / geography-first selection
#119 Spatial Atlas moonshot
        ↓ prototypes, renderer decision, spherical assets, route adapter
#166 production cutover
        ↓
#197 progressive continent → region → country disclosure
        ↓
Spatial Atlas is the default production presentation
```

- **#104** explored a geography-first launcher against the old row UI. Its separate future programme is superseded by the successful Spatial cutover; its constraints remain useful historical input.
- **#119** proved the persistent-Earth interaction, renderer choice, canonical spherical asset generation, route→spatial adapter, accessibility equivalence and activity boundary.
- **#166** removed the `globe + old page underneath` composition, made Spatial the default, fixed shared tiny-geography picking, retired the preview path and preserved graceful classic fallback.

- **#197** made geographic detail follow the learner's current decision: world navigation reads as continents, a framed continent reveals its learner-facing areas, and country boundaries appear only where the activity is about countries. Continent/area shells are derived from the canonical country geometry by cancelling shared edges, and each selectable scope is named on the Earth by a real DOM control.

Start current Spatial work from [`architecture/spatial-atlas.md`](architecture/spatial-atlas.md). The #104/#119/#166 records live under `closed/`.

## UX / interaction hardening lineage

```text
#118 specialist UX/motion/game-feel audit
        ├── #146 mastery/navigation semantics
        ├── #147 Outlines feedback/live-score parity
        ├── #148 reduced-motion Locations feedback
        ├── #149 Neighbours suggestion accessibility
        ├── #150 motion/control tokens
        ├── #151 retired CSS/shared control cleanup
        └── #152 redundant Home coverage metadata
```

#118 is closed audit evidence. #146–#152 are the active implementation follow-ups, but each must be interpreted against the post-#166 Spatial production UI rather than blindly applying pre-cutover launcher assumptions.

## Geography expansion lineage

Africa established the production cartography/learning foundation. Expansion then shipped South America (#24), Europe (#25), Asia (#26), North America (#22), Oceania (#27) and the Middle East cross-continental scope (#28), all through the shared generator/topology architecture.

Important shared hardening includes:

- #86 context clipping/payload control;
- #112 framing/stage geometry and Togo callout correction;
- #113 inset pattern;
- #115 Western Europe framing;
- #116 Asia/Russia framing;
- #117 real-polygon hit precedence;
- #137 remaining Asia Locations/cartography hardening (still open).

#137 predates the Spatial production cutover and must be reconciled semantically against current `main`; do not mechanically merge its old branch.

## Learning / achievement lineage

- #29 separated live country learning evidence from learner-facing prestige.
- #34 established persistent earned region/domain Mastery and completion architecture.
- #108 required exact complete-region Play coverage before a region × domain Mastery streak can advance.
- #138 surfaced the genuinely earned World Crown without changing qualification or persistence.

Current hierarchy remains:

`country evidence → region × domain Mastery → complete region → complete continent → World Crown`

## Platform lineage

- #89 completed the React/Vite migration while preserving the typed router, domain engines, persistence and geography boundaries.
- #46/#106/#107 established optional local-first Firebase cloud progress and secondary Firebase Hosting.
- #71 remains open only for physical-device Android/iOS/installed-PWA validation; automated emulation must not be cited as that evidence.

## Repository-history policy

Keep:

- current `main`;
- intentional historical milestone refs when explicitly designated (currently the pre-Spatial archive checkpoint);
- active work branches;
- closed GitHub issues and `docs/closed/` evidence.

Delete after capture/merge:

- merged feature branches;
- agent branches;
- spike branches;
- preview branches;
- acceptance/verification branches;
- superseded duplicates.

Issue #160 tracks the mechanical branch cleanup.


### Issue #137 — Asia Locations hardening after Spatial cutover

Reimplemented the surviving Asia Locations work from the post-Spatial production baseline: generic Asia max zoom, removal of the Levant question popup, shared invisible projected hit assistance, canonical source-derived Cyprus reconciliation shared with the globe, and restored selectability of countries answered earlier in a round. Spatial interaction behaviour from #166 remains authoritative and unchanged.


### Cartographic colour and in-round game feel

Superseded the neutral-cartography design direction. Under it the globe rendered ocean `#DCEAF5`, land `#DFE6EF` and space `#F6F8FB`, and the projected maps rendered context land `#D2DAE5` over answerable land `#F8FAFC`: the dominant object in the product was three near-identical light greys on a near-white page, and colour appeared on essentially one element per screen.

The replacement gives the geography its colour back and leaves the chrome alone. One central cartography token family — land green, water blue, night space — now serves the globe, Locations and Neighbours; the globe gained a procedural atmosphere rim and a night ground so it reads as a planet; stored evidence fills a country in rather than bleaching it, which the old white-on-off-white treatment could no longer distinguish at 1.09:1. Alongside it, a deliberately bounded game-feel layer: streak tiers, an answer gesture, feature-detected haptics, a transient round rank and one sheen on the earned Perfect round badge.

What did not change: Atlas Blue as action, green/red as correctness, purple as Mastery, gold as scarce prestige, no colour-only state, no continent/region colour taxonomy, and no accumulating reward economy. Domain accents are mode identity and reach only a mode's own icon and meter. `DESIGN.md`, `.impeccable/design.json`, `PRODUCT.md` and `CLAUDE.md` were updated together; the earlier neutral values in closed issues and `docs/closed/` remain accurate history rather than current direction.

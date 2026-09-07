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
#207 live Flags activity yields the Spatial stage
        ↓
#196 Home chooser returns to ordinary opaque Atlas chrome
        ↓
Spatial Atlas is the default production presentation
```

- **#104** explored a geography-first launcher against the old row UI. Its separate future programme is superseded by the successful Spatial cutover; its constraints remain useful historical input.
- **#119** proved the persistent-Earth interaction, renderer choice, canonical spherical asset generation, route→spatial adapter, accessibility equivalence and activity boundary.
- **#166** removed the `globe + old page underneath` composition, made Spatial the default, fixed shared tiny-geography picking, retired the preview path and preserved graceful classic fallback.
- **#197** made geographic detail follow the learner's current decision: world navigation reads as continents, a framed continent reveals its learner-facing areas, and country boundaries appear only where the activity is about countries. Continent/area shells are derived from the canonical country geometry by cancelling shared edges, and each selectable scope is named on the Earth by a real DOM control.
- **#207** ended the last shared live-activity composition: the live Flags question yields the stage like every other activity. Geography-led Flags scope selection stayed because a separate list would have saved no taps, touch precision or 3D cost while discarding orientation. See [`closed/issue-207-flags-activity-viewport.md`](closed/issue-207-flags-activity-viewport.md).
- **#196** retired the Home translucency exception. The bounded centred chooser now uses ordinary opaque cool near-white Atlas chrome with a neutral edge and restrained depth; the full globe remains the dominant saturated object. See [`closed/issue-196-home-chooser-material.md`](closed/issue-196-home-chooser-material.md).

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

#118 is closed audit evidence and #146–#152 are completed follow-ups. Their shipped behaviour must still be interpreted through the post-#166 Spatial production UI rather than through pre-cutover launcher assumptions.

## Geography expansion lineage

Africa established the production cartography/learning foundation. Expansion then shipped South America (#24), Europe (#25), Asia (#26), North America (#22), Oceania (#27) and the Middle East cross-continental scope (#28), all through the shared generator/topology architecture.

Important shared hardening includes:

- #86 context clipping/payload control;
- #112 framing/stage geometry and Togo callout correction;
- #113 inset pattern;
- #115 Western Europe framing;
- #116 Asia/Russia framing;
- #117 real-polygon hit precedence;
- #137 Asia Locations/cartography hardening after the Spatial cutover.

**#137 is closed.** Its surviving work was reimplemented from the post-Spatial baseline: generic Asia max zoom, removal of the Levant question popup, shared invisible projected hit assistance, canonical source-derived Cyprus reconciliation shared with the globe, and restored selectability of countries answered earlier in a round. Spatial interaction behaviour from #166 remained authoritative.

## Learning / achievement lineage

- #29 separated live country learning evidence from learner-facing prestige.
- #34 established persistent earned region/domain Mastery and completion architecture.
- #108 required exact complete-region Play coverage before a region × domain Mastery streak can advance.
- #138 surfaced the genuinely earned World Crown without changing qualification or persistence.

Current hierarchy remains:

`country evidence → region × domain Mastery → complete region → complete continent → World Crown`

## Platform / CI lineage

- #89 completed the React/Vite migration while preserving the typed router, domain engines, persistence and geography boundaries.
- #46/#106/#107 established optional local-first Firebase cloud progress and secondary Firebase Hosting.
- #191 shipped application-owned PWA update discovery/adoption with safe-boundary deferral.
- #210 reduced accumulated issue-specific GitHub Actions to the permanent CI, reusable acceptance, Pages and Firebase workflow architecture.
- #216 then reduced normal PR wall time without weakening exact-production acceptance: the repository gate still produces one tested `flag-atlas-dist`, while desktop Chromium, mobile Chromium and PWA exact-production jobs consume and verify that artifact independently in parallel. PR supersession cancels obsolete work; `main` verification remains coherent. See [`closed/issue-216-ci-wall-time.md`](closed/issue-216-ci-wall-time.md).
- #212 / PR #213 is the only remaining engineering gate. It reconciles the historical broad Playwright suite with current product contracts and contains the still-unmerged #200 stationary edge-tap versus platform Back-gesture repair. #216's parallel acceptance architecture is authoritative during its final sync.
- #71 remains the final owner-run physical-device Android/iOS/installed-PWA gate after #212 is resolved; automated emulation must not be cited as physical evidence.

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

Issue #160 completed the mechanical branch-cleanup pass; the policy above remains the ongoing repository rule.

## Cartographic colour and in-round game feel

Superseded the neutral-cartography design direction. Under it the globe rendered ocean `#DCEAF5`, land `#DFE6EF` and space `#F6F8FB`, and the projected maps rendered context land `#D2DAE5` over answerable land `#F8FAFC`: the dominant object in the product was three near-identical light greys on a near-white page, and colour appeared on essentially one element per screen.

The replacement gives the geography its colour back and leaves the chrome alone. One central cartography token family — land green, water blue, night space — now serves the globe, Locations and Neighbours; the globe gained a procedural atmosphere rim and a night ground so it reads as a planet; stored evidence fills a country in rather than bleaching it, which the old white-on-off-white treatment could no longer distinguish at 1.09:1. Alongside it, a deliberately bounded game-feel layer: streak tiers, an answer gesture, feature-detected haptics, a transient round rank and one sheen on the earned Perfect round badge.

What did not change: Atlas Blue as action, green/red as correctness, purple as Mastery, gold as scarce prestige, no colour-only state, no continent/region colour taxonomy, and no accumulating reward economy. Domain accents are mode identity and reach only a mode's own icon and meter. `DESIGN.md`, `.impeccable/design.json`, `PRODUCT.md` and `CLAUDE.md` were updated together; the earlier neutral values in closed issues and `docs/closed/` remain accurate history rather than current direction.

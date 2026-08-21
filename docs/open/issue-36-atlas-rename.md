# Issue #36 — Rename learner-facing product to Atlas

GitHub: https://github.com/BenWassa/flag/issues/36

## Goal

Rename the learner-facing product from **Flag Atlas** to **Atlas** now that Flags, Locations, Outlines and Neighbours are equal product domains.

## Compatibility boundary

Documentation may adopt Atlas immediately.

Production implementation should update visible brand/metadata while preserving stable technical identifiers where migration has no product value, including repository name, routes, storage namespaces and legacy cache identifiers as appropriate.

Do not create a breaking migration purely for cosmetic consistency.

## Acceptance criteria

- Initial and routed browser titles use **Atlas**, including active and completed-round states across all four domains.
- PWA `name` and `short_name` use **Atlas**.
- Current learner-facing and durable product/architecture documentation uses Atlas; intentionally archival research, closed worklogs, and historical lineage remain unchanged.
- Stable routes and internal language remain unchanged, including `/neighbors`, `/test`, `start-test`, repository/package identity, and `flag-atlas:*` storage keys.
- The service-worker cache advances within the stable legacy namespace so installed clients receive the renamed shell and manifest.
- Focused automated coverage prevents the learner-facing brand from regressing while asserting compatibility identifiers remain intact.
- `npm run check` and `npm test` pass.

## Implementation evidence

Implemented on the focused issue branch:

- `index.html` and `manifest.webmanifest` now expose Atlas as the document and installed-app name.
- Typed route titles and all four result-state document titles now end in `· Atlas`.
- The app-shell cache advanced from `flag-atlas-v15` to `flag-atlas-v16`; the legacy cache prefix remains intentional and compatible.
- Current routing, cartography, architecture, naming, and map-learning documentation was reconciled with the shipped brand decision.
- Development/build status output now names Atlas; the package name remains the stable internal `flag-atlas` identifier.
- `scripts/verify-atlas-brand.mjs` covers document metadata, manifest metadata, representative route titles, all result-title suffixes, cache invalidation, and stable storage namespaces. Existing routing, British-English, map, neighbour-map, and integration assertions were advanced to the v16 contract.

## Verification record

- GitHub issue body was rechecked before delivery and matches the repository brief and compatibility boundary.
- `npm run check`: passed (TypeScript no-emit check).
- `npm test`: passed after building the production output and running the complete verifier chain, including the new Atlas brand contract. An initial run exposed an overly literal assertion for the dynamically composed Neighbours result title; the assertion was corrected to cover all four result-title source branches, then the complete suite passed.
- Opera/Chromium browser inspection of the local production build at 390×844 confirmed Home title `Atlas`, visible `Atlas` heading, `en-GB`, Progress title `Progress · Atlas`, and manifest `name`/`short_name` both `Atlas`; no console warnings or errors occurred. Installed-PWA update behaviour and physical-device testing are not claimed.

## Deferred closeout

Commit, push, merge, merged-tree verification, moving this file to `docs/closed/`, and closing/commenting on GitHub remain part of the authorised delivery workflow and are intentionally not performed in this implementation task.

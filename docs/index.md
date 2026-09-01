# Documentation

Atlas documentation is organised by **authority and purpose** so current product truth is easy to distinguish from historical issue evidence.

## Read order

### Normative current truth

- [`../PRODUCT.md`](../PRODUCT.md) — current product behaviour and preservation boundaries.
- [`../DESIGN.md`](../DESIGN.md) — current production visual/interaction system.
- [`../.impeccable/design.json`](../.impeccable/design.json) — compact machine-readable design constraints.
- [`product/requirements.md`](product/requirements.md) — durable implementation requirements.
- [`architecture/overview.md`](architecture/overview.md) — system/layer boundaries.
- [`architecture/spatial-atlas.md`](architecture/spatial-atlas.md) — production Spatial Atlas composition, touch/picking and fallback contracts.
- [`architecture/routing.md`](architecture/routing.md) — typed URL, history and durable-scope contract.
- [`architecture/cartography.md`](architecture/cartography.md) — canonical Natural Earth source/provenance/boundary policy for projected and spherical outputs.
- [`architecture/earned-achievements.md`](architecture/earned-achievements.md) — persistent achievement schema and qualification seam.

### Current work

- [`open/index.md`](open/index.md) — only genuinely open issues/sequencing.
- GitHub Issues are the canonical task tracker; not every issue needs a duplicate plan file.

### Historical evidence

- [`history.md`](history.md) — issue lineage, major supersessions and where to look for decision history.
- [`closed/`](closed/) — completed issue worklogs, experiments, closeout evidence and superseded plans.
- [`research/`](research/) — supporting investigations/evidence that inform but do not override current product truth.

## Current production state

Atlas ships React/Vite, all six continents across the intended four-domain curriculum, and **Spatial Atlas as the default production navigation presentation**. The globe is not a preview: #119 established the accepted architecture and #166 completed the production cutover.

The conventional launcher remains only as the WebGL/renderer-failure fallback. The typed router, learning engines, persistence, achievement semantics and canonical geography remain authoritative beneath both presentations.

The World Crown is reachable and #138 already shipped its earned-only learner-facing Home surface.

## Documentation rules

- Current behaviour belongs in root/product/architecture docs, not only issue comments.
- `open/` contains unresolved working records only.
- Move completed/superseded working records to `closed/`; preserve them rather than deleting useful rationale.
- Closed issue/history docs may describe behaviour that has since been superseded; current normative docs win.
- Update inbound links when moving records.
- Keep filenames lowercase kebab-case.
- Keep the hierarchy shallow.
- Preserve GitHub issues as historical decision threads even after implementation branches are deleted.

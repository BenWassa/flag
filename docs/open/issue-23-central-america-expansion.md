# Issue #23 — Central America standalone expansion superseded by #22

**Status:** superseded by #22; no separate implementation should be started.

## Resolution

Central America remains a first-class learner-facing region, but its cartography and gameplay expansion should ship as part of the complete North America parent-continent work in Issue #22.

The repository already models North America with three regions:

- Northern America;
- Central America;
- Caribbean.

Running Central America as an independent topology/runtime workstream would duplicate the same generator, map-loader, context and adjacency concerns that the global expansion foundation is intended to centralise.

## Preserved curriculum

Central America remains the 8-country learning scope:

- Belize (`BLZ`)
- Costa Rica (`CRI`)
- El Salvador (`SLV`)
- Guatemala (`GTM`)
- Honduras (`HND`)
- Mexico (`MEX`)
- Nicaragua (`NIC`)
- Panama (`PAN`)

Its learner-facing routes, region identity, four-domain support and region-level mastery remain required. Only the standalone implementation ticket is retired.

## Requirements transferred to #22

Issue #22 now owns:

- canonical North America parent topology;
- Central America region membership;
- phone-scale small-country QA;
- Mexico/US adjacency;
- Panama/Colombia cross-continent adjacency;
- Locations, Outlines and Neighbours for Central America;
- shared Flags scope membership verification;
- routing, persistence, performance and production-artifact QA.

No code or separate runtime asset should be created specifically to close #23.

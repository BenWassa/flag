# Continent expansion playbook

**Status:** planning source of truth for post-Africa curriculum expansion  
**Reference implementation:** Africa  
**Applies to:** continent expansion issues #22, #24, #25, #26, #27 and successor work  
**Related:** #28 Middle East learning scope, #54 river removal, #57 shared foundation, #58 zero-land-neighbour learning

## Goal

Make each new continent an onboarding exercise against one shared Atlas geography architecture rather than a new implementation of cartography, scope support, outlines or neighbour logic.

Africa is the quality baseline. New continents must reach the same standard across all four learning domains:

- Flags;
- Locations;
- Outlines;
- Neighbours.

Flags already has global country coverage, but each expansion must verify that Flags consumes the same learning-scope membership as the geography domains. A continent is not complete when only Locations/Outlines/Neighbours work.

## Architecture principle

The desired expansion path is:

`declare curriculum + policy → generate canonical continent asset → derive domain support → verify → visually harden`

It must not be:

`copy Africa code → rename constants → add another continent-specific subsystem`.

Issue #57 generalised the Africa-specific runtime and generation entry points. Africa remains the regression fixture proving that later continent onboarding does not change existing geography, gameplay or visual behaviour.

## Shared geography model

Atlas must keep these concepts distinct:

1. **country identity** — canonical ISO3 application identity;
2. **canonical country geometry** — source-derived political geometry used by the production topology pipeline;
3. **canonical geographic classification** — continent/formal-region metadata where useful;
4. **learning scopes** — named country sets presented to learners; scopes may overlap or cross continent boundaries;
5. **scope display/context geometry** — non-scoring surrounding geography used for orientation and truthful framing.

Do not overload one `continentId` / `regionId` relationship to represent all five concepts.

Country records must never be duplicated simply because a country participates in more than one learning scope. Progress/evidence remains keyed to the canonical country identity within the relevant learning domain.

## Learning-scope contract

Each supported continent or region must have one canonical learning-scope definition containing at minimum:

- stable scope ID;
- learner-facing British-English label;
- parent/navigation placement;
- exact ordered/scored ISO3 membership;
- supported learning domains;
- cartographic parent asset;
- any cross-continent membership/context requirement.

All four domains must consume this shared membership contract rather than independently rebuilding country lists.

Issue #28 is the model for overlapping scope requirements: `Middle East` is discoverable through Asia but includes Egypt while Egypt remains canonically African.

## Canonical cartography contract

All new continent maps inherit the production Natural Earth 1:10m topology pipeline and documented geopolitical policy.

Required invariants:

- no handwritten country geometry;
- no second topology/map source;
- canonical ISO3 reconciliation before scoring output;
- topology-preserving political simplification;
- country fills, one shared political-border mesh and one coastline mesh from the same canonical topology;
- canonical geometry reused for Locations and Outlines;
- land adjacency mechanically derived from canonical topology;
- deterministic generated assets with provenance;
- continent-local lazy runtime loading;
- unresolved source features fail generation for explicit policy review rather than being silently guessed.

### Physical context after #54

The global Atlas runtime-map policy is:

- keep ocean/background context;
- keep selected major lakes/reservoirs where they materially aid orientation;
- remove rivers entirely;
- do not add replacement linear physical-geography layers.

Political borders must remain unmistakable at phone scale.

Lake inclusion is continent-specific and should be conservative. It is not a requirement to display every available lake.

## Global adjacency requirement

Neighbours must not repeat the Africa-only completeness limitation.

Generation must evaluate application-country land adjacency against enough canonical global topology to determine each target's complete land-neighbour set, including borders that cross learner-continent boundaries.

Examples that must remain complete when their continents are implemented include:

- Colombia ↔ Panama;
- Papua New Guinea ↔ Indonesia;
- cross-Europe/Asia land relationships;
- Egypt/Israel when both relevant scopes are available.

Runtime data may still be sliced and lazy-loaded by continent. Generation-time knowledge must not truncate a country's real application-country land-neighbour set at a continent boundary.

Zero-land-neighbour countries remain accurate empty adjacency records and are learnable through the explicit **No land neighbours** retrieval introduced by #58.

## Required continent specification

Every continent issue must resolve the following before implementation is considered complete.

### 1. Curriculum table

Record every canonical scored country and its ISO3.

For each learner-facing region, record the exact membership and country count. The issue/documentation is authoritative enough that an implementer should not have to decide membership while coding.

### 2. Four-domain support matrix

Each issue must include a matrix such as:

| Scope | Flags | Locations | Outlines | Neighbours |
| --- | --- | --- | --- | --- |
| Continent | required | required | required | required |
| Region A | required | required | required | required |
| Region B | required | required | required | required |

Verified empty adjacency is a learnable answer, not a reason to exclude a Neighbours target. Missing topology coverage is not an acceptable substitute for complete geography.

### 3. Political/territory policy

Explicitly classify every relevant Natural Earth special/disputed/non-application feature as one of:

- canonical scored country geometry;
- merged into a canonical application country under documented policy;
- non-scoring context;
- excluded from the continent asset;
- unresolved/blocking policy decision.

Do not generalise Africa's Somaliland/Western Sahara/Bir Tawil decisions by analogy.

### 4. Transcontinental/multipart policy

For every transcontinental or geographically distant multipart application country, decide:

- canonical country identity remains unchanged;
- what whole-country geometry Outlines should use;
- what geometry Locations should display as interactive in that scope;
- what context is required for truthful recognition;
- how complete land adjacency is derived;
- whether a conventional learning scope overlaps the canonical continent taxonomy.

### 5. Map framing

For the continent and every region specify/verify:

- full-continent minimum fit including required island locators;
- sensible initial regional focus;
- zoom-out to parent continent;
- no cropping of scored cross-boundary learning-scope members;
- useful context without overwhelming the target region;
- short-landscape behaviour.

Generated region focus may be the initial default but must be visually inspected and overridden/configured only through a documented deterministic mechanism when necessary.

### 6. Small-country/island usability

Apply the Africa policy:

- mainland callouts are exceptional;
- islands use one visible locator/dot plus a larger invisible hit surface when necessary;
- never add both a redundant locator and callout;
- do not infer a callout solely from polygon area;
- real phone-scale/browser inspection determines whether assistance is justified.

Each continent issue must record its final locator/callout inventory after QA.

### 7. Outline integrity

Outlines use canonical country geometry only.

Verify:

- consistent normalised framing;
- preserved aspect ratio;
- multipart/island treatment;
- no country-name leakage in question accessibility metadata;
- no alternate/manual silhouette source;
- visual size/framing does not create avoidable answer cues.

### 8. Neighbours integrity

Verify for every eligible target:

- complete direct-land-border set;
- symmetric adjacency;
- no maritime neighbours;
- enclave/exclave relationships where canonical topology represents them;
- high-degree targets;
- cross-continent borders;
- zero-neighbour policy;
- disputed-boundary treatment inherited from documented production policy.

### 9. Performance

Each generated continent asset remains lazy-loaded.

Record for the exact production artifact:

- raw module size;
- gzip size;
- generated political coordinate counts where useful;
- any asset-specific optimisation parameters;
- whether the established runtime budget remains appropriate or needs an explicitly reviewed continent-specific adjustment.

Do not silently increase a global/eager startup payload to accommodate expansion.

### 10. Verification

The shared verifier family should be parameterised by continent rather than copied into one verifier per continent unless a genuinely continent-specific policy needs a focused assertion.

Automated gates must cover at minimum:

- exact scored ISO3 reconciliation;
- exact region/scope membership;
- four-domain support consistency;
- source/provenance integrity;
- political topology output;
- adjacency completeness/symmetry;
- no river runtime contract;
- required lake policy for the continent;
- locator/callout inventory;
- routing/direct links;
- domain integration;
- lazy loading/PWA compatibility;
- production runtime budget.

### 11. Visual release gate

Inspect the exact production artifact, not source only.

At minimum inspect:

- full continent in phone portrait;
- every region in phone portrait;
- densest/smallest-country region;
- representative Locations interaction;
- representative Outlines questions including multipart/small countries;
- representative Neighbours rounds including high-degree and edge-boundary targets;
- short landscape;
- pan/zoom reset/fit behaviour;
- no horizontal page overflow;
- lakes/context subordinate to political geography.

Do not claim physical-device/browser testing that was not actually performed.

## Definition of continent completion

A continent is complete only when:

- its canonical scored curriculum is explicit and reconciled;
- every learner-facing region has explicit membership;
- Flags, Locations, Outlines and Neighbours consume the same intended scopes;
- canonical cartography is generated and lazy-loaded;
- Outlines derive from that geometry;
- Neighbours has complete topology-derived land adjacency;
- river-free map policy is respected;
- small-country/island decisions are visually hardened;
- support metadata allows progress/achievement systems to treat the curriculum honestly;
- full automated verification passes;
- the exact production artifact passes the available visual QA;
- durable documentation records any special policy.

## Rollout order

Recommended sequence on the shipped shared foundation:

1. South America — proving ground for the generic second-continent path;
2. North America — includes Northern America, Central America and Caribbean in one parent asset;
3. Oceania — validates island-heavy/extreme-extent behaviour;
4. Europe — dense microstate/transcontinental hardening;
5. Asia — largest/most policy-complex expansion and consumes the Middle East/Caucasus decisions.

Once the South America proving ground demonstrates that continent onboarding no longer requires repeated core refactors, later non-overlapping continent work may proceed in parallel where branch conflicts and shared-policy dependencies are controlled.

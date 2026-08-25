# Country Location Learning

**Status:** current Atlas v1 Locations contract  
**Geometry source:** canonical Natural Earth 1:10m production topology pipeline

## Product skill

Locations teaches identification of countries by true geographic position. The map is the dominant learning object; controls and feedback support the task without becoming a competing dashboard.

Current production coverage is **Africa, South America, Europe and Asia**, including supported learner-facing regions. North America (#22) and Oceania (#27) remain unavailable.

## Geography contract

Locations uses the canonical generated production map assets. New coverage must extend the same pipeline rather than introduce a second map source.

Required invariants:

- canonical ISO3 country identity;
- source-derived country geometry;
- shared political-border/coastline topology;
- full parent-continent context for regional learning where appropriate;
- small-country/island assistance only where it remains geographically honest;
- no handwritten scoring geometry;
- no continent-boundary truncation of geography required by another domain such as Neighbours.

See the cartography architecture/provenance documentation for generation and geopolitical policy.

## Learn

Locations Learn is guided retrieval on the map.

For the active target:

- first-try correct → clean retrieval evidence;
- correct after misses → assisted retrieval evidence;
- repeated misses can resolve/reveal the target according to the established retry budget;
- revealed resolution is retained as passive exposure rather than fabricated clean evidence;
- wrong selections remain contradictory information in the domain-native history.

The map shows immediate corrective state in Learn. Resolved targets become non-interactive for the remainder of the round.

## Play

Locations Play gives one scored tap per target. The current React surface provides immediate answer feedback/live score and advances through the selected scope; correctness is no longer documented as a neutral “recorded only” state.

A miss-free Play result receives transient **Perfect round** treatment on Results.

Normal region Play uses the full selected-scope map target set. Accordingly Locations already supplies complete-region result coverage to the current region-Mastery streak path; #108 is primarily required to bring Flags, Outlines and Neighbours to equivalent qualification integrity and to make the completeness guard explicit/canonical across domains.

## Results and review

Results communicate first-try performance, misses and the completed map context. Mistake review re-enters Learn/Review using the missed target set. Repeat preserves the previous scope/mode.

Perfect round is one-result feedback, not persistent Mastery.

## Evidence and persistence

Locations owns an independent persistent country ledger and attempt history. It maps native map outcomes into the shared evidence vocabulary without flattening retry/reveal semantics into multiple-choice scoring.

Location answers never write to Flags, Outlines or Neighbours progress.

The current location evidence model does not expose the same `nextReviewAt` due-date scheduling field used by Flags/Outlines; do not document due-state parity that does not exist.

## Map interaction

Regional learning should preserve continent context without making navigation itself the quiz.

Current interaction principles:

1. render the parent-continent context;
2. emphasise active-scope countries and keep out-of-scope context quieter;
3. score only active targets;
4. use an appropriate initial focus for regional scope;
5. allow pan/zoom while keeping the question prompt stable;
6. retain pan position across ordinary answer updates where the runtime supports it;
7. keep the true polygon/locator as the geography being taught;
8. enlarge practical hit targets only through documented geographically honest locators/assists;
9. make resolved targets inert.

Touch/pointer interaction includes the current pinch/wheel zoom and swipe/drag pan behaviour. Do not reintroduce a second map implementation for a launcher or domain variant.

## Feedback and colour

- green remains first-try/correct feedback where the established mechanic uses it;
- red remains wrong/reveal feedback;
- intermediate assisted outcomes may retain established restrained corrective colours;
- Atlas Blue remains action/selection, not a progress-by-saturation geography encoding;
- text/live announcements accompany colour state.

The exact domain-native feedback treatment can evolve without changing the achievement hierarchy.

## Accessibility boundary

Controls, keyboard activation, focus restoration, live announcements, reduced-motion handling and forced-colour fallbacks should remain accessible.

Individual map targets must not expose country names before selection in a way that gives away the answer. Country-location identification is inherently spatial; accessibility support must not destroy the exercise by leaking solutions.

## Expansion requirements

Before enabling another continent/scope:

- onboard it through the canonical generation pipeline;
- reconcile every scored feature to canonical ISO3;
- verify target/context coverage and framing;
- inspect small/narrow countries at phone scale;
- verify borders/coastlines and documented geopolitical policy;
- add scope support to Locations/Outlines/Neighbours coherently;
- verify Learn, Play, Review, feedback, pan/zoom, storage failure and offline revisit;
- run the full repository gate and inspect the exact production artifact.

North America and Oceania remain the only continent expansion gaps in current v1 geography-dependent domains.

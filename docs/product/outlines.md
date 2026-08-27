# Country Outline Learning

**Status:** current Atlas v1 domain contract
**Identity key:** ISO3
**Geometry source:** canonical production cartography

## Product skill

Outlines teaches recognition of a country from its silhouette. The silhouette is the dominant visual object; the surrounding quiz chrome stays quiet and consistent with the shared Atlas learning system.

Current production coverage is **Africa, South America, Europe, Asia and North America**, including their supported learner-facing regions. Oceania (#27) remains unavailable until its canonical production geography is onboarded.

## Geometry contract

Outlines does not own a separate silhouette dataset.

The domain loads the same generated production map assets used by Locations and normalises each canonical country geometry for silhouette presentation.

Requirements:

- preserve canonical path/subpath geometry;
- preserve aspect ratio;
- translate and uniformly scale into the standard silhouette frame;
- remove absolute projected size/location as avoidable cues;
- retain multipart/island geometry rather than replacing it with hand-drawn approximations;
- never use an outline-only SVG source or handwritten country geometry;
- reject unsupported SVG command assumptions rather than silently corrupting geometry.

## Question model

Outlines uses four canonical country-name options with confusion/geography/shape-informed distractors. Target selection and country learning evidence reuse the shared recognition/evidence infrastructure while remaining in an independent Outlines ledger.

Country names resolve through the canonical country catalogue and `country-naming.md`.

## Learn

Outlines Learn is interactive retrieval with immediate correctness feedback.

- correct clean recognition contributes clean learning evidence;
- an incorrect recognition contributes contradictory evidence and shows corrective feedback;
- mistake review can run as a Learn/Review activity;
- the correct option can become the continue action after feedback under the shared interaction pattern.

Outlines Learn is therefore different from passive Flags Learn: genuine retrieval can create evidence.

## Play

Outlines Play is scored retrieval. Current React presentation provides the shared Play feedback/result treatment and live round behaviour without exposing evidence weights in UI code.

A miss-free Play result receives transient **Perfect round** treatment on Results.

Standard Outlines region Play launches the complete supported region target set.
The achievement layer validates exact coverage, so sampled rounds cannot award
or reset region × domain Mastery. Issue #108 shipped this qualification guard.

## Independent evidence

Outlines persists independently from Flags, Locations and Neighbours. Its records use the shared country-evidence reducer but keep domain-native confusion/history data.

Routine UI should describe country state as learning/strong/due evidence rather than country-level Mastered prestige.

## Accessibility and cue prevention

Before answering, the silhouette accessibility subtree must not expose the target country name, ISO3, answer-bearing filename/data attribute, `<title>` or other direct solution cue.

The answer controls provide the country-name choices. Keyboard selection, visible focus, reduced motion and short-landscape handling follow the shared production contracts.

## Current limits

- Oceania is not yet available.
- Shape plausibility remains transparent/heuristic rather than machine-learned.
- Active round internals are not restored across a hard refresh; the shared routing fallback applies.
- Physical-device QA remains a release-confidence task when behaviour changes; this document does not claim device testing.

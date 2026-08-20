# Country outline learning

**Status:** Issue #2 implementation  
**Initial production scope:** Africa + five existing Africa curriculum regions  
**Identity key:** ISO3  
**Geometry source:** production cartography from Issue #9 (`src/data/maps/`)

## Product behavior

Outlines is a peer learning domain in the Issue #10 information architecture:

`Home → Outlines → Africa → region (optional) → Learn/Test`

Each question shows one country silhouette and four canonical country display names. The silhouette is the dominant visual element; the rest of the question surface reuses the established quiet quiz chrome and four-choice controls.

Africa is the deliberate first production scope. Global outline coverage must come from a reviewed expansion of the canonical production geometry pipeline, not from an outline-only SVG collection.

## Geometry contract

Outlines does **not** own country geometry.

`src/data/outlines.ts` calls the same `loadMapAsset` seam used by production location learning. The returned canonical generated country polygons are then normalized by `src/domain/outline.ts` for silhouette presentation.

Normalization rules:

- preserve every canonical country path and subpath;
- preserve the source shape aspect ratio;
- translate and uniformly scale each country into a fixed `0 0 100 100` frame;
- use a constant 8-unit internal framing margin;
- never use production-map locator, hit-assist, or callout metadata to manufacture a silhouette;
- reject unexpected SVG command types rather than silently applying incorrect coordinate transforms.

This removes absolute projected size and location as cues while preserving the country shape. Every rendered outline SVG has the same viewport and presentation dimensions.

### Multipart and island countries

Canonical polygon geometry is retained in full. Island countries are therefore represented by their actual generated multipart geometry rather than a dot or map locator.

Regression coverage explicitly includes:

- Cabo Verde (`CPV`)
- São Tomé and Príncipe (`STP`)
- Comoros (`COM`)
- Mauritius (`MUS`)
- Seychelles (`SYC`)

This is intentionally different from the location game's interaction locators: an outline-recognition question needs the shape and spatial relationship of the canonical parts, not a larger tap target.

## Country names

Answer text resolves through `src/data/countries.ts`; there is no outline-specific name list. The active policy remains [`country-naming.md`](country-naming.md).

Aliases may support other product interactions, but quiz options use the canonical display name exactly once. ISO3 remains the question/ledger identity key.

## Question and distractor strategy

Target selection reuses the established adaptive `buildQuiz` curriculum behavior:

- **Learn:** unseen countries first, then weak/due learning evidence;
- **Test:** randomized targets from the selected scope;
- balanced correct-answer positions across a round.

Outline-specific distractors are then selected with deterministic scoring:

1. prior outline confusion history receives the strongest weight;
2. same-region candidates are preferred, then same-continent candidates;
3. similar outline aspect ratio is a secondary plausibility signal;
4. similar multipart complexity is a secondary plausibility signal;
5. deterministic seeded jitter breaks ties without creating a fixed answer order.

The goal is plausible, homogeneous alternatives rather than unrelated options. This follows the conventional assessment-design finding that distractors should be plausible and function as real alternatives; irrelevant/nonfunctional distractors make items easier without measuring the intended recognition skill. The implementation deliberately stops short of machine-learning shape similarity because region, confusion history, aspect ratio, and multipart complexity provide a transparent baseline that is easy to test and tune.

Research reviewed for this decision included PubMed 32704275 (nonfunctional distractor analysis) and PubMed 26849247 (feature-matched plausible distractors in automated item generation).

## Learn and Test semantics

Outlines uses the same mastery transition functions as flags, but passes a completely separate progress state.

### Learn

- four options;
- answer feedback appears immediately;
- the correct country is named after an incorrect answer;
- correct answers contribute to the existing mastery rule across separate rounds;
- misses return the outline competency to Learning using the existing lapse/recovery semantics;
- missed countries can be reviewed from results.

### Test

- four options;
- the selected answer is acknowledged, but correctness is withheld during the round;
- the next question advances automatically after the same short acknowledgement interval used by the flag test;
- results summarize correctness and offer another round/review.

No streak, XP, confetti, or outline-specific scoring model is introduced.

## Independent progress

Outlines intentionally reuses `ProgressState` and `applyAttempt`, but persists through separate keys:

- `flag-atlas:outline-progress:v1`
- `flag-atlas:outline-attempts:v1`

Answering an outline question never writes to flag or location progress. Storage failure degrades to the same in-memory studying behavior used elsewhere.

## Accessibility and cue prevention

Before a question is answered, the SVG subtree contains:

- a fixed `viewBox="0 0 100 100"`;
- the normalized silhouette path;
- the generic accessible label `Country silhouette to identify`.

It does **not** contain the country name, ISO code, country-specific filename, answer-bearing `data-*` attribute, country-specific viewport dimension, `<title>`, or answer-specific DOM structure.

The four answer buttons are the accessible country-name choices. Numeric keys 1–4 select answers, `Enter` advances Learn feedback, and `Escape` exits the active round. Focus restoration and the persistent application live region follow the existing quiz conventions.

## Responsive layout

Portrait mobile is primary. The silhouette occupies the flexible question stage and the four answer controls stay reachable beneath it.

On short landscape screens, the existing quiz shell becomes two-column: silhouette/question stage on the left and the answer column on the right. Outline-specific sizing caps the silhouette within the short viewport rather than introducing scroll-dependent answer access.

## Known limitations

- Production outline learning currently covers Africa only because the canonical production cartography rollout is Africa-only.
- Shape plausibility is intentionally heuristic, not a learned visual-similarity model.
- Automated regression verifies responsive CSS and rendered artifact structure; physical-device visual QA remains a manual release check.
- Active rounds follow the shared routing contract and are not persisted across a hard refresh.

# Atlas Colour System

## Decision

Atlas uses one global semantic colour system derived from the aggregate visual vocabulary of the 195 national flags.

Do not create continent, region or hemisphere theme colours from the study.

## Quantitative findings

Approximate equal-country-weighted share of total flag area:

| Colour family | Share |
| --- | ---: |
| Red | 30.8% |
| Blue + cyan | 20.5% |
| White / near-white | 16.2% |
| Green | 15.3% |
| Yellow / gold | 9.8% |
| Grey | 3.3% |
| Black / near-black | 2.3% |
| Orange | 1.8% |
| Purple | 0.1% |

The important result is the ordering, not false precision in the final decimal place.

## Brand implication

Red is the largest chromatic family but is reserved for wrong/error feedback.

Green is also strongly represented but is reserved for correct/positive immediate feedback.

Blue is the strongest major flag-derived family that remains semantically available, so it becomes the brand/action family.

Purple is exceptionally rare in national flags, which makes it well suited to durable mastery without competing with ordinary geography imagery.

Gold is familiar but materially scarcer than the main flag colours, making it appropriate as a deliberately limited prestige/completeness accent.

## Locked palette

| Role | Token | Colour |
| --- | --- | --- |
| Primary action | `action` | `#2563EB` |
| Pressed / depth | `action-pressed` | `#1749B8` |
| Action tint | `action-soft` | `#EAF0FF` |
| Canvas | `canvas` | `#F6F8FB` |
| Primary text | `text` | `#101318` |
| Correct | `correct` | `#137A55` |
| Wrong | `wrong` | `#B42318` |
| Mastery | `mastery` | `#6D3FC0` |
| Prestige / completeness | `prestige` | `#E0AF2F` |

## Why Atlas Blue differs from the measured centroid

The representative measured flag-blue family was approximately `#3A5CA2`.

That value describes the dataset well but is too subdued for a primary interactive control.

Atlas Blue `#2563EB` remains within the same blue family while increasing chroma and visual energy for interface use.

The rule is: **derive the family from the evidence; tune the UI token for usability.**

## Semantic rules

### Blue = act / explore / select / continue

Use for primary actions, current selection, navigation emphasis, focus and active controls.

### Green = correct

Use for transient correct-answer and immediate positive task feedback.

Do not use green as the general brand or durable mastery colour.

### Red = wrong

Use for transient incorrect-answer feedback, errors and genuine destructive states.

Avoid routine decorative red.

### Purple = mastery

Use for persistent region × domain mastery and related competency marks.

Do not use purple as a generic accent.

### Gold = completeness / prestige

Use sparingly for complete regions, continent crests, the world Crown and genuinely exceptional milestone detail.

Gold should not appear on routine actions, ordinary navigation, generic progress or decorative chrome.

## Accessibility

Reference contrast checks from the study:

- white on `#2563EB`: ~5.17:1;
- white on `#1749B8`: ~7.83:1;
- white on `#137A55`: ~5.33:1;
- white on `#B42318`: ~6.57:1;
- white on `#6D3FC0`: ~6.73:1;
- dark text on `#E0AF2F`: ~9.17:1.

Do not use white text on gold by default.

Colour must always reinforce another state cue such as wording, iconography, border/state treatment or layout.

## Geographic findings

Continent differences are real but not stable enough to justify separate semantic palettes. Region-level differences are even less useful because small sample sizes make them noisy. Hemisphere differences largely reflect continent composition.

Therefore:

- no continent colour taxonomy;
- no region colour taxonomy;
- no hemisphere theming;
- geography identity comes from the geography itself.

## Provenance

The research work is captured in PR #33, **Research: quantify the world flag colour palette**. The product decisions in this document are the accepted design interpretation of that study.

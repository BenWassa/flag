# Atlas Flag Colour Study — Full Research Report

> Archival transcription of the substantive research report delivered in the 20–21 August 2026 Flag Atlas research conversation. This document records evidence and analysis, not current product truth. Accepted decisions belong in `docs/product/colour-system.md` and the current product/design documents.

## A. Executive findings

The study supports **blue as Atlas's core action/brand family**.

The central result is not that blue is the most common national-flag colour. It is not: red dominates globally. The design conclusion comes from combining the measured flag vocabulary with the product's semantic requirements:

- red is globally dominant but is already needed for wrong/error feedback;
- green is also highly flag-native but is needed for correct/positive immediate feedback;
- yellow/gold is common enough to feel familiar but should remain scarce as a prestige/mastery accent;
- purple is exceptionally rare in national flags, which makes it unusually well suited to a durable mastery state;
- blue is the largest major flag-derived family that remains semantically available for ordinary action, selection, focus and exploration.

The resulting semantic hierarchy is:

> **Blue = action / exploration**  
> **Green = correct**  
> **Red = wrong**  
> **Purple = mastery**  
> **Gold = exceptional mastery / prestige**  
> **Graphite + cool near-white = interface shell**

The current repository at the time of the study already used an action blue, but the study supplied an empirical rationale for staying in the blue family rather than treating the existing hue as arbitrary.

## B. Canonical study frame

The repository is the source of truth for the curriculum:

- **195 countries** are explicitly enumerated in `src/data/countries.ts`;
- ISO3 is the canonical country identity;
- ISO2 is available for flag lookup;
- every country has a repository region and continent assignment;
- the continent taxonomy is Africa, Asia, Europe, North America, South America and Oceania;
- the learning taxonomy contains 24 regions;
- production flag URLs resolve through FlagCDN as `https://flagcdn.com/{iso2}.svg`.

No country colours were hand-assigned.

## C. Global flag colour distribution

The archived equal-country-weighted sensitivity output is:

| Colour family | Share of total flag area | Representative colour |
| --- | ---: | --- |
| Red | **30.76%** | `#E14A4A` |
| Blue | **17.09%** | `#3A5CA2` |
| Cyan / light blue | **3.36%** | `#51A1C4` |
| Green | **15.34%** | `#439B62` |
| Yellow / gold | **9.79%** | `#F3E348` |
| Orange | 1.80% | `#E48644` |
| Purple | **0.12%** | `#9B789D` |
| White / near-white | **16.16%** | `#F4F5F6` |
| Black / near-black | 2.25% | `#141619` |
| Grey | 3.34% | `#858A91` |

Combining blue and cyan/light-blue produces roughly **20.45%** of total flag area, which is the source of the rounded **20.5% Blue + cyan** figure used in the later brand summary.

### Main global observations

1. **Red is the dominant colour family globally.**
2. **Blue + cyan is the second-largest major family.**
3. **Green is also highly prevalent.**
4. **Yellow/gold is common but materially less dominant than red, blue or green.**
5. **Purple is extraordinarily rare.**

The broad ordering is more useful for product decisions than false precision in the last decimal place.

### Neutral treatment

White, black and grey were measured and reported, but separated from the chromatic clustering step. This prevents large white fields from dragging the chromatic palette toward muddy or desaturated centroids.

Neutral estimates are more sensitive than the major chromatic families to rasterisation, antialiasing and low-resolution edge pixels. This limitation is recorded rather than hidden.

## D. Data-driven chromatic clusters

The study tested a range of cluster counts and used perceptual colour coordinates rather than raw RGB. The reported seven-family solution was:

| Cluster | Representative | OKLCH (L / C / h°) | Chromatic share | Total flag area |
| --- | --- | --- | ---: | ---: |
| Saturated red | `#DC3033` | 0.586 / 0.208 / 25.7° | **28.7%** | **22.4%** |
| Green | `#2E8D4E` | 0.573 / 0.130 / 151.1° | 13.9% | 10.9% |
| Light red | `#EB7F77` | 0.715 / 0.134 / 25.7° | 12.6% | 9.8% |
| Yellow / gold | `#FAEA52` | 0.923 / 0.167 / 103.3° | 12.1% | 9.4% |
| Deep blue | `#163786` | 0.365 / 0.138 / 264.0° | 11.9% | 9.3% |
| Low-chroma cyan | `#7DB7AB` | 0.737 / 0.063 / 179.2° | 11.0% | 8.6% |
| Mid blue | `#517FB4` | 0.586 / 0.097 / 253.6° | 10.0% | 7.8% |

The clustering correctly separates lightness/chroma variants of red and blue. For interface design those variants are more useful as evidence for broader perceptual families than as seven independent UI colours.

The cyan result should also be interpreted cautiously because pale intermediate colours are particularly sensitive to raster antialiasing. It is evidence for the broader blue/cyan family, not a recommendation for a separate mint/cyan brand system.

## E. Why the measured centroid is not the UI token

The representative measured blue family was approximately:

- `#3A5CA2`
- OKLCH roughly `0.486 / 0.120 / 262.8°`

That colour describes the data but is subdued for a primary tactile interface control.

The recommended Atlas Blue is:

- `#2563EB`
- OKLCH roughly `0.546 / 0.215 / 262.9°`

The hue family is essentially preserved while lightness and chroma are increased for clarity, energy and tactile UI use.

The design rule is therefore:

> **derive the family from the evidence; tune the UI token for usability.**

## F. Geographic comparisons

### Continents

The archived continent comparison is:

| Continent | Red | Blue + cyan | Green | Yellow / gold |
| --- | ---: | ---: | ---: | ---: |
| Africa | 24.9% | 15.0% | **27.7%** | 12.7% |
| Asia | **37.4%** | 10.4% | 15.4% | 4.9% |
| Europe | **37.9%** | 20.4% | 5.6% | 10.7% |
| North America | 23.7% | **33.7%** | 10.3% | 9.2% |
| Oceania | 23.6% | **53.1%** | 6.3% | 5.2% |
| South America | **27.1%** | 20.7% | 16.2% | **19.0%** |

Useful observations include:

- Africa over-indexes green;
- Asia and Europe are strongly red-heavy;
- North America and especially Oceania are relatively blue-heavy;
- South America still has red as the largest of the tracked major families, while also having a comparatively high yellow/gold share.

These are real research observations, but the later product interpretation deliberately **does not assign continent theme colours**. The differences are better treated as descriptive evidence than as navigation semantics.

### Learning regions

Region-level differences were examined using the repository's existing 24-region taxonomy.

The strongest-looking deviations often came from very small groups. Examples discussed in the original report included Australia & New Zealand, Micronesia, Northern America, North Africa, Southern Cone, Polynesia and Atlantic South America. By contrast, several larger regions were much closer to the global mix.

The research conclusion was that region theming would overstate noisy differences and introduce many additional colours with little learning value.

**Recommendation: do not theme learning regions by flag colour.**

Region identity should come from geography, naming, map position, grouping and progression.

### Hemisphere experiment

The hemisphere analysis was exploratory. Countries were classified using one reproducible representative latitude/longitude point:

- latitude ≥ 0 → Northern;
- latitude < 0 → Southern;
- longitude ≥ 0 → Eastern;
- longitude < 0 → Western.

Trans-hemisphere countries were therefore assigned by the representative point rather than by a land-area split.

Archived results:

| Hemisphere | Red | Blue + cyan | Green | Yellow / gold |
| --- | ---: | ---: | ---: | ---: |
| Northern | 32.0% | 19.0% | 14.7% | 9.5% |
| Southern | 26.1% | **26.1%** | 18.2% | 10.8% |
| Eastern | 31.5% | 19.2% | 14.9% | 8.9% |
| Western | 29.1% | 23.3% | 16.6% | 12.0% |

The Southern group is somewhat bluer, and the Western group shows somewhat more blue and yellow/gold. These patterns largely reflect continent composition and historical flag traditions.

**Recommendation: hemisphere theming is not useful for production UI.**

## G. Questions answered

### 1. What colour families dominate globally?

Red first; blue/cyan second; green third among the major chromatic families, with yellow/gold following.

### 2. How much total area is white, black, red, blue, green and yellow/gold?

The archived sensitivity outputs are recorded in `data/global-colour-area.csv`, with the headline rounded figures:

- red ≈ 30.8%;
- blue + cyan ≈ 20.5%;
- white / near-white ≈ 16.2%;
- green ≈ 15.3%;
- yellow/gold ≈ 9.8%;
- black / near-black ≈ 2.3%.

### 3. Does one family dominate enough to justify becoming the brand colour?

Red dominates statistically, but is semantically unavailable because wrong/error feedback needs a strong, unambiguous red. The correct design decision therefore depends on both prevalence and semantic availability.

### 4. Are continent differences strong enough for accents?

They are interesting enough to describe, but not strong or useful enough to justify separate semantic palettes. Later product work explicitly rejected continent colour theming.

### 5. Are region differences meaningful?

Not reliably enough for theming. Small sample sizes make many apparent differences unstable.

### 6. Do hemisphere palettes show anything useful?

They show modest differences, especially more blue in the Southern and Western groupings, but not a useful production theming system.

### 7. What is the strongest available action family?

**Blue.** It is highly flag-native and remains clearly distinct from correct green, wrong red, mastery purple and mastery gold.

### 8. What was surprising?

The extreme rarity of purple is especially useful. It creates a naturally exceptional mastery colour against ordinary flag imagery.

## H. UI palette candidates

Three interface candidates were recorded:

| Candidate | Primary | Pressed | Tint | Focus | Canvas | Correct | Wrong | Mastery purple | Mastery gold | White text on primary | Dark text on primary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: |
| **Atlas Blue — recommended** | `#2563EB` | `#1749B8` | `#EAF0FF` | `#2563EB` | `#F6F8FB` | `#137A55` | `#B42318` | `#6D3FC0` | `#E0AF2F` | **5.17:1** | 3.60:1 |
| Atlantic Blue | `#0F6CBD` | `#094C87` | `#E7F2FA` | `#0A65B7` | `#F6F8FB` | `#137A55` | `#B42318` | `#6D3FC0` | `#E0AF2F` | **5.38:1** | 3.46:1 |
| Teal Blue | `#0B7285` | `#075A67` | `#E7F5F7` | `#08758C` | `#F6F8FB` | `#137A55` | `#B42318` | `#6D3FC0` | `#E0AF2F` | **5.59:1** | 3.33:1 |

### Candidate interpretation

**Atlas Blue** was recommended because it best balances the measured blue family with a brighter, tactile learning-game interface.

**Atlantic Blue** is calmer and closer to a conventional atlas/tool aesthetic, but carries less tactile energy.

**Teal Blue** remains accessible but sits unnecessarily close to the correct-green semantic family and was therefore not recommended as the primary action hue.

## I. Recommended semantic palette

| Role | Colour | Intended use |
| --- | --- | --- |
| Primary action | `#2563EB` | Primary buttons, selection, navigation/action emphasis |
| Pressed / depth | `#1749B8` | Physical press/depth state |
| Action tint | `#EAF0FF` | Selected surfaces and subtle action backgrounds |
| Canvas | `#F6F8FB` | Cool near-white shell |
| Primary text | `#101318` | Graphite text |
| Correct | `#137A55` | Correct answer / immediate positive feedback |
| Wrong | `#B42318` | Wrong answer / error |
| Mastery | `#6D3FC0` | Durable mastery state |
| Mastery gold | `#E0AF2F` | Scarce crown/prestige/completeness accent |

## J. Accessibility and contrast

Reference contrast checks reported in the study:

| Combination | Approx. contrast | Result |
| --- | ---: | --- |
| White on `#2563EB` | 5.17:1 | WCAG AA |
| White on `#1749B8` | 7.83:1 | WCAG AAA |
| White on `#137A55` | 5.33:1 | WCAG AA |
| White on `#B42318` | 6.57:1 | WCAG AA |
| White on `#6D3FC0` | 6.73:1 | WCAG AA |
| Dark text on `#E0AF2F` | 9.17:1 | WCAG AAA |
| White on `#E0AF2F` | 2.03:1 | insufficient for normal text |

Gold should therefore generally be treated as an accent with dark foreground content rather than a routine gold button with white text.

Semantic states should never rely on colour alone. They should also use wording, iconography/marks, border/state treatment, layout or other state cues.

## K. Gamification implications

The colour findings fit the emerging restrained gamification philosophy:

- ordinary navigation stays relatively quiet;
- green and red remain immediate task feedback rather than decorative branding;
- purple provides a visibly exceptional durable mastery state because it is rare in normal flag imagery;
- gold gains value by being rarer still;
- crown imagery can carry premium mastery/completeness without requiring XP, coins, lives, streaks or confetti;
- tactile satisfaction can come from press depth, motion, spacing and control geometry rather than adding more colour roles.

## L. Methodology and reproducibility

### Intended production-aligned pipeline

The preserved research script implements the following approach:

1. Parse the canonical 195 countries directly from repository data.
2. Resolve flags using repository ISO2 identifiers.
3. Download the FlagCDN SVG artwork used by the application.
4. Rasterise at a consistent width while preserving intrinsic flag proportions.
5. Ignore transparent pixels.
6. Give each country the same aggregate sampling weight.
7. Convert sRGB → linear RGB → OKLab.
8. Convert to OKLCH for reporting and hue interpretation.
9. Classify near-white, near-black and grey pixels before chromatic clustering.
10. Cluster chromatic pixels only.
11. Evaluate a range of cluster counts (`k ≈ 6–12`) with a fixed-seed silhouette criterion.
12. Aggregate globally, by repository continent and region, and in an exploratory hemisphere experiment.
13. Produce machine-readable outputs and contrast checks without adding application runtime dependencies.

### Neutral thresholds preserved by the script

The research implementation records explicit OKLCH thresholds, including approximately:

- white: `L ≥ 0.92` with low chroma;
- black: `L ≤ 0.18` with low chroma;
- grey: low chroma around `C < 0.035`;
- a broader low-chroma neutral gate around `C < 0.045`.

The exact implementation is preserved at `research/flag_colour_study.py`.

## M. Limitations

### Original execution constraint

The original chat environment could not complete a fresh bulk run over all 195 live FlagCDN SVGs. The CSV files in this archive therefore preserve the original equal-country sensitivity outputs exactly as produced in the conversation rather than claiming they are a later rerun.

The original report cross-checked the broad ordering against independent full-resolution national-flag colour studies and found strong agreement on the design-relevant pattern: red first, blue second, green third, yellow/gold following.

### Neutral precision

White/black/grey estimates are especially sensitive to raster resolution and antialiased boundary pixels. Treat those decimals as less robust than the broad chromatic ordering.

### Small geographic groups

Several learning regions contain very few countries. Large-looking regional deviations can therefore be sampling effects rather than stable visual identities.

### Hemisphere classification

A single representative coordinate is reproducible but does not represent the land-area distribution of countries spanning the Equator or prime meridian.

### UI translation

Cluster centroids describe artwork; they are not automatically accessible or attractive UI colours. Interface tokens require a separate usability and contrast step.

## N. Reproducibility artifacts

This archive preserves:

- the five original CSV outputs under `data/`;
- the exact stronger/current research script from draft PR #33 at `research/flag_colour_study.py`;
- the PR #33 GitHub Actions research workflow, archived as `historical-workflow.yml` beside this report.

The script/workflow remain research tooling only. They do not introduce runtime dependencies into Atlas. The workflow is kept as a historical record rather than an active CI job, and the script is not currently runnable end to end — see [Reproducibility limitations](README.md#reproducibility-limitations).

## O. Final recommendation

Atlas should use the colours of world flags as the **evidentiary foundation** for its colour architecture rather than literally reproducing average or centroid colours.

The recommended system is:

- cool near-white + graphite for the restrained atlas shell;
- vivid Atlas Blue `#2563EB` for ordinary action, exploration, selection and focus;
- green exclusively for correctness;
- red exclusively for wrong/error feedback;
- purple for durable mastery;
- gold only for scarce prestige/completeness treatment.

Do not build continent, region or hemisphere colour theming from this study unless later product evidence demonstrates a genuine learning benefit.

> **Core recommendation:** Blue drives action; green confirms correctness; red communicates mistakes; purple signifies mastery; gold appears only when mastery deserves something exceptional.

## References used for validation in the original conversation

- FlagCDN / Wikimedia Commons national-flag artwork as the production-aligned flag source family.
- Independent world-flag colour-area comparison used to sanity-check the global ordering: <https://www.jetpunk.com/user-quizzes/154362/most-common-colors-on-countries-national-flags-in-order-by-area>
- FIAV paper used to compare geographic tendencies, including Africa's stronger association with green: <https://fiav.org/wp-content/uploads/2021/06/ICV2530-Buxin-Han-Psychological-implication-and-geographic-differences-of-colours-in-national-flags.pdf>

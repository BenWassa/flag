# Flag Colour Study — Research Archive

> Historical/evidentiary research for Atlas (historically Flag Atlas). This directory preserves the study outputs and interpretation; it does not replace current product truth.

## Context

This study was conducted on 20–21 August 2026 to test whether Atlas's future brand/action palette could be grounded in the actual colours of the world's national flags rather than chosen arbitrarily.

The canonical sampling frame is the repository's 195-country curriculum in `src/data/countries.ts`, using ISO3 as the canonical country identity and ISO2 for flag lookup. The production flag source is FlagCDN SVG artwork.

## Method in brief

- 195 curriculum countries, each given equal aggregate weight;
- flag proportions preserved during rasterisation;
- transparent pixels ignored;
- sRGB converted to OKLab / OKLCH for perceptual analysis;
- white / near-white, black / near-black and greys separated before chromatic clustering;
- chromatic clusters evaluated across a sensible `k` range;
- global analysis treated as primary, with continent, region and hemisphere comparisons as secondary/exploratory analyses;
- UI palette recommendations derived from statistically justified colour families rather than copying cluster centroids directly.

## Provenance and relationship to PR #33

Draft PR #33, **Research: quantify the world flag colour palette**, contains the research branch `research/flag-colour-study`. Its `research/flag_colour_study.py` implementation is more complete than the separate local chat script artifact, so this archive reuses the exact PR #33 script blob rather than preserving two competing variants.

The accompanying `.github/workflows/flag-colour-study.yml` is also preserved exactly from PR #33 for reproducibility. It installs research-only Python dependencies and does not add runtime application dependencies.

The five CSV files under [`data/`](data/) are the original final CSV artifacts produced in the research conversation. They were copied without regenerating or changing their values.

## Files

### Reports transcribed from the research conversation

- [`full-report.md`](full-report.md) — the substantive full study: findings, clusters, geographic comparisons, accessibility, candidate palettes, methodology, limitations and recommendation.
- [`brand-implications.md`](brand-implications.md) — the later condensed report focused on the brand/semantic colour system.

These Markdown files did not exist as standalone artifacts during the original chat; they are archival transcriptions of the reports delivered in the conversation.

### Original generated data

- [`data/global-colour-area.csv`](data/global-colour-area.csv)
- [`data/chromatic-clusters.csv`](data/chromatic-clusters.csv)
- [`data/continent-comparison.csv`](data/continent-comparison.csv)
- [`data/hemisphere-comparison.csv`](data/hemisphere-comparison.csv)
- [`data/ui-palette-candidates.csv`](data/ui-palette-candidates.csv)

No PNG figures are included in this archive commit. A `figures/` directory should only be added later if the image outputs are explicitly accepted for archival use.

## Relationship to product truth

The evidence chain is:

**research evidence → product decision → later implementation**

The accepted colour-system decision is recorded in `docs/product/colour-system.md` by draft PR #37 (`docs/atlas-product-foundations`). At the time this archive branch was created, PR #37 had not yet merged and current `main` did not contain that file. This archive therefore references the product decision but does not copy, replace or modify it.

The accepted interpretation is intentionally narrower than the exploratory research:

- Atlas Blue is the global action/brand family;
- green is correct feedback;
- red is wrong/error feedback;
- purple is mastery;
- gold is scarce completeness/prestige;
- continent, region and hemisphere colour theming is not adopted.

Root `PRODUCT.md`, `DESIGN.md`, and `docs/product/` remain the normative product/design sources when their changes land on `main`.

## Important limitation

The original chat environment could not complete a fresh bulk 195-SVG FlagCDN execution. The archived numerical CSVs therefore preserve the original equal-country sensitivity outputs exactly as produced in the conversation and were cross-checked against independent flag-colour studies. The preserved PR #33 script is the production-aligned reproducible pipeline intended to rerun the analysis directly against current FlagCDN artwork.

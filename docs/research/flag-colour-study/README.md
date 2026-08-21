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

The accompanying workflow is preserved byte-for-byte from PR #33 as [`historical-workflow.yml`](historical-workflow.yml). It is deliberately archived here rather than under `.github/workflows/`, so it is historical material and not an active CI job — see [Reproducibility limitations](#reproducibility-limitations) for why. It installed research-only Python dependencies and never added runtime application dependencies.

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

The accepted colour-system decision is recorded in [`../../product/colour-system.md`](../../product/colour-system.md), which landed on `main` with PR #37 (`docs/atlas-product-foundations`). This archive references that decision but does not copy, replace or modify it.

The accepted interpretation is intentionally narrower than the exploratory research:

- Atlas Blue is the global action/brand family;
- green is correct feedback;
- red is wrong/error feedback;
- purple is mastery;
- gold is scarce completeness/prestige;
- continent, region and hemisphere colour theming is not adopted.

Root `PRODUCT.md`, `DESIGN.md`, and `docs/product/` remain the normative product/design sources when their changes land on `main`.

## Reproducibility limitations

Treat this directory as preserved evidence, not as a pipeline that can be rerun unattended. Two distinct limitations apply, and they are the reason the workflow is archived rather than active.

**No fresh bulk execution was ever completed.** The original chat environment could not complete a fresh bulk 195-SVG FlagCDN execution. The archived numerical CSVs therefore preserve the original equal-country sensitivity outputs exactly as produced in the conversation, cross-checked against independent flag-colour studies. They were not regenerated for this archive.

**The archived script has a known external-API failure.** `restcountries_coordinates()` in [`../../../research/flag_colour_study.py`](../../../research/flag_colour_study.py) assumes `https://restcountries.com/v3.1/all` returns a list of objects, and calls `row.get("latlng")` without validating the shape. When that endpoint returns an error document instead, iteration yields strings and the run aborts with `AttributeError: 'str' object has no attribute 'get'`. The archived workflow hit exactly this failure. Analytically only the hemisphere comparison depends on those coordinates, but the call sits ahead of every CSV write, so the failure aborts the run before any output is produced.

Repairing the script is out of scope for this archive: the reports and CSVs already preserve the findings, and restoring a maintained research pipeline would be separate work. The script is kept because it documents the method that produced the evidence, not because it is currently runnable end to end.

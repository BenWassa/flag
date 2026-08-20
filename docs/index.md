# Documentation

The documentation is organised by purpose rather than by file format or feature name.

## Sections

- [`architecture/`](architecture/) — durable technical decisions, system boundaries, routing, and data provenance.
- [`product/`](product/) — current product requirements, behaviour, and content policies.
- [`open/`](open/) — active issue plans and unresolved proposals.
- [`closed/`](closed/) — completed issue worklogs, release records, superseded plans, and historical reviews.

Repository-level documents remain at the project root when they describe the whole project: [`README.md`](../README.md), [`PRODUCT.md`](../PRODUCT.md), and [`DESIGN.md`](../DESIGN.md).

## Filing rules

- Use lowercase kebab-case filenames.
- Keep this structure shallow; add a new top-level category only when the existing four do not fit.
- Move an issue document from `open/` to `closed/` when the issue is completed or superseded.
- Put lasting decisions in `architecture/` or `product/`; do not make worklogs the only source of truth.
- Update this index and inbound links when moving a document.

# Issue #36 — Rename learner-facing product to Atlas

GitHub: https://github.com/BenWassa/flag/issues/36

## Goal

Rename the learner-facing product from **Flag Atlas** to **Atlas** now that Flags, Locations, Outlines and Neighbours are equal product domains.

## Compatibility boundary

Documentation may adopt Atlas immediately.

Production implementation should update visible brand/metadata while preserving stable technical identifiers where migration has no product value, including repository name, routes, storage namespaces and legacy cache identifiers as appropriate.

Do not create a breaking migration purely for cosmetic consistency.

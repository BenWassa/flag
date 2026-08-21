# Issue #19 — Neighbours mobile keyboard stability

GitHub: https://github.com/BenWassa/flag/issues/19

## Goal

Keep the Neighbours map/input composition spatially stable when the mobile software keyboard opens, during repeated guesses, and when the keyboard closes/reopens.

## Product invariant

The learner should be able to keep looking at the map while entering consecutive neighbour names without repeated scroll jumps or losing geographic context.

## Scope guard

Preserve adjacency, attempt budget, learning evidence, map geometry, solved/revealed semantics and routing/storage contracts.

This is a focused mobile interaction issue and may ship independently of the broader Atlas visual redesign.

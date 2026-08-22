# Issue 72 — Legacy code paths, CSS architecture, and repository bloat audit

## Status

Audit scope only. No implementation changes should be made until findings are reviewed.

## Trigger

A refresh bug was observed:

1. Enter a regional quiz (example: West Africa Flags).
2. Refresh the page.
3. The application can display an older Africa-era experience with different styling.

This suggests that historical application paths may still be reachable during reload/bootstrap.

## Audit goals

Determine why legacy UI appears and identify whether the repository contains obsolete architecture that should be removed or consolidated.

## Investigation areas

### 1. Refresh and routing behaviour

Investigate:

- hash route restoration after refresh;
- application bootstrap order;
- default route fallbacks;
- route ownership and view mounting;
- whether stale state can override the current URL.

Evidence required:

- failing URL/hash;
- rendered view source;
- responsible route/view files;
- root cause classification.

### 2. Service worker and cache audit

Check:

- cached HTML/JS/CSS assets;
- service worker update behaviour;
- cache versioning;
- whether old deployments can survive after new releases.

### 3. Legacy application archaeology

Search current tree and git history for:

- Africa-only implementations;
- previous quiz architecture;
- deprecated views;
- duplicate rendering paths;
- abandoned components;
- unused assets.

Classify findings:

- active and required;
- historical but harmless;
- dead code candidate;
- migration risk.

### 4. CSS architecture audit

Current stylesheet split should be evaluated, not automatically collapsed.

Review:

- stylesheet ownership;
- imports;
- duplicated selectors;
- conflicting tokens;
- legacy themes;
- unused classes;
- alignment with DESIGN.md.

Questions:

- Is global CSS still needed?
- Are feature styles correctly isolated?
- Are there multiple competing design systems?
- Can shared primitives be simplified?

### 5. UI/view architecture audit

Review `src/ui` and related rendering paths:

- view ownership;
- component duplication;
- route/view boundaries;
- state coupling;
- repeated layout patterns;
- obsolete UI modules.

Do not refactor until dependencies are understood.

### 6. Repository hygiene

Check for:

- unused files;
- duplicate utilities;
- dead imports;
- outdated documentation;
- generated files accidentally tracked.

## Expected deliverables

Produce an audit report containing:

- reproduction steps;
- root cause of legacy refresh behaviour;
- affected files;
- CSS architecture assessment;
- UI architecture assessment;
- cleanup recommendations;
- proposed implementation sequence.

## Constraints

- Preserve Atlas architecture direction.
- Preserve learner data and domain boundaries.
- Avoid broad rewrites.
- Remove only code with evidence of being unused.

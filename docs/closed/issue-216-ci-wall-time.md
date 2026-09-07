# Issue #216 — CI wall-time closeout

**Status:** CLOSED  
**Implementation:** PR #218  
**Merged main:** `4368045dd99e717ff143c0e4c81135cafae0f2b8`

## Problem

After #210 simplified Atlas to four permanent workflow files, normal CI still took roughly 15 minutes because desktop Chromium, mobile Chromium and PWA exact-production acceptance ran serially in one job. A failure late in the job forced already-green surfaces to rerun.

## Shipped architecture

The repository gate remains the single producer of `flag-atlas-dist`. After it passes, reusable exact-production acceptance runs three independent jobs in parallel:

- desktop Chromium product contracts;
- mobile Chromium product contracts;
- PWA lifecycle.

Each job:

- checks out the same commit;
- uses Node 22;
- installs from the authoritative lockfile with `npm ci`;
- downloads the same repository-gate `dist`;
- verifies the embedded build SHA;
- preserves deterministic Playwright execution with `workers=1` and `retries=0`;
- uploads diagnostics only on failure.

PR CI uses per-PR concurrency so superseded commits cancel. `main` verification uses unique groups and is not cancelled by later main pushes. Pages and Firebase still deploy the exact tested main artifact.

No product behaviour or standing acceptance coverage was removed for speed. #212's temporary broad-suite proof remains a reconciliation concern and is not permanent CI infrastructure.

## Measured result

Representative green PR run `34130685230` completed in about 8m57s versus the previous ~14m49s baseline.

- repository verify: ~1m45s;
- PWA acceptance: ~1m29s;
- mobile acceptance: ~5m34s;
- desktop acceptance: ~7m05s;
- the three acceptance surfaces overlap rather than stack serially.

Merged-main evidence for `4368045dd99e717ff143c0e4c81135cafae0f2b8`:

- CI / parallel exact-production acceptance: `34151995255` — success;
- GitHub Pages exact-artifact deployment: `34152604902` — success;
- Firebase Hosting + rules + live-origin/cache verification: `34152604900` — success.

# Issue #196 — Spatial Home chooser material closeout

**Status:** CLOSED  
**Implementation:** PR #217  
**Merged main:** `c7752368d770adcd8394d9eccf59921aec62643d`

## Decision

The centred Spatial Home chooser remains one bounded surface over the full world globe, but it is no longer a translucency exception. It now uses ordinary opaque cool near-white Atlas chrome with a thin neutral edge and restrained tile depth.

The globe remains the dominant saturated object because it owns the canvas around the bounded chooser, not because geography bleeds through the controls.

Preserved:

- full-globe Home;
- centred four-mode chooser;
- geography-led scope selection;
- Profile / earned World Crown hierarchy;
- routing, progress and Mastery semantics;
- focus/accessibility, renderer fallback and responsive composition.

No geography, scoring, evidence, persistence or routing rule changed.

## Verification

PR #217 exact-production acceptance covered ordinary phone portrait, 320×568, short landscape, deliberate globe rotation behind the chooser, loading/fallback, forced colours, reduced motion and narrow effective 200% text-zoom reflow.

Merged-main evidence:

- CI / exact-production acceptance: `34130367592` — success;
- GitHub Pages exact-artifact deployment: `34131753572` — success;
- Firebase Hosting + rules + live-origin/cache verification: `34131753509` — success.

Physical-device evidence was not claimed. Issue #71 remains the owner hardware gate after the remaining #212 gesture/broad-suite work is resolved.

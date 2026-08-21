# Issue #32 — New Atlas visual system

GitHub: https://github.com/BenWassa/flag/issues/32

## Status

**Complete.** Shipped through PR #38. Tactile Atlas, scope-first navigation and the Phosphor routine-icon system are implemented and documented. Achievement persistence and prestige artwork remain separate work owned by #34.

## Locked foundations

- Atlas Blue action family;
- green correct / red wrong;
- purple region × domain mastery;
- gold scarce completion/prestige;
- continent crest for complete continent;
- Crown for complete world only;
- mobile first;
- geography remains visually dominant;
- no horizontal scrolling for primary selection;
- no XP/coin/reward economy.

## Resolved by this issue

- Tactile Atlas visual personality;
- four-tier radius/squircle language;
- restrained depth and collapsing press physics;
- system-sans typography with weight and tracking contrast;
- scope-first World → continent → region-card navigation;
- Phosphor Bold routine iconography through #40;
- restrained motion with complete reduced-motion handling.

## Deferred to #34

- exact region-mastery shield treatment;
- continent crest and world Crown art direction;
- milestone ceremony tied to earned achievements.

No React/Tailwind/framework migration is implied by the redesign.

## Closeout

- Shipped through PR #38; merge commit `ed6399e70be504632dff95d72cb217bcc762a16e`.
- PR CI passed on feature head `97618190e166dc04c1586a400d9689b879ba0497`.
- `npm test` passed on merged `main` at `ed6399e70be504632dff95d72cb217bcc762a16e` on 2026-08-21 after stopping an interfering local dev watcher.
- The exact locally built `dist/` was inspected in Opera at 390×844 phone portrait and 844×390 short landscape. Home and Africa region surfaces had no horizontal overflow; region identity, counts, domain glyphs and touch targets remained legible; short landscape used the intended two-column region layout; inspected flows produced no console warnings or errors.
- The boot-time heading focus outline was reproduced and remains tracked separately in #41. No physical-device or assistive-technology session is claimed.
- Deferred work remains in #20, #29, #30, #34, #36, #41, #42 and #43.

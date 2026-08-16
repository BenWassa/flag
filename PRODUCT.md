# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: mobile-first TypeScript PWA with no runtime framework dependencies for the current MVP. GitHub Pages is the near-term static deployment target; Firebase may later provide hosting, identity, and sync without entering the learning domain layer.

## Users

People who want to learn or test national-flag recognition efficiently, from casual geography learners through users deliberately working toward complete world coverage. They may study the whole world, a continent, or a conventional geographic region.

## Product Purpose

Flag Atlas teaches the 195 core sovereign-state flags through fast visual identification. It maintains a persistent knowledge ledger so a learner can see which flags are Unseen, Learning, or Mastered and continue from that state later.

## Positioning

Seterra-like immediacy combined with persistent adaptive mastery: scope remains user-controlled while Learn mode decides which flags inside that scope deserve attention next. Test mode provides a clean assessment path without immediate correctness feedback.

## Operating Context

The primary loop is Choose scope → Learn/Test → identify flag → update knowledge state → review results → continue. Sessions default to 10 questions. Users may return after long gaps; progress must survive restarts and remain independent of transient quiz UI state.

## Capabilities and Constraints

- Core catalog: 195 sovereign-state flags.
- Geography hierarchy: World → Continent → Region.
- Core learning states: Unseen → Learning → Mastered.
- Mastery v1: three qualifying correct answers across separate rounds; shorter recovery after a mastered lapse.
- Learn and Test are separate intents.
- MVP is flags only. Country location, maps, capitals, and broader geography are future directions.
- Local-first persistence and PWA behavior are required.
- Flag assets currently resolve through FlagCDN; vendored assets remain a production hardening item.
- The scheduler must remain replaceable so later learning-science research can upgrade adaptive mastery without UI or storage rewrites.

## Brand Commitments

- Product name: Flag Atlas.
- Fast and direct like Seterra, with a stronger contemporary UI.
- Engagement comes from the recognition loop and visible mastery rather than streaks, XP, lives, coins, mascots, or reward economies.
- Flags remain the dominant visual material.

## Evidence on Hand

- Complete 195-country curriculum and 24 learning regions.
- Working mastery, retention, confusion, quiz-randomization, persistence, and result logic in the repository.
- No user research, retention benchmark, or finalized adaptive-learning study has yet been supplied.

## Product Principles

1. Reach useful practice in one or two taps.
2. Keep geographic scope under the learner's control while making item selection adaptive.
3. Make the durable knowledge ledger more important than a single-round score.
4. Spend repetition on weak recognition and retire established knowledge gradually.
5. Keep product chrome subordinate to the flags and the task.

## Accessibility & Inclusion

The web experience must support keyboard operation, visible focus, non-color-only state communication, reduced motion, mobile safe areas, readable zoomed text, and generic flag alt text until the answer is revealed.

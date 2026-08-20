# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: mobile-first TypeScript PWA with no runtime framework dependencies for the current MVP. GitHub Pages is the near-term static deployment target; Firebase may later provide hosting, identity, and sync without entering the learning domain layer.

## Users

People who want to learn or test world geography efficiently, from casual geography learners through users deliberately working towards broad country knowledge. They may study the whole world, a continent, or a conventional geographic region where the selected learning domain supports that scope.

## Product Purpose

Flag Atlas teaches country geography through four learning domains: **Flags, Locations, Outlines, and Neighbours**. It maintains persistent domain-specific knowledge ledgers so a learner can see which items are Unseen, Learning, or Mastered and continue from that state later.

## Positioning

Seterra-like immediacy combined with persistent adaptive mastery: scope remains user-controlled while Learn mode decides which items inside that scope deserve attention next. Test mode provides a clean assessment path without immediate correctness feedback.

## Operating Context

The primary loop is Choose domain → Choose scope → Learn/Test → answer the geography task → update knowledge state → review results → continue. Users may return after long gaps; progress must survive restarts and remain independent of transient quiz UI state.

## Capabilities and Constraints

- Core flag catalogue: 195 sovereign-state flags.
- Geography hierarchy: World → Continent → Region where supported.
- Learning domains: Flags, Locations, Outlines, Neighbours.
- Flags support the full 195-country curriculum.
- Locations and Outlines currently support Africa and its five learning regions using the canonical production geometry pipeline.
- Neighbours currently supports standard Africa targets and five regions using topology-derived land-border adjacency. The stable internal route remains `/neighbors`.
- Core learning states: Unseen → Learning → Mastered.
- Mastery v1: three qualifying correct answers across separate rounds, with shorter recovery after a mastered lapse where the domain uses the shared mastery convention.
- Learn and Test are separate intents.
- Local-first persistence and PWA behaviour are required.
- Flag assets currently resolve through FlagCDN; vendored assets remain a production hardening item.
- The scheduler must remain replaceable so later learning-science research can upgrade adaptive mastery without UI or storage rewrites.

## Product Language

- Product copy uses modern British English (`en-GB`).
- The learner-facing domain label is **Neighbours**.
- Stable technical identifiers such as `neighbors`, `/neighbors`, `neighbors.css`, and existing neighbour-progress storage namespaces are compatibility contracts and are not localised.
- Use **practice** as a noun and **practise** as a verb.
- Country display names remain governed by [`docs/product/country-naming.md`](docs/product/country-naming.md), independently of the British-English copy standard.

## Brand Commitments

- Product name: Flag Atlas.
- Fast and direct like Seterra, with a stronger contemporary UI.
- Engagement comes from the recognition loop and visible mastery rather than streaks, XP, lives, coins, mascots, or reward economies.
- Geography itself remains the dominant visual material; product chrome stays subordinate to the task.

## Evidence on Hand

- Complete 195-country flag curriculum and 24 learning regions.
- Production Africa cartography used by Locations, Outlines, and the Neighbours map reveal.
- Working mastery, retention, confusion, quiz-randomisation, persistence, results, routing, and offline-shell logic in the repository.
- No user research, retention benchmark, or finalised adaptive-learning study has yet been supplied.

## Product Principles

1. Reach useful practice in one or two taps.
2. Keep geographic scope under the learner's control while making item selection adaptive.
3. Make the durable knowledge ledger more important than a single-round score.
4. Spend repetition on weak recognition and retire established knowledge gradually.
5. Keep product chrome subordinate to the geography and the task.

## Accessibility & Inclusion

The web experience must support keyboard operation, visible focus, non-colour-only state communication, reduced motion, mobile safe areas, readable zoomed text, and answer-safe accessible descriptions. Assistive-technology output is product copy and follows the same British-English language standard as visible text.

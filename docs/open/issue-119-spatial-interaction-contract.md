# Issue #119 — F1: Spatial interaction contract

**Status:** DECIDED AND IMPLEMENTED on the full-candidate branch.
**Owner of this decision:** the #119 implementation agent, under the owner authorisation recorded on the issue (2026-08-29).
**Supersedes:** the reserved-F1 placeholder in `issue-119-principal-packet.md`.

This is a decision record, not a proposal. Everything below is implemented; the
implementing module is named beside each rule.

---

## 1. The one rule

**The route is the application. The stage is an interpretation of it.**

`src/spatial/spatial-state.ts` is a **pure function** of authoritative state —
the typed route, the current `AppStore` view, and earned achievements — to a
`SpatialState`. It holds no state of its own, writes no history, and is
verified not to contain `pushState`, `replaceState` or any write to
`location`.

Three consequences fall straight out, and they are the reason the contract is
shaped this way:

- there is no second navigation state machine to keep in sync;
- interrupted camera travel can never desynchronise the application, because the
  application was never waiting on the camera;
- Back, Forward, a cold deep link and a typed URL all reach the same spatial
  state by the same path, with no replay of ancestry.

## 2. Stage modes

The stage has five modes. Nothing else varies.

| Mode | When | Geography | Selectable |
| --- | --- | --- | --- |
| `world` | Home, and each domain's continent index | whole Earth, neutral | continents (none at Home) |
| `focus` | a continent or region launcher | that scope framed and lit, the rest context | regions |
| `context` | a live Flags question | framed but inert and **unlit** | nothing |
| `results` | any domain's results view | the scope just played, re-framed | nothing |
| `yielded` | Locations / Outlines / Neighbours questions, the Flags study gallery, Profile | not rendered at all | nothing |

Progressive disclosure is the ladder itself: the deeper the route, the fewer
things are selectable. World picks continents. A continent picks regions. A
region is a leaf. An activity picks nothing.

One layout adaptation, and only one: on a **short landscape** viewport
(844 × 390 and similar) `context` stands the geography down completely for the
duration of the question. Splitting that viewport between a globe and a Flags
question left the answers in a column too narrow to read, with options clipped
off-screen. A phone in landscape has no room to share, and the activity is the
content. The contract is unchanged — the mode is still `context` — the layout
simply refuses to pretend there is room.

## 3. The Locations-versus-globe decision

This was the hardest question in the brief, and the answer is a refusal.

**Spatial continuity is between activities, not during them.**

Locations' learning object is already a map. Stacking a live globe behind a live
answer map gives the learner two maps, two gesture owners and two ideas of where
they are — and, worse, a second surface on which the answer to "where is Ghana?"
is visible. Neighbours has the same shape. Outlines' silhouette is a shape the
learner could match against lit geography.

So those three domains take the whole screen. `yielded` is not "the globe is
hidden": the shell collapses to a plain block, the document scrolls exactly as it
does without the spatial shell, and the renderer is switched off entirely
(`setActive(false)`), which also returns the whole frame budget to the activity.
Every existing Locations invariant — pan, zoom, tiny-country assistance, pointer
capture, answer feedback, re-selectability — is preserved because the production
surface is untouched, not reimplemented.

Flags is the exception, and it earns it: a flag cannot be read off a map. There
the globe stays mounted as quiet context at a reduced share of the viewport. It
carries **no scope highlighting at all** while a question is live — an in-scope
tint during a question is a hint — and it takes no pointer events.

The alternative considered and rejected: making the globe itself the Locations
answer surface. It would have to reproduce zoom, pan, tiny-country assist discs,
the #117 hit-precedence rule, callouts and insets on a sphere, and would put a
learner's answer accuracy at the mercy of a WebGL fallback path. The cost is
enormous and the benefit is a visual transition.

## 4. Gesture ownership

Implemented in `src/spatial/gestures.ts`.

| Gesture | Meaning |
| --- | --- |
| one-finger drag | rotate the Earth |
| tap | select geography |
| two-finger pinch | dolly |
| wheel | dolly (pointer devices) |
| anything starting in the 28 px edge gutter | **the platform's**, untouched |

`touch-action: none` is scoped to `.spatial-stage__surface` only — never to the
document — so page scrolling elsewhere and the Android/iOS edge-back gesture keep
working. The gutter width matches the reserve the production launcher already
uses, so the two agree.

Direct manipulation always outranks choreography: a drag or pinch calls
`director.nudge()`, which cancels in-flight travel and takes ownership of the
pose. The route is untouched, so the learner has moved the camera, not the
application.

## 5. Camera grammar

Implemented in `src/spatial/camera-director.ts`. One ease, one duration
(620 ms), no orbits, no fly-throughs.

- **Forward travel** and **Back/Forward** are the same operation: travel to the
  pose the new route implies. Back is not a reversed animation; it is another
  destination. That is what makes an interrupted Back correct rather than stuck.
- **Interruption** retargets. A route change mid-flight moves the destination and
  the camera continues from where it is.
- **Same-level selection** (region to sibling region) is ordinary travel.
- **Cold start and deep links** are immediate. `firstPaint` settles the camera at
  the destination rather than replaying the ancestor chain as a cutscene.
- **Reduced motion** keeps the destination and drops the journey. It is read per
  movement, not cached, because a learner can change it mid-session.

## 6. What the camera points at

`framingFor` (in `src/spatial/geo.ts`) takes the union of the framing boxes a
scope contributes and re-centres on that union. Two details do real work:

- longitude is averaged **circularly**, so a Pacific scope frames on the Pacific
  rather than at longitude 0 — the exact opposite side of the planet;
- the union's midpoint, not the mean of country centres, decides the centre.
  Thirteen Caribbean states would otherwise outvote Canada and put "North
  America" in the Atlantic.

Which countries contribute is decided by the **declared framing policy** of F3,
not by this layer. See `issue-119-spherical-geography-contract.md` §5.

Framing always reads the **world** asset, never the continent detail asset, so
the camera does not visibly re-aim the moment higher-detail geometry arrives.

## 7. DOM and geography resolve to the same action

Required by the accessibility contract, and structural rather than incidental.

A tap resolves through `resolveTapTarget()` to a **scope id**, which
`AtlasApp` passes to the same `navigateStable(routeForScopeId(...))` call the DOM
buttons use. The rule a tap follows is:

> take me to the smallest scope I am currently able to choose that contains this
> country.

At world level that is the country's continent. Inside a continent it is the
learner-facing region the country belongs to, read from **the same table the
launcher renders** — `regionLearningScopes` for Flags, `getMapContinentConfig`
for the geography domains, so the cross-continental Middle East scope resolves
correctly. A tap outside the framed continent travels back out to that continent,
so the globe has no dead area.

`verify-spatial-atlas.mjs` walks all 195 countries × 4 domains × 6 continents and
asserts every resolved target is a scope the launcher also offers and a route
that parses.

**The parity gap this exposed, and the fix.** The conventional launcher's region
rows are *Play* buttons: nothing in the DOM navigates to a region scope without
starting a round. A geography tap therefore had an action no keyboard user could
reach. `src/spatial/SpatialScopeBar.tsx` is the fix — the one control the
spatial shell adds, rendered under the geography it mirrors, dispatching exactly
the action a tap dispatches. It wraps rather than scrolls, because DESIGN.md
forbids horizontal scrolling for primary selection.

Continent selection needed no such control: the domain index already lists every
continent as a real button.

## 8. Accessibility

The globe is a pointer and visual surface. It is not an interface.

- the canvas is `aria-hidden` — an unlabelled canvas in the accessibility tree is
  noise, not access, and canvas accessibility theatre is explicitly out of scope;
- every spatial action has a real DOM control, verified exhaustively (§7);
- keyboard order runs straight into the panel; there is no canvas focus trap;
- the stage publishes a plain-text caption naming what is framed, in document
  order before the controls;
- focus restoration, autofocus and the live region remain exactly as production
  already implements them — the shell wraps the screens, it does not replace them;
- `@media (forced-colors: active)` hides the stage entirely and returns the plain
  document. A WebGL canvas cannot follow a forced palette, and a coloured
  rectangle that ignores the user's colours is worse than no rectangle;
- no state relies on colour alone: mastery and completion tints accompany the
  text the launcher already carries.

## 9. Progress, Mastery and prestige on the geography

No new achievement system, no new qualification rule. `deriveSpatialState` reads
the existing `EarnedAchievementState` through the existing predicates.

- ordinary geography: neutral;
- in-scope geography: light (`--map-active-land`);
- out-of-scope: context (`--map-context-land`);
- unsupported for this domain: a distinct, visibly not-playable tone;
- **earned** region × domain Mastery: restrained purple;
- **earned** region completion: restrained gold;
- Atlas Blue appears on the geography in exactly one place — the scope marker
  (§10) — which is selection emphasis, the role the colour system assigns it.

Mastery and completion tints appear **only at continent or region focus**, never
at world level. The globe does not become a progress choropleth. Continent crests
and the World Crown stay where #138 put them: in the DOM.

## 10. Scope markers

Choosing Polynesia frames three islands a few pixels across. Without a mark, a
learner is looking at empty ocean and cannot tell the scope loaded.

Countries narrower than 1.5 % of the framed span get an Atlas Blue disc — the
globe's equivalent of the projected maps' locator dot. A continent of
ordinary-sized countries gets none, so the marker stays meaningful.

## 11. Unsupported geography

Every continent stays drawn and orientable. A scope a domain has not shipped
takes the `unavailable` tone, is never accompanied by a progress figure, and
resolves through the existing `normalizeAvailableRoute` honesty rules. All six
continents currently ship all four domains, so this path is a contract rather
than a common case — but it exists, and it is verified.

## 12. One change outside the spatial module

`src/map-viewport.ts` marked a map viewport "positioned" and computed its opening
frame **before** waiting for the element to have a size. React can hand its
mutation observer a subtree it has built but not yet attached, and a detached
element has no aspect: `viewportAspect` falls back to 1:1, the frame is computed
against that square, `applyBox` remembers it, and the resize path then faithfully
re-applies the wrong frame at the real aspect rather than correcting it.

Whether the opening frame was right was therefore decided by mutation timing.
On `main` that race usually lands the right way. Under the spatial shell it
landed the wrong way **six times out of six**: whole-Africa Locations Learn at
840 × 360 opened with ten countries cropped off the stage.

The fix defers positioning until the viewport actually has a box, and lets the
resize observer trigger the deferred fit when it gains one. The frame it produces
is slightly looser than the racy one — the generated 26-unit focus margin is now
actually honoured, where before a scope could end edge-to-edge — and no scope is
cropped at any tested viewport.

This is a change to a preserved contract, made because the alternative was
shipping cropped geography. It is flagged for review: the `focusMinimumByScope`
values in `scripts/map-continent-configs.mjs` were tuned against the racy
behaviour, and a production migration should re-check them.

## 13. What this contract deliberately does not do

- it does not animate between activity screens — the activity is the content;
- it does not label countries on the globe — labels are a second cartography
  system and a leakage surface;
- it does not add a spatial-only route, parameter or history entry;
- it does not celebrate. Results resolve over the geography; that is all.

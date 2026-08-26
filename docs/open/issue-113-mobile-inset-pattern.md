# Issue #113 — Mobile map inset pattern

**Status:** In progress

## Decision

Atlas uses four separate small-geography tools:

1. a locator dot for one tiny island;
2. a leader-line callout for one narrow mainland country when surrounding water
   gives the line and target an unambiguous home;
3. viewport fitting/cropping for remote non-scoring country components that
   would otherwise shrink the learning geography;
4. a generated magnified inset for two or more scoring countries whose honest
   locations are too tightly packed for separate 44 CSS px hit surfaces.

The inset is fixed in screen space and redraws the same canonical geometry. Its
source window remains outlined in place. It appears only when the current target
belongs to it, so it is an answer surface rather than persistent map chrome.
Labels name a sea or region, never a member country. Each answer receives a
distinct positional accessible label without leaking the answer.

## Europe audit

| Candidate | Decision | Reason |
| --- | --- | --- |
| Andorra, Liechtenstein, Luxembourg, Monaco, San Marino, Vatican City | Keep existing individual mainland callouts | Each is a single microstate and the audited callouts remain separable. A cluster panel would add chrome without solving an overlapping-answer problem. |
| Malta | Keep existing island locator | It is one small island target, the established locator case. |
| Remote parts of Russia, France and Norway | Keep viewport crop/focus exclusions | The parts are canonical geometry but not separate Europe scoring targets. Existing generated fit exclusions enlarge Europe without inventing replacement polygons. |
| Iceland and the main European islands | No assistance | Phone-scale geometry remains independently selectable; distance alone does not justify moving scoring geography. |

Europe therefore needs no inset in this rollout.

## Asia audit

| Candidate | Decision | Reason |
| --- | --- | --- |
| Bahrain, Maldives, Singapore | Keep existing island locators | Each is a single tiny island target. |
| Japan, Indonesia and the Philippines | No inset | Multipart shape and relative position are valuable recognition cues; their ordinary targets remain usable with pan/zoom. |
| Eastern Mediterranean: Lebanon, Israel, Palestine | Ship the first true-scale inset | In the Middle East opening view Palestine is roughly 2.5 CSS px and the three countries are too close for independent expanded hits. The generated 95 × 233px panel gives all three non-overlapping 44px answer surfaces, a 17.6× minimum-target increase. |
| Persian Gulf: Bahrain, Qatar, Kuwait, United Arab Emirates | Refuse a true-scale inset | Bahrain and Qatar require high magnification while the full cluster is wide. The generator measures a required panel above the 260px phone limit. A future schematic arrangement needs its own design decision. |
| Russia as Asia context | Keep generated focus treatment | Russia is non-scoring context in Asia; it must not force a scoring inset or create a second country geometry. |

## Generated contract

Configuration owns only the stable inset ID, place label, member country IDs and
corner. The shared generator derives the window, land-safe tap anchors, panel
size and hit radius. It rejects country-name labels, unknown/duplicate members,
overlapping panel membership, unsupported corners and panels too large for the
phone stage.

The panel is attached only to scopes containing every member. This prevents a
regional round from exposing an answer outside its curriculum.

## Acceptance gates

- reproducible four-continent generation;
- focused generator/rendering verifier;
- 44 CSS px target measurements in mobile portrait and 740 × 360 short
  landscape browser layouts;
- panel containment, distinct keyboard stops, Enter/Space activation, no answer
  leakage, forced-colours fallback and unchanged pan/zoom ownership;
- complete `npm test` and `npm run test:browser` before merge.

Physical iPhone/Android testing is not claimed by this issue.

# Issue #228 — Europe Locations audit (working record)

**Status:** in progress. Landed here: shared initial-fit (#227) applied to Europe, Andorra's practical target retuned, measurement of every Europe microstate. **Not** landed: a decision for the inland enclaves (San Marino, Liechtenstein, Luxembourg) — see [Open decision](#open-decision).

Evidence is from the exact production build, headless Chromium, 390×844 unless stated. It is engineering evidence, not physical-device evidence (#71 owns that).

## Opening frames (canvas units, canvas 835×723)

| Scope | Before | After | Edge drivers after | Fit-only exclusions in scope |
|---|---|---|---|---|
| Europe | 725.3 × 542.9 | **623.7 × 476.0** | ISL (left), RUS/UKR (right), FIN/NOR/RUS (top) | PRT, ESP (Azores, Madeira, Canaries) |
| Northern Europe | 517.8 × 274.2 | unchanged | ISL, FIN, GBR | — |
| Western Europe | 214.3 × 234.9 | unchanged | FRA, AUT, DEU | — |
| Eastern Europe | 311.9 × 227.4 | unchanged | CZE, RUS/UKR, BLR, BGR | — |
| Southern Europe | 631.6 × 299.8 | **420.9 × 232.9** | ESP, PRT (mainland) | PRT, ESP |

Southern Europe opens 1.5× closer. Before, the left edge was pinned to the canvas edge by the Azores/Madeira (Portugal) and the bottom edge ran well past Spain's mainland because of the Canary Islands. Northern, Western and Eastern Europe were already framed on mainland geography (the older whole-country FRA/NLD/NOR/RUS exclusions), so no change was needed.

### Spain / remote-component decision

- The Natural Earth production topology holds Spain as one multipart `ESP` (mainland, Balearics and Canaries). Eight Canary components sit 94–135 canvas units from the mainland and are 1.3% of Spain's projected area in total; Portugal's Azores and Madeira (14 components, 3.7%) sit 84–209 units away.
- The shared rule (`initialFit.remoteComponents`, `minGapUnits: 40`, `maxAreaShare: 0.05`) leaves exactly those out of the opening frame. The Balearics (inside Spain's own bounding box) and Sicily/Sardinia/Crete/Greek islands (small gaps) stay in.
- `ESP`'s canonical path, ISO3 identity, Outlines silhouette and adjacency are unchanged (`europe.ts` geometry differs only by Andorra's callout record; the path strings are byte-identical).
- Europe continent framing uses the same rule, deliberately: the evidence-based alternative (frame the full Atlantic extent) buys nothing for learning and costs 14% of linear scale. The excluded islands remain reachable by zoom-out/pan where the canvas includes them.

## Microstate practical access

"Exposed" is the share of a target's 44 px hit disc (sampled at four radii) that a real pointer resolves to that country. #117 paints real land above assistance, so a 44 px disc can be 44 px wide and still buried. Measured with `tests/browser/helpers/locations-audit.ts`.

| Country | Class | Polygon at 390 px | Exposed, before | Exposed, after |
|---|---|---|---|---|
| AND (Southern Europe) | D (callout) | 3.1 px | **5%** | **93%** |
| AND (Europe) | D | 2.1 px | 0% | 54% |
| SMR (Southern Europe) | D | 1.0 px | 46% | 46% |
| VAT (Southern Europe) | D | 0 px | 86% | 86% |
| MLT (Southern Europe) | C (island locator) | 2.3 px | 89% | 89% |
| LIE (Western Europe) | D | 4.4 px | 13% | 13% |
| LUX (Western Europe) | D | 15.3 px | 45% | 45% |
| MCO (Western Europe) | D | 1.2 px | 86% | 86% |

Andorra was the owner's "impossible to hit" case. Its callout target lay wholly inside Spain, and Spain's polygon (painted later) also hid the visible dot; it now sits in the Mediterranean off Catalonia with the leader line still reading as Andorra. Callout-bearing countries now also paint after the others so that a callout dot that does sit over a neighbour is no longer buried by it (visual only — callout marks stay non-hit-testable per #117).

## Open decision

San Marino, Liechtenstein and (to a lesser degree) Luxembourg are inland enclaves. An offline search of every callout position within 45 canvas units (the longest leader that stays legible) found **no position that is both geographically honest and mostly exposed**: the open water that exists is 40+ units (about 250 km) away and would point at a different coast. A callout therefore cannot give them the ~44 px practical target #228 asks for. The shared hierarchy leaves two honest options, and this is a product choice:

1. **True-scale cluster inset (#113 mechanism).** Natural pairs: San Marino + Vatican City (both Italian enclaves, 38 units apart, both scored in Southern Europe) and Liechtenstein + Luxembourg (both scored in Western Europe). The generator already derives panel size and hit radius from the 44 px contract; the cost is a new panel on screen while one of those countries is the question.
2. **Accept the buried disc and rely on the polygon** for these three, as the island-touch acceptance test comment records today. This leaves San Marino at 46% and Liechtenstein at 13% exposed.

Recommendation: option 1 for SMR+VAT and LIE+LUX. Not implemented here because it changes what appears on screen during rounds and wants an owner decision plus visual review on a device.

Monaco is 86% exposed at the Western Europe frame but only 11% at the Europe-continent frame (the 44 px disc is large against that scale); Europe continent Locations is the one scope where Monaco and Liechtenstein are effectively unreachable without zooming.

## Not yet done for #228

- Northern/Eastern Europe have no change; remote-component audit found nothing material (Iceland and the British Isles are whole, near countries). Learn/Play and three-strike behaviour for every Europe target at the 412×915 and tablet viewports has not been exercised beyond the standing framing-contract spec.
- Landscape (844×390) opening frames for Western Europe/Europe not individually reviewed visually.
- Physical-device behaviour is #71's.

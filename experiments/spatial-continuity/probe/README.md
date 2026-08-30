# Issue #119 — Stage 1 continuity probe

**Disposable.** This is not production navigation and must never become it. It exists to test
exactly one hypothesis and then be deleted or rewritten.

## The hypothesis (H1)

> Does a continuous, camera-like traversal of the existing scope hierarchy feel materially better on
> a phone than the current one-tap screen replacement?

H1 is the load-bearing half of #119. A globe that navigates badly is still bad navigation, so this
probe tests continuity **without** a globe, without a renderer, and without any generator work. If
continuity does not win here, #119 ends having spent almost nothing.

It deliberately does **not** test H2 (does a sphere add orientation value a 2D hierarchy cannot).
That question is only worth asking if H1 passes.

## How to run it on a phone

```bash
npm run probe:stage1
```

Then open, from a phone on the same network:

```
http://<your-machine-ip>:5199/experiments/spatial-continuity/probe/index.html#/
```

Production Atlas is served from the same dev server at `http://<your-machine-ip>:5199/`, so both
sides of the comparison run in one session without rebuilding.

## What it reuses from production

| Reused | Why it matters |
| --- | --- |
| `createHashRouter` + `routes.ts` | Real typed routes and real browser history — the URLs are the production ones (`#/flags/africa/west-africa/test`) |
| The generated Africa `MapRegionAsset` | Real canonical geometry, not a redrawn map |
| `getMapContinentConfig('africa')` | Real region membership; region frames are computed from rendered geometry, not a hand-authored table |
| Production stylesheets and tokens | No new palette, no region colour taxonomy |

## What it must never contain

Three.js, React Three Fiber, MapLibre, spherical geometry, a second navigation state machine,
colour-only progress encoding, or any scoring / Mastery / storage change. The camera is a plain
interpolated SVG `viewBox` driven by `requestAnimationFrame`.

## Verified behaviour

Measured on a Pixel-7-class viewport against this probe:

| Requirement | Evidence |
| --- | --- |
| Camera moves between scope levels | world `901.8` wide → Africa `726.9` → West Africa `311.7` |
| Motion is interruptible and **the route wins** | retargeting mid-flight settles at a viewBox **byte-identical** to loading that route directly |
| Deep links initialise at the target, no ancestor replay | first visible frame and settled frame are **byte-identical** |
| Reduced motion has an immediate equivalent | camera snaps within 60 ms instead of travelling |
| DOM controls and geography dispatch the same action | the traversal drives Africa by button and West Africa by tapping the map; both produce the correct route |
| Browser history unwinds naturally | `…/test` → `…/west-africa` → `…/africa` → `#/` |
| No console errors | none |

## Honest limitations

- **There is no 2D world geography in Atlas**, so the "world / domain" level is the full Africa
  canvas at its widest extent rather than a real globe. The probe therefore tests continuity between
  *scope levels*, not the value of a sphere.
- **Play is a stub.** The probe does not run a round. The point of that screen is how you arrived
  at it.
- **Africa only.** Extending it would cost more than the question is worth at this stage.
- **This is not device evidence.** Everything in the table above is Chromium at a phone viewport.
  Only a physical phone can decide H1.

# Issue #119 / #123 — MapLibre runtime spike

Disposable support-tier evidence only. This standalone Vite entry uses local GeoJSON and a local style; it does not select MapLibre for production and does not use a remote tile/style provider. The renderer is lazy-loaded so the build can measure renderer cost separately from the tiny DOM entry.

Physical-device validation is not claimed by this spike.

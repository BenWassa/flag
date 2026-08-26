import { lazy, StrictMode, Suspense, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

export type Destination = 'world' | 'africa' | 'west-africa';
const SpatialMap = lazy(() => import('./Scene'));

const metrics = {
  candidate: 'maplibre',
  mapCreates: 0,
  mapRemoves: 0,
  renderCount: 0,
  contextLost: 0,
  contextRestored: 0,
  errors: [] as string[],
  canvasPointerDowns: [] as Array<{ x: number; y: number; pointerType: string }>,
  cameraCommands: [] as Array<{ destination: Destination; at: number }>,
  cameraCompletions: [] as Array<{ destination: Destination; at: number }>,
  lastCamera: null as any,
  projection: null as any,
  destinations: ['world'] as Destination[],
};
Object.assign(window, { __spatialMapLibre: metrics });

function fromHash(): Destination {
  if (location.hash.includes('west-africa')) return 'west-africa';
  if (location.hash.includes('africa')) return 'africa';
  return 'world';
}
function hashFor(d: Destination) { return d === 'west-africa' ? '#/flags/africa/west-africa' : d === 'africa' ? '#/flags/africa' : '#/flags'; }

function App() {
  const [loaded, setLoaded] = useState(false);
  const [destination, setDestination] = useState<Destination>(fromHash);
  const applyLocation = useCallback(() => { const next = fromHash(); setDestination(next); metrics.destinations.push(next); }, []);
  const navigate = useCallback((next: Destination) => {
    history.pushState({ destination: next }, '', hashFor(next));
    setDestination(next); metrics.destinations.push(next);
  }, []);
  useEffect(() => {
    if (!history.state?.destination) history.replaceState({ destination }, '', hashFor(destination));
    addEventListener('popstate', applyLocation); return () => removeEventListener('popstate', applyLocation);
  }, [applyLocation, destination]);
  useEffect(() => {
    Object.assign(window, { __spatialMapLibreActions: { navigate, back: () => history.back(), destination: () => destination } });
  }, [destination, navigate]);

  return <main style={{ fontFamily: 'system-ui, sans-serif', background: '#f6f8fb', color: '#101318', minHeight: '100vh', padding: 16 }}>
    <h1 style={{ fontSize: 18, margin: '0 0 8px' }}>Issue #119 MapLibre runtime spike</h1>
    <p data-testid="destination" style={{ margin: '0 0 12px' }}>{destination}</p>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
      <button data-testid="load" onClick={() => setLoaded(true)}>Load renderer</button>
      <button data-dest="world" onClick={() => navigate('world')}>World</button>
      <button data-dest="africa" onClick={() => navigate('africa')}>Africa</button>
      <button data-dest="west-africa" onClick={() => navigate('west-africa')}>West Africa</button>
      <button data-testid="back" onClick={() => history.back()}>Back</button>
    </div>
    <div data-testid="scene-shell" style={{ height: 560, maxHeight: '72vh', border: '1px solid #cbd2dc', borderRadius: 12, overflow: 'hidden', background: '#eef3f8' }}>
      {loaded ? <Suspense fallback={<div>Loading renderer…</div>}><SpatialMap destination={destination} onNavigate={navigate} /></Suspense> : <button style={{ margin: 24 }} onClick={() => setLoaded(true)}>Start spatial spike</button>}
    </div>
  </main>;
}
const root = document.querySelector('#app');
if (!(root instanceof HTMLDivElement)) throw new Error('Spike root not found.');
createRoot(root).render(<StrictMode><App /></StrictMode>);

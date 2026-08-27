import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Destination } from './main';

const CAMERA: Record<Destination, { center: [number, number]; zoom: number }> = {
  world: { center: [10, 5], zoom: 0.6 },
  africa: { center: [20, 0], zoom: 2.2 },
  'west-africa': { center: [-3, 10], zoom: 3.6 },
};

const geojson: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { scope: 'africa' }, geometry: { type: 'Polygon', coordinates: [[[-20,-35],[55,-35],[55,38],[-20,38],[-20,-35]]] } },
    { type: 'Feature', properties: { scope: 'west-africa' }, geometry: { type: 'Polygon', coordinates: [[[-18,4],[15,4],[15,20],[-18,20],[-18,4]]] } },
  ],
};

function metric(): any { return (window as any).__spatialMapLibre; }

export default function SpatialMap({ destination, onNavigate, onFailure }: {
  destination: Destination;
  onNavigate: (d: Destination) => void;
  onFailure: (reason: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const destinationRef = useRef(destination);
  destinationRef.current = destination;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const m = metric();
    const map = new maplibregl.Map({
      container: containerRef.current,
      attributionControl: false,
      center: CAMERA.world.center,
      zoom: CAMERA.world.zoom,
      style: {
        version: 8,
        projection: { type: 'globe' },
        sources: { local: { type: 'geojson', data: geojson } },
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#eef3f8' } },
          { id: 'areas', type: 'fill', source: 'local', paint: { 'fill-color': '#d8e0e8', 'fill-outline-color': '#7b8794', 'fill-opacity': 0.92 } },
        ],
      } as any,
    });
    mapRef.current = map;
    m.mapCreates += 1;
    // Expose the instance immediately. `load` is an event, not a reliable
    // synchronisation point for an external harness (and StrictMode can remove
    // the first instance before its event runs).
    (window as any).__spatialMapLibreMap = map;
    (window as any).__spatialMapLibreProject = (lng: number, lat: number) => map.project([lng, lat]);
    map.doubleClickZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    const anchor = document.createElement('span');
    anchor.dataset.testid = 'west-africa-anchor';
    anchor.textContent = 'West Africa';
    anchor.style.cssText = 'font: 600 12px system-ui; color: #101318; background: #f6f8fb; padding: 3px 5px; border: 1px solid #7b8794; border-radius: 4px; white-space: nowrap;';
    const marker = new maplibregl.Marker({ element: anchor, anchor: 'bottom' }).setLngLat([-3, 10]).addTo(map);
    m.domAnchor = { lng: -3, lat: 10, created: true };

    map.on('style.load', () => {
      m.styleLoads += 1;
      m.projection = map.getProjection();
      const canvas = map.getCanvas();
      canvas.addEventListener('webglcontextlost', () => {
        m.contextLost += 1;
        onFailure('WebGL context lost');
      });
      canvas.addEventListener('webglcontextrestored', () => { m.contextRestored += 1; });
      canvas.addEventListener('pointerdown', (event: PointerEvent) => m.canvasPointerDowns.push({ x: event.clientX, y: event.clientY, pointerType: event.pointerType }));
    });
    map.on('render', () => {
      m.renderCount += 1;
      m.ready = true;
      m.mapLoadedOnFirstRender ??= map.loaded();
      m.styleLoadedOnFirstRender ??= map.isStyleLoaded();
      const c = map.getCenter();
      m.lastCamera = { lng: c.lng, lat: c.lat, zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() };
      m.projection = map.getProjection();
    });
    map.on('error', (event: any) => {
      const message = String(event.error?.message ?? event.error ?? 'unknown map error');
      m.errors.push(message);
      onFailure(message);
    });
    map.on('click', 'areas', (event: any) => {
      const desired = destinationRef.current === 'world' ? 'africa' : destinationRef.current === 'africa' ? 'west-africa' : null;
      if (!desired) return;
      if (event.features?.some((feature: any) => feature.properties?.scope === desired)) onNavigate(desired);
    });

    return () => {
      mapRef.current = null;
      m.mapRemoves += 1;
      marker.remove();
      map.remove();
    };
  }, [onFailure, onNavigate]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const target = CAMERA[destination];
    metric().cameraCommands.push({ destination, at: performance.now() });
    map.easeTo({ center: target.center, zoom: target.zoom, duration: 700, essential: true });
    const complete = () => {
      metric().cameraCompletions.push({ destination, at: performance.now() });
      map.off('moveend', complete);
    };
    map.on('moveend', complete);
    return () => {
      map.off('moveend', complete);
    };
  }, [destination]);

  return <div ref={containerRef} data-testid="maplibre-container" style={{ width: '100%', height: '100%' }} />;
}

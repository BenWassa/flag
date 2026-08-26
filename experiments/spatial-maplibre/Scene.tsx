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

export default function SpatialMap({ destination, onNavigate }: { destination: Destination; onNavigate: (d: Destination) => void }) {
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
        sources: { local: { type: 'geojson', data: geojson } },
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#eef3f8' } },
          { id: 'areas', type: 'fill', source: 'local', paint: { 'fill-color': '#d8e0e8', 'fill-outline-color': '#7b8794', 'fill-opacity': 0.92 } },
        ],
      } as any,
    });
    mapRef.current = map;
    m.mapCreates += 1;
    map.doubleClickZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    map.on('load', () => {
      map.setProjection({ type: 'globe' } as any);
      m.projection = map.getProjection();
      const canvas = map.getCanvas();
      canvas.addEventListener('webglcontextlost', () => { m.contextLost += 1; });
      canvas.addEventListener('webglcontextrestored', () => { m.contextRestored += 1; });
      canvas.addEventListener('pointerdown', (event: PointerEvent) => m.canvasPointerDowns.push({ x: event.clientX, y: event.clientY, pointerType: event.pointerType }));
      (window as any).__spatialMapLibreMap = map;
      (window as any).__spatialMapLibreProject = (lng: number, lat: number) => map.project([lng, lat]);
    });
    map.on('render', () => {
      m.renderCount += 1;
      const c = map.getCenter();
      m.lastCamera = { lng: c.lng, lat: c.lat, zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() };
      m.projection = map.getProjection();
    });
    map.on('error', (event: any) => m.errors.push(String(event.error?.message ?? event.error ?? 'unknown map error')));
    map.on('click', 'areas', (event: any) => {
      const desired = destinationRef.current === 'world' ? 'africa' : destinationRef.current === 'africa' ? 'west-africa' : null;
      if (!desired) return;
      if (event.features?.some((feature: any) => feature.properties?.scope === desired)) onNavigate(desired);
    });

    return () => {
      mapRef.current = null;
      m.mapRemoves += 1;
      map.remove();
    };
  }, [onNavigate]);

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
    return () => map.off('moveend', complete);
  }, [destination]);

  return <div ref={containerRef} data-testid="maplibre-container" style={{ width: '100%', height: '100%' }} />;
}

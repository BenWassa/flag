import type { OutlineGeometry } from '../../domain/outline.js';

export function OutlineSilhouette({ geometry, className = '' }: { geometry: OutlineGeometry; className?: string }) {
  return <div className={`outline-frame ${className}`}><svg className="outline-svg" viewBox="0 0 100 100" role="img" aria-label="Country silhouette to identify" focusable="false" preserveAspectRatio="xMidYMid meet"><path d={geometry.path} /></svg></div>;
}

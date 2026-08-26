import { useCallback, useState } from 'react';
import type { Country } from '../../domain/models.js';
import { flagUrl } from '../../infrastructure/flags.js';

// Flags differ in aspect ratio, and the question stage has to keep one geometry
// across all of them (#90). CSS cannot read an image's ratio, so the loaded
// ratio is published as a custom property and the frame sizes itself from it —
// the flag box changes, the stage around it does not. Before the ratio is known
// the frame falls back to the common 3:2, so nothing shifts on load either.
function ratioOf(image: HTMLImageElement | null): number | null {
  if (!image || !image.naturalWidth || !image.naturalHeight) return null;
  return image.naturalWidth / image.naturalHeight;
}

export function FlagImage({
  country,
  revealed = false,
  frameClass = '',
  priority = false,
}: {
  country: Country;
  revealed?: boolean;
  frameClass?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [ratio, setRatio] = useState<number | null>(null);

  // A cached image can already be complete before React attaches onLoad, so the
  // ratio is read on mount as well as on load.
  const measure = useCallback((image: HTMLImageElement | null) => {
    const measured = ratioOf(image);
    if (measured !== null) setRatio(measured);
  }, []);

  return (
    <span
      className={`flag-frame ${frameClass}${failed ? ' flag-frame--failed' : ''}`}
      style={ratio === null ? undefined : ({ '--flag-ratio': ratio } as React.CSSProperties)}
    >
      <img
        className="flag-image"
        ref={measure}
        src={flagUrl(country.iso2)}
        alt={revealed ? `${country.name} flag` : 'Flag to identify'}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={(event) => measure(event.currentTarget)}
        onError={() => setFailed(true)}
      />
      <span className="flag-fallback">
        {priority ? 'Flag image unavailable' : <><span aria-hidden="true">—</span><span className="visually-hidden">Flag image unavailable</span></>}
      </span>
    </span>
  );
}

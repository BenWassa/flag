import { useState } from 'react';
import type { Country } from '../../domain/models.js';
import { flagUrl } from '../../infrastructure/flags.js';

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
  return (
    <span className={`flag-frame ${frameClass}${failed ? ' flag-frame--failed' : ''}`}>
      <img
        className="flag-image"
        src={flagUrl(country.iso2)}
        alt={revealed ? `${country.name} flag` : 'Flag to identify'}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onError={() => setFailed(true)}
      />
      <span className="flag-fallback">
        {priority ? 'Flag image unavailable' : <><span aria-hidden="true">—</span><span className="visually-hidden">Flag image unavailable</span></>}
      </span>
    </span>
  );
}

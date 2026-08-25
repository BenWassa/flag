import type { SVGProps } from 'react';
import type { LearningDomain } from '../../domain/models.js';
import { ICON_PATHS, type IconName } from '../../ui/components/icons.js';
import { CONTINENT_PATHS } from '../../ui/components/continent-icons.js';

export function Icon({ name, className = '', ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      className={`ui-icon ${className}`.trim()}
      viewBox="0 0 256 256"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }}
      {...props}
    />
  );
}

export function DomainIcon({ domain }: { domain: LearningDomain }) {
  const name: IconName = domain === 'flags'
    ? 'flag'
    : domain === 'locations'
      ? 'location'
      : domain === 'outlines'
        ? 'outline'
        : 'adjacency';
  return <Icon name={name} />;
}

export function ContinentIcon({ id }: { id: string }) {
  const path = CONTINENT_PATHS[id];
  if (!path) return null;
  return (
    <svg className="continent-icon" data-continent={id} viewBox="0 0 48 48" aria-hidden="true" focusable="false" fill="currentColor">
      <path d={path} />
    </svg>
  );
}

import type { StudyScope } from '../domain/models.js';

export const MAP_PILOT_SCOPE: StudyScope = {
  kind: 'region',
  id: 'west-africa',
  label: 'West Africa',
};

export const WEST_AFRICA_MAP_COUNTRY_IDS = [
  'BEN', 'BFA', 'CPV', 'CIV', 'GMB', 'GHA', 'GIN', 'GNB',
  'LBR', 'MLI', 'MRT', 'NER', 'NGA', 'SEN', 'SLE', 'TGO',
] as const;

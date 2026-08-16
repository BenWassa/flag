import type { Continent, Region } from '../domain/models.js';

export const CONTINENTS: Continent[] = [
  { id: 'africa', name: 'Africa' },
  { id: 'asia', name: 'Asia' },
  { id: 'europe', name: 'Europe' },
  { id: 'north-america', name: 'North America' },
  { id: 'south-america', name: 'South America' },
  { id: 'oceania', name: 'Oceania' },
];

export const REGIONS: Region[] = [
  { id: 'north-africa', continentId: 'africa', name: 'North Africa' },
  { id: 'west-africa', continentId: 'africa', name: 'West Africa' },
  { id: 'central-africa', continentId: 'africa', name: 'Central Africa' },
  { id: 'east-africa', continentId: 'africa', name: 'East Africa' },
  { id: 'southern-africa', continentId: 'africa', name: 'Southern Africa' },

  { id: 'central-asia', continentId: 'asia', name: 'Central Asia' },
  { id: 'east-asia', continentId: 'asia', name: 'East Asia' },
  { id: 'southeast-asia', continentId: 'asia', name: 'Southeast Asia' },
  { id: 'south-asia', continentId: 'asia', name: 'South Asia' },
  { id: 'west-asia', continentId: 'asia', name: 'West Asia' },

  { id: 'northern-europe', continentId: 'europe', name: 'Northern Europe' },
  { id: 'western-europe', continentId: 'europe', name: 'Western Europe' },
  { id: 'eastern-europe', continentId: 'europe', name: 'Eastern Europe' },
  { id: 'southern-europe', continentId: 'europe', name: 'Southern Europe' },

  { id: 'northern-america', continentId: 'north-america', name: 'Northern America' },
  { id: 'central-america', continentId: 'north-america', name: 'Central America' },
  { id: 'caribbean', continentId: 'north-america', name: 'Caribbean' },

  { id: 'andean', continentId: 'south-america', name: 'Andean' },
  { id: 'atlantic-south-america', continentId: 'south-america', name: 'Atlantic' },
  { id: 'southern-cone', continentId: 'south-america', name: 'Southern Cone' },

  { id: 'australia-new-zealand', continentId: 'oceania', name: 'Australia & New Zealand' },
  { id: 'melanesia', continentId: 'oceania', name: 'Melanesia' },
  { id: 'micronesia', continentId: 'oceania', name: 'Micronesia' },
  { id: 'polynesia', continentId: 'oceania', name: 'Polynesia' },
];

#!/usr/bin/env node
import { MAP_GENERATION_CONFIGS } from './map-continent-configs.mjs';
import { generateConfiguredMaps } from './map-generation-core.mjs';

await generateConfiguredMaps(MAP_GENERATION_CONFIGS, process.argv.slice(2));

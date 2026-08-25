import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './map-viewport.js';
import './neighbor-map-runtime.js';
import { AtlasApp } from './react/AtlasApp.js';
import { AppErrorBoundary } from './react/components/AppErrorBoundary.js';

const root = document.querySelector('#app');
if (!(root instanceof HTMLDivElement)) throw new Error('App root not found.');

createRoot(root).render(<StrictMode><AppErrorBoundary><AtlasApp /></AppErrorBoundary></StrictMode>);

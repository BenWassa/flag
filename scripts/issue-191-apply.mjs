import { readFile, writeFile } from 'node:fs/promises';

const path = 'src/react/AtlasApp.tsx';
let source = await readFile(path, 'utf8');

function replaceOnce(before, after, label) {
  if (source.includes(after)) return;
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`Missing expected ${label}.`);
  if (source.indexOf(before, index + before.length) >= 0) throw new Error(`Expected one ${label}.`);
  source = source.slice(0, index) + after + source.slice(index + before.length);
}

replaceOnce(
  "import { dismissInstallPrompt, isInstallPromptDismissed } from '../infrastructure/install-prompt-storage.js';\n",
  "import { dismissInstallPrompt, isInstallPromptDismissed } from '../infrastructure/install-prompt-storage.js';\nimport { installPwaUpdateLifecycle, signalPwaUpdateSafetyChange } from '../infrastructure/pwa-update.js';\n",
  'PWA update import seam',
);

replaceOnce(
  "    rounds.neighbors.resetQuery();\n  }, [rounds, store]);",
  "    rounds.neighbors.resetQuery();\n    signalPwaUpdateSafetyChange();\n  }, [rounds, store]);",
  'round discard safety signal',
);

replaceOnce(
  "    try { await launch(); } finally { if (element?.isConnected) { element.removeAttribute('aria-busy'); element.classList.remove('is-launching'); } }\n",
  "    try { await launch(); } finally {\n      if (element?.isConnected) { element.removeAttribute('aria-busy'); element.classList.remove('is-launching'); }\n      signalPwaUpdateSafetyChange();\n    }\n",
  'round launch completion safety signal',
);

replaceOnce(
  "    const register = () => { if ('serviceWorker' in navigator) void navigator.serviceWorker.register('./sw.js').catch(() => undefined); };\n    window.addEventListener('load', register);\n    if (document.readyState === 'complete') register();\n    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('keydown', keyboard); window.removeEventListener('load', register); removeGestures(); };",
  "    const pwaUpdates = installPwaUpdateLifecycle({\n      // active-round.ts is the process-wide authority across all four learning\n      // domains. Pending geometry launch and IME/editing safety are layered in\n      // the coordinator itself.\n      isApplicationSafe: () => getActiveRoundRoute() === null,\n    });\n    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('keydown', keyboard); pwaUpdates.dispose(); removeGestures(); };",
  'service-worker registration lifecycle',
);

await writeFile(path, source);

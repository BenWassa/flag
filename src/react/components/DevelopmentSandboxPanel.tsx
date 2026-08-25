import { useState } from 'react';
import {
  applyDevelopmentSandboxBundle,
  createDevelopmentSandboxPreset,
  exportDevelopmentSandbox,
  parseDevelopmentSandboxImport,
  resetDevelopmentSandbox,
  type DevelopmentSandboxPreset,
} from '../../infrastructure/development-sandbox.js';
import { DEVELOPMENT_SANDBOX_NAMESPACE } from '../../infrastructure/persistence-keys.js';

const PRESETS: readonly { id: DevelopmentSandboxPreset; label: string }[] = [
  { id: 'clean', label: 'Clean state' },
  { id: 'partial-evidence', label: 'Partial evidence' },
  { id: 'review-due', label: 'Review due' },
  { id: 'one-perfect-round', label: 'One perfect round' },
  { id: 'regional-mastery', label: 'Regional mastery' },
  { id: 'complete-region', label: 'Complete region' },
  { id: 'complete-continent', label: 'Complete continent' },
  { id: 'world-crown', label: 'World Crown' },
];

function reload(): void {
  window.location.reload();
}

export default function DevelopmentSandboxPanel() {
  const [source, setSource] = useState('');
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (preset: DevelopmentSandboxPreset) => {
    if (!window.confirm(`Replace all sandbox learner data with “${PRESETS.find((item) => item.id === preset)?.label}”?`)) return;
    applyDevelopmentSandboxBundle(createDevelopmentSandboxPreset(preset));
    reload();
  };

  const exportData = () => {
    setError(null);
    try {
      setSource(JSON.stringify(exportDevelopmentSandbox(), null, 2));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The sandbox could not be exported.');
    }
  };

  const importData = () => {
    setError(null);
    try {
      const bundle = parseDevelopmentSandboxImport(source);
      if (!window.confirm('Replace all sandbox learner data with this import?')) return;
      applyDevelopmentSandboxBundle(bundle);
      reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The sandbox bundle could not be imported.');
    }
  };

  const reset = () => {
    if (!window.confirm('Remove all development sandbox learner data? Production data will not be touched.')) return;
    resetDevelopmentSandbox();
    reload();
  };

  return (
    <section className="dev-sandbox" aria-labelledby="dev-sandbox-title">
      <div className="dev-sandbox__heading">
        <div>
          <p className="atlas-eyebrow">Development only</p>
          <h2 id="dev-sandbox-title">Development sandbox</h2>
        </div>
        <span className="dev-sandbox__status">Firebase off</span>
      </div>
      <p>Progress is isolated from production and persists only under <code>{DEVELOPMENT_SANDBOX_NAMESPACE}:*</code>.</p>

      <h3>Seed an edge case</h3>
      <div className="dev-sandbox__presets">
        {PRESETS.map((preset) => <button className="button button--secondary" type="button" key={preset.id} onClick={() => applyPreset(preset.id)}>{preset.label}</button>)}
      </div>

      <h3>Import or export</h3>
      <label className="dev-sandbox__label" htmlFor="dev-sandbox-json">Complete sandbox JSON</label>
      <textarea id="dev-sandbox-json" value={source} onChange={(event) => setSource(event.target.value)} spellCheck={false} rows={9} />
      {error ? <p className="storage-notice" role="alert">{error}</p> : null}
      <div className="dev-sandbox__actions">
        <button className="button button--secondary" type="button" onClick={exportData}>Export to editor</button>
        <button className="button button--primary" type="button" onClick={importData} disabled={!source.trim()}>Import and reload</button>
      </div>

      <button className="button button--danger dev-sandbox__reset" type="button" onClick={reset}>Reset sandbox</button>
    </section>
  );
}

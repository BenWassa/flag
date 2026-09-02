from pathlib import Path
import json


def required_replace(text: str, old: str, new: str, label: str, count: int | None = None) -> str:
    found = text.count(old)
    if found == 0:
        raise SystemExit(f"Missing expected {label}")
    if count is not None and found != count:
        raise SystemExit(f"Expected {count} {label}, found {found}")
    return text.replace(old, new)


theme = Path('src/styles/atlas-theme.css')
text = theme.read_text()
marker = '  --radius-hero: 24px;\n'
tokens = '''  --radius-hero: 24px;
  /* Small semantic geometry/motion scale. Camera travel and reading dwells stay
     in their owning state modules rather than becoming generic CSS motion. */
  --control-height-compact: 44px;
  --control-height-standard: 52px;
  --motion-press: 100ms;
  --motion-ui: 160ms;
  --motion-feedback-emphasis: 520ms;
  --ease-press: ease-out;
  --ease-ui: ease-out;
  --ease-feedback: ease-out;
'''
text = required_replace(text, marker, tokens, 'atlas-theme token insertion point', 1)
text = required_replace(text, '  min-height: 52px;\n  border-radius: var(--radius-md);', '  min-height: var(--control-height-standard);\n  border-radius: var(--radius-md);', 'shared standard button height', 1)
text = required_replace(text, 'transition: background-color 120ms ease, border-color 120ms ease, box-shadow 100ms ease, transform 100ms ease;', 'transition: background-color var(--motion-ui) var(--ease-ui), border-color var(--motion-ui) var(--ease-ui), box-shadow var(--motion-press) var(--ease-press), transform var(--motion-press) var(--ease-press);', 'primary-button transition')
text = required_replace(text, 'transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 90ms ease, transform 90ms ease;', 'transition: background-color var(--motion-ui) var(--ease-ui), border-color var(--motion-ui) var(--ease-ui), color var(--motion-ui) var(--ease-ui), box-shadow var(--motion-press) var(--ease-press), transform var(--motion-press) var(--ease-press);', 'answer-button transition', 1)
text = required_replace(text, '.round-score__value { transition: color 120ms ease; }', '.round-score__value { transition: color var(--motion-ui) var(--ease-ui); }', 'score transition', 1)
text = required_replace(text, 'transition: background-color 140ms ease, color 140ms ease;', 'transition: background-color var(--motion-ui) var(--ease-ui), color var(--motion-ui) var(--ease-ui);', 'dismiss transition')
theme.write_text(text)

styles = Path('src/styles/styles.css')
text = styles.read_text()
text = required_replace(text, 'min-width: 44px;\n  min-height: 44px;', 'min-width: var(--control-height-compact);\n  min-height: var(--control-height-compact);', 'shared compact dimensions')
text = required_replace(text, 'width: 44px;\n  height: 44px;', 'width: var(--control-height-compact);\n  height: var(--control-height-compact);', 'icon-button dimensions', 1)
text = required_replace(text, 'transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 120ms ease;', 'transition: background-color var(--motion-ui) var(--ease-ui), border-color var(--motion-ui) var(--ease-ui), color var(--motion-ui) var(--ease-ui), transform var(--motion-press) var(--ease-press);', 'shared control transition')
text = required_replace(text, 'transition: background-color 160ms ease, color 160ms ease;', 'transition: background-color var(--motion-ui) var(--ease-ui), color var(--motion-ui) var(--ease-ui);', 'shared row transition')
text = required_replace(text, 'transition: border-color 160ms ease, background-color 160ms ease;', 'transition: border-color var(--motion-ui) var(--ease-ui), background-color var(--motion-ui) var(--ease-ui);', 'flag-card transition', 1)
styles.write_text(text)

spatial = Path('src/styles/spatial.css')
text = spatial.read_text()
text = required_replace(text, 'transition: opacity 160ms ease;', 'transition: opacity var(--motion-ui) var(--ease-ui);', 'Spatial first-paint transition', 1)
text = required_replace(text, '  min-height: 34px;\n  padding: 6px 12px;', '  min-height: var(--control-height-compact);\n  padding: 6px 12px;', 'Spatial chip height', 1)
text = required_replace(text, '  cursor: pointer;\n}\n\n.spatial-chip:disabled', '  cursor: pointer;\n  transition: background-color var(--motion-ui) var(--ease-ui), border-color var(--motion-ui) var(--ease-ui), color var(--motion-ui) var(--ease-ui);\n}\n\n.spatial-chip:disabled', 'Spatial chip transition', 1)
text = required_replace(text, '  min-height: 46px;\n  padding: 8px var(--space-3);', '  min-height: var(--control-height-standard);\n  padding: 8px var(--space-3);', 'Spatial mode height', 1)
text = required_replace(text, '  text-align: start;\n  cursor: pointer;\n}\n\n.spatial-mode__mark', '  text-align: start;\n  cursor: pointer;\n  transition: background-color var(--motion-ui) var(--ease-ui), border-color var(--motion-ui) var(--ease-ui), color var(--motion-ui) var(--ease-ui);\n}\n\n.spatial-mode__mark', 'Spatial mode transition', 1)
spatial.write_text(text)

neighbors = Path('src/styles/neighbors.css')
text = neighbors.read_text()
text = required_replace(text, '.neighbor-none { min-height: 44px;', '.neighbor-none { min-height: var(--control-height-compact);', 'Neighbours compact control', 1)
text = required_replace(text, '  min-height: 50px;\n  border: 1px solid var(--line-strong);', '  min-height: var(--control-height-standard);\n  border: 1px solid var(--line-strong);', 'Neighbours input height', 1)
text = required_replace(text, '  min-height: 50px;\n  padding: 9px var(--space-3);', '  min-height: var(--control-height-standard);\n  padding: 9px var(--space-3);', 'Neighbours suggestion height', 1)
text = required_replace(text, '.neighbor-input-row .button { min-height: 50px;', '.neighbor-input-row .button { min-height: var(--control-height-standard);', 'Neighbours submit height')
neighbors.write_text(text)

map_css = Path('src/styles/map.css')
text = map_css.read_text()
text = required_replace(text, 'animation: map-wrong 520ms ease-out both;', 'animation: map-wrong var(--motion-feedback-emphasis) var(--ease-feedback) both;', 'Locations wrong-pulse token', 1)
text = required_replace(text, 'animation: map-wrong-line 520ms ease-out both;', 'animation: map-wrong-line var(--motion-feedback-emphasis) var(--ease-feedback) both;', 'Locations wrong-line token', 1)
map_css.write_text(text)

design = Path('DESIGN.md')
text = design.read_text()
anchor = 'Reduced motion must preserve semantic correctness and usability; animation may decorate state but may never be the mechanism that restores or determines state.\n'
section = '''Reduced motion must preserve semantic correctness and usability; animation may decorate state but may never be the mechanism that restores or determines state.

## Motion and control geometry

Keep this scale deliberately small:

- compact controls use a `44px` minimum height for icon buttons and quiet lateral choices;
- standard controls use a `52px` minimum height for primary actions, answer controls and text-entry actions;
- press response uses `--motion-press: 100ms` with `--ease-press: ease-out`;
- ordinary colour, border and opacity changes use `--motion-ui: 160ms` with `--ease-ui: ease-out`;
- `--motion-feedback-emphasis: 520ms` / `--ease-feedback: ease-out` is the accepted Locations transient wrong-answer emphasis from #148, not a universal feedback duration.

The shared Play reading dwells remain `620ms` correct / `1500ms` wrong in `src/state/play-feedback-timing.ts`; they are application-state timing rather than CSS motion. Globe/camera travel remains owned by the spatial camera director. Do not force either onto the generic UI tokens.
'''
text = required_replace(text, anchor, section, 'DESIGN motion section anchor', 1)
design.write_text(text)

data_path = Path('.impeccable/design.json')
data = json.loads(data_path.read_text())
data['tokens']['controlHeight'] = {'compact': '44px', 'standard': '52px'}
data['tokens']['motion'] = {
    'press': '100ms ease-out',
    'ui': '160ms ease-out',
    'feedbackEmphasis': '520ms ease-out (Locations transient wrong-answer emphasis only)',
}
data_path.write_text(json.dumps(data, indent=2) + '\n')

package = Path('package.json')
text = package.read_text()
text = required_replace(text, '&& node scripts/verify-action-feedback.mjs && node scripts/verify-spatial-atlas.mjs', '&& node scripts/verify-action-feedback.mjs && node scripts/verify-design-tokens.mjs && node scripts/verify-spatial-atlas.mjs', 'package verify hook', 1)
package.write_text(text)

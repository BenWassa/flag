from __future__ import annotations

import json
import re
from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    Path(path).write_text(text, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one exact match, found {count}: {old[:80]!r}")
    write(path, text.replace(old, new, 1))


def sub_once(path: str, pattern: str, replacement: str, *, flags: int = 0) -> None:
    text = read(path)
    updated, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f"{path}: expected one regex match, found {count}: {pattern[:100]!r}")
    write(path, updated)


# ---------------------------------------------------------------------------
# Canonical navigation styling: full-width post-mode selection, no split Play.
# ---------------------------------------------------------------------------
continent_css = r'''.page--tile-index .continent-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.page--tile-index .continent-row {
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
  border: 1px solid var(--line);
  border-radius: var(--radius-tile);
  background: var(--surface);
  box-shadow: var(--depth-tile);
  overflow: hidden;
  transition: border-color 140ms ease, box-shadow 140ms ease, transform 100ms ease;
}

.page--tile-index .continent-row:hover {
  border-color: var(--line-strong);
  box-shadow: var(--depth-tile-hover);
}

.page--tile-index .continent-row:active { transform: translateY(1px); }

.page--tile-index .continent-row__open {
  width: 100%;
  min-height: 112px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 82px 20px;
  grid-template-rows: auto auto auto;
  align-items: center;
  gap: 7px 14px;
  padding: 15px 15px 14px 17px;
}

.page--tile-index .continent-row__identity {
  align-self: end;
  grid-column: 1;
  grid-row: 1;
  gap: 3px;
}

.page--tile-index .continent-row__identity strong {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -.03em;
}

.page--tile-index .continent-row__identity small {
  font-size: 12px;
  line-height: 1.35;
}

.page--tile-index .continent-row__mark {
  align-self: center;
  justify-self: center;
  grid-column: 2;
  grid-row: 1 / 4;
  display: grid;
  place-items: center;
  min-height: 0;
  color: var(--line-strong);
  pointer-events: none;
}

.page--tile-index .continent-row__mark .continent-icon {
  width: 70px;
  height: 70px;
  max-height: 100%;
}

.page--tile-index .continent-row__evidence {
  grid-column: 1;
  grid-row: 2;
  min-width: 0;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 650;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.page--tile-index .continent-row__progress {
  align-self: end;
  grid-column: 1;
  grid-row: 3;
  width: 100%;
}

.page--tile-index .continent-row__progress .status-strip {
  height: 7px;
  border-radius: 999px;
}

.page--tile-index .continent-row__open > .ui-icon {
  display: block;
  grid-column: 3;
  grid-row: 1 / 4;
  align-self: center;
  justify-self: end;
}

/* Unsupported curriculum remains honest and inert, but it follows the same
   full-width vertical rhythm as shipped continents rather than reverting to a
   compact tile grid. */
.page--tile-index .continent-row--shell {
  align-self: stretch;
  grid-template-columns: minmax(0, 1fr);
  border-style: dashed;
  box-shadow: none;
  background: transparent;
}

.page--tile-index .continent-row--shell .continent-row__open {
  min-height: 62px;
  grid-template-rows: auto;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  padding: 11px 14px 11px 17px;
  cursor: default;
}

.page--tile-index .continent-row--shell .continent-row__identity strong {
  font-size: 15px;
  color: var(--text-muted);
}

.page--tile-index .continent-row--shell .continent-row__mark {
  grid-column: 2;
  grid-row: 1;
  color: var(--line-strong);
}

.page--tile-index .continent-row--shell .continent-row__mark .continent-icon {
  width: 30px;
  height: 30px;
}

.page--tile-index .continent-row--shell:hover {
  border-color: var(--line);
  box-shadow: none;
}

.page--tile-index .continent-row--shell:active { transform: none; }

.region-list {'''
sub_once(
    "src/styles/atlas-theme.css",
    r"\.page--tile-index \.continent-list \{.*?\n\n\.region-list \{",
    continent_css,
    flags=re.S,
)

region_css = r'''.region-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.region-row {
  grid-template-columns: minmax(0, 1fr);
  border: 1px solid var(--line);
  border-radius: var(--radius-tile);
  background: var(--surface);
  overflow: hidden;
  box-shadow: var(--depth-tile);
  transition: border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .region-row:hover {
    border-color: var(--line-strong);
    box-shadow: var(--depth-tile-hover);
  }
}

.region-row--selected {
  border-color: color-mix(in srgb, var(--action) 44%, var(--line));
  background: var(--action-soft);
  box-shadow: inset 3px 0 0 var(--action), var(--depth-tile);
}

.region-row__open {
  width: 100%;
  min-height: 92px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 20px;
  grid-template-rows: auto auto auto;
  align-items: center;
  gap: 6px 10px;
  padding: 13px 14px 12px 16px;
}

.region-row__identity {
  grid-column: 1;
  grid-row: 1;
}

.region-row__identity strong {
  font-size: 16px;
  font-weight: 780;
  letter-spacing: -.02em;
}

.region-row__status {
  grid-column: 2;
  grid-row: 1;
  color: var(--action);
  font-size: 12px;
  font-weight: 760;
}

.region-row__evidence {
  grid-column: 1 / 3;
  grid-row: 2;
  min-width: 0;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 650;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.region-row__progress {
  grid-column: 1 / -1;
  grid-row: 3;
  min-width: 0;
}

.region-row__progress .status-strip {
  height: 7px;
  border-radius: 999px;
}

.region-row__open > .ui-icon {
  grid-column: 3;
  grid-row: 1;
  align-self: center;
  justify-self: end;
}

.page--launcher .topbar'''
sub_once(
    "src/styles/atlas-theme.css",
    r"\.region-list \{.*?\n\n\.page--launcher \.topbar",
    region_css,
    flags=re.S,
)

# Remove dead reduced-motion and launch-feedback selectors left by split-row Play.
atlas = read("src/styles/atlas-theme.css")
atlas = atlas.replace("  .region-row__play:active,\n  .page--tile-index .continent-row__play:active {\n", "  .region-row__open:active,\n  .page--tile-index .continent-row__open:active {\n")
atlas = re.sub(
    r"\n\.continent-row__play\.is-launching,\n\.region-row__play\.is-launching,\n\.button\.is-launching \{",
    "\n.button.is-launching {",
    atlas,
    count=1,
)
atlas = re.sub(
    r"\n\.continent-row__play\.is-launching,\n\.region-row__play\.is-launching \{\n  animation: launch-pulse 900ms ease-in-out infinite;\n\}\n",
    "\n",
    atlas,
    count=1,
)
atlas = re.sub(r"\n@keyframes launch-pulse \{.*?\n\}\n", "\n", atlas, count=1, flags=re.S)
atlas = atlas.replace(
    "  .continent-row__play.is-launching,\n  .region-row__play.is-launching { animation: none; opacity: .7; }\n",
    "",
)
write("src/styles/atlas-theme.css", atlas)

# The base structural sheet should no longer describe a split trailing Play cell.
styles = read("src/styles/styles.css")
styles = styles.replace(
    "  grid-template-columns: minmax(0, 1fr) 52px;\n",
    "  grid-template-columns: minmax(0, 1fr);\n",
    1,
)
styles, removed = re.subn(
    r"\n\.continent-row__play,\n\.region-row__play \{.*?\n\}\n",
    "\n",
    styles,
    count=1,
    flags=re.S,
)
if removed != 1:
    raise RuntimeError("styles.css: split Play control block was not removed exactly once")
styles = styles.replace(
    "  .continent-row__open:hover,\n  .continent-row__play:hover,\n  .region-row__open:hover,\n  .region-row__play:hover { background: var(--surface-subtle); }",
    "  .continent-row__open:hover,\n  .region-row__open:hover { background: var(--surface-subtle); }",
)
write("src/styles/styles.css", styles)

# ---------------------------------------------------------------------------
# Remove the now-dead Quick Play application/routing capability.
# ---------------------------------------------------------------------------
replace_once("src/app.ts", "  scopeForQuickPlay,\n", "")
sub_once(
    "src/app.ts",
    r"\nfunction quickPlay\(.*?\n\}\n\nfunction replaceLauncherScope\(",
    "\nfunction replaceLauncherScope(",
    flags=re.S,
)
replace_once(
    "src/app.ts",
    "  if (action === 'quick-play') {\n    quickPlay(element.dataset.domain, id, element);\n    return;\n  }\n",
    "",
)

replace_once("src/routing/routes.ts", "import { AFRICA_MAP_SCOPE } from '../data/map-scopes.js';\n", "")
replace_once("src/routing/routes.ts", "import { scopeSupportsDomain } from '../domain/scope-support.js';\n", "")
sub_once(
    "src/routing/routes.ts",
    r"\nexport function scopeForQuickPlay\(.*?\n\}\n",
    "",
    flags=re.S,
)

# ---------------------------------------------------------------------------
# Focused verification: route model unchanged; rendered interaction contract
# now requires selection before deliberate launcher Play/Learn.
# ---------------------------------------------------------------------------
routing = read("scripts/verify-routing.mjs")
routing = routing.replace("import { CONTINENTS, REGIONS } from '../dist/data/continents.js';\n", "")
routing = routing.replace("  scopeForQuickPlay,\n", "")
routing, count = re.subn(
    r"\nconst africaScope = \{.*?\n\}\n\n// Mode-first Back chain:",
    "\n// Mode-first Back chain:",
    routing,
    count=1,
    flags=re.S,
)
if count != 1:
    raise RuntimeError("verify-routing: Quick Play scope-resolution fixture block not found")
routing = routing.replace(
    "assert.ok(app.includes('quick-play'), 'Application must dispatch direct Play without a parallel activity model.');",
    "assert.equal(app.includes('quick-play'), false, 'Application has no dead row-level Quick Play dispatch.');",
)
routing = routing.replace(
    "assert.ok(domainIndex.includes('data-action=\"quick-play\"'), 'A continent can be played straight from the domain index.');",
    "assert.equal(domainIndex.includes('data-action=\"quick-play\"'), false, 'A continent row navigates to its deliberate launcher instead of starting a round.');",
)
routing = routing.replace(
    "for (const action of ['launcher-parent', 'select-region', 'select-continent', 'quick-play']) {",
    "for (const action of ['launcher-parent', 'select-region', 'select-continent']) {",
)
routing = routing.replace(
    "assert.ok(launcher.includes('aria-pressed'), 'Region selection must be programmatic as well as visual.');",
    "assert.equal(launcher.includes('data-action=\"quick-play\"'), false, 'Region rows select scope and expose no inline Play shortcut.');\nassert.ok(launcher.includes('region-row__progress'), 'Every launcher region exposes its shared progress strip.');\nassert.ok(launcher.includes('aria-pressed'), 'Region selection must be programmatic as well as visual.');",
)
write("scripts/verify-routing.mjs", routing)

ia = read("scripts/verify-ia.mjs")
ia = ia.replace("import { icon } from '../dist/ui/components/icons.js';\n", "")
ia = ia.replace("const playIcon = icon('play');\n", "")
ia, count = re.subn(
    r"  const openButtons = actionTags\(index, 'button', 'open-scope'\);.*?\n  \}\n\}\n\n// Only Flags",
    r'''  const openButtons = actionTags(index, 'button', 'open-scope');
  const quickPlayButtons = actionTags(index, 'button', 'quick-play');
  const supported = CONTINENTS.filter((continent) =>
    scopeSupportsDomain({ kind: 'continent', id: continent.id, label: continent.name }, domain));
  assert.equal(openButtons.length, supported.length, `${domain} opens only the continents it has shipped.`);
  assert.equal(quickPlayButtons.length, 0, `${domain} exposes no row-level Quick Play shortcut.`);
  assert.equal(
    occurrences(index, 'continent-row--shell'),
    CONTINENTS.length - supported.length,
    `${domain} lists every unshipped continent as an honest shell.`,
  );

  for (const continent of supported) {
    const open = openButtons.filter((tag) => attribute(tag, 'data-id') === continent.id);
    assert.equal(open.length, 1, `${continent.name} has one deliberate navigation control in ${domain}.`);
    assertButtonContract(open[0], {
      'data-action': 'open-scope',
      'data-domain': domain,
      'data-id': continent.id,
    });
  }
}

// Only Flags''',
    ia,
    count=1,
    flags=re.S,
)
if count != 1:
    raise RuntimeError("verify-ia: continent Quick Play fixture block not found")

ia, count = re.subn(
    r"    const regionWrappers = openingTags\(html, 'div'\).*?\n\n    const selectedRows =",
    r'''    const regionWrappers = openingTags(html, 'div').filter((tag) => hasClass(tag, 'region-row'));
    const regionOpenButtons = actionTags(html, 'button', 'select-region');
    const regionPlayButtons = actionTags(html, 'button', 'quick-play');
    assert.equal(regionWrappers.length, AFRICA_MAP_REGION_CONFIGS.length, `${name} has five full-width region rows.`);
    assert.equal(regionOpenButtons.length, AFRICA_MAP_REGION_CONFIGS.length, `${name} has five region selectors.`);
    assert.equal(regionPlayButtons.length, 0, `${name} has no inline region Play shortcuts.`);
    assert.equal(occurrences(html, 'class="region-row__progress"'), AFRICA_MAP_REGION_CONFIGS.length, `${name} gives every region a progress strip.`);
    assert.deepEqual(sortedIds(regionOpenButtons), africaRegionIds, `${name} exposes every region selector.`);

    for (const config of AFRICA_MAP_REGION_CONFIGS) {
      const id = config.scope.id;
      const open = regionOpenButtons.find((tag) => attribute(tag, 'data-id') === id);
      assert.ok(open, `${name} exposes ${config.scope.label} selection.`);
      assert.equal(attribute(open, 'data-domain'), launcherCase.domain);
      assert.equal(attribute(open, 'aria-pressed'), String(id === scope.id));
    }

    const selectedRows =''',
    ia,
    count=1,
    flags=re.S,
)
if count != 1:
    raise RuntimeError("verify-ia: region split-control fixture block not found")

ia, count = re.subn(
    r"// Shared icon and CSS contracts make the split controls independently usable\..*?\nconst styles =",
    r'''// Pre-round geography selection uses ordinary labelled controls rather than
// Unicode glyph shortcuts; Play remains a deliberate launcher action.
for (const html of allPreRoundSurfaces) {
  assert.equal(/[▶►▸⏵]/u.test(html), false, 'Pre-round controls never use Unicode play glyphs.');
}

const styles =''',
    ia,
    count=1,
    flags=re.S,
)
if count != 1:
    raise RuntimeError("verify-ia: split Play icon contract block not found")

ia, count = re.subn(
    r"const openControlRule = styles\.match\(.*?\n\n// Touch-target sizing for Learn",
    r'''const continentListRule = atlasTheme.match(/\.page--tile-index \.continent-list\s*\{([^}]*)\}/)?.[1];
assert.ok(continentListRule, 'Domain continent selection has a canonical Atlas-theme rule.');
assert.match(continentListRule, /grid-template-columns:\s*minmax\(0,\s*1fr\)/, 'Phone continent selection is a single full-width stack.');

const continentOpenRule = atlasTheme.match(/\.page--tile-index \.continent-row__open\s*\{([^}]*)\}/)?.[1];
assert.ok(continentOpenRule, 'Continent rows have a dedicated full-width control rule.');
assert.match(continentOpenRule, /width:\s*100%/, 'The whole continent row is the navigation target.');
assert.match(continentOpenRule, /min-height:\s*112px/, 'Supported continent rows remain generous touch targets.');

const regionOpenRule = atlasTheme.match(/\.region-row__open\s*\{([^}]*)\}/)?.[1];
assert.ok(regionOpenRule, 'Region rows have a dedicated full-width control rule.');
assert.match(regionOpenRule, /width:\s*100%/, 'The whole region row is the selection target.');
assert.match(regionOpenRule, /min-height:\s*92px/, 'Region rows remain generous touch targets with progress visible.');

const regionProgressRule = atlasTheme.match(/\.region-row__progress\s*\{([^}]*)\}/)?.[1];
assert.ok(regionProgressRule, 'Region progress has an explicit layout slot.');
assert.match(regionProgressRule, /grid-column:\s*1\s*\/\s*-1/, 'Region progress spans the full row width.');
assert.equal(atlasTheme.includes('.continent-row__play'), false, 'Canonical navigation styling has no dead continent Play cell.');
assert.equal(atlasTheme.includes('.region-row__play'), false, 'Canonical navigation styling has no dead region Play cell.');
assert.equal(app.includes('quick-play'), false, 'Application dispatch contains no row-level Quick Play path.');

// Touch-target sizing for Learn''',
    ia,
    count=1,
    flags=re.S,
)
if count != 1:
    raise RuntimeError("verify-ia: split-control CSS contract block not found")

ia = ia.replace(
    "console.log('Issue 21 IA verification passed: split rows, scoped actions, routed launchers, retryable progressive maps, accessible selection state, responsive layouts, removed content, SVG Play controls, and CSS interaction contracts.');",
    "console.log('IA verification passed: mode-first Home, full-width geography selection, deliberate launcher Play/Learn, visible region progress, routed launchers, accessible selection state, and responsive layout contracts.');",
)
write("scripts/verify-ia.mjs", ia)

# ---------------------------------------------------------------------------
# Normative docs: retain mode-first routing, restore full-width geography
# selection and remove direct row-level Play from the product contract.
# ---------------------------------------------------------------------------
design = read("DESIGN.md")
design = design.replace(
    "- **tiles, icon buttons and row play controls** — no standing depth; they translate down 1px and darken slightly;",
    "- **tiles, icon buttons and geographic selection rows** — no standing depth; they translate down 1px and darken slightly;",
)
design = design.replace(
    "2. **Domain continent index** (`/{domain}`) — the six continents *for that mode*, as tiles carrying the continent silhouette, country and region counts, an evidence strip, and one direct Play control. Flags additionally offers a world round above the list, because Flags is the only mode whose curriculum is the world.\n3. **Continent launcher** (`/{domain}/{continent}`) — the shared launcher: Play the whole continent, the region list with per-region Play, and Learn. Selecting a region retargets the same screen rather than opening another one.",
    "2. **Domain continent index** (`/{domain}`) — the six continents *for that mode* as full-width stacked geography rows carrying the continent silhouette, country and region counts, and live evidence. A supported row opens that continent's launcher; it does not start a round. Flags additionally offers deliberate world Learn/Play actions above the list because Flags is the only mode whose curriculum is the world.\n3. **Continent launcher** (`/{domain}/{continent}`) — the shared launcher: one deliberate Play action for the active scope, a full-width region list with visible progress, and Learn. Selecting a region retargets the same screen and the same Play/Learn actions rather than opening another page or bypassing the launcher.",
)
design = design.replace(
    "Mode cards stack in a single column on phone portrait; continent tiles sit in a two-column grid from 375px up and collapse to one column below it. Short landscape (≥700px wide, ≤600px tall) switches the mode list to two columns, keeping the same cards rather than introducing a second layout.",
    "Mode cards and post-mode geography selection both favour vertical scanability on phone portrait. Mode cards stack in one column, and continent/region selection remains a single full-width stack at ordinary phone widths. Short landscape (≥700px wide, ≤600px tall) may reflow constrained surfaces deliberately where it improves fit, but desktop density is not the phone default.",
)
design = design.replace(
    "Region cards are fast scope-selection/game-entry surfaces inside one mode's launcher: region identity, country count, evidence summary, and a single Play control for the mode already chosen. They do not need to become achievement dashboards.",
    "Region cards are full-width scope-selection surfaces inside one mode's launcher: region identity, country count, live evidence summary and progress strip, plus an explicit selected state. They do not start a round themselves and do not need to become achievement dashboards; the launcher's normal Play/Learn actions operate on whichever scope is selected.",
)
design = design.replace(
    "The four-domain launch row that region cards carried under scope-first navigation is retired. It existed to let a learner pick a mode *after* picking geography; mode-first ordering answers that question one screen earlier, so repeating four launchers on every region row would now be redundant chrome rather than a shortcut.",
    "The four-domain launch row that region cards carried under scope-first navigation is retired. The later row-level Quick Play experiment is also retired: once a mode is chosen, continent and region rows answer only the geographic-selection question, while deliberate Play/Learn remains on the active launcher. This keeps each surface responsible for one decision and avoids tiny trailing action cells.",
)
design = design.replace(
    "domain-launch shortcuts on region cards remain the way to start a session.",
    "the active launcher's normal Play/Learn actions remain the way to start a session.",
)
write("DESIGN.md", design)

product = read("PRODUCT.md")
product = product.replace(
    "2. **Continent index** — that mode's six continents, with direct Play. Continents the mode has not shipped appear as honest, inert shells.\n3. **Continent launcher** — Play the whole continent, or any of its regions, plus Learn.",
    "2. **Continent index** — that mode's six continents as full-width geography rows with visible evidence. A supported row opens its launcher; unshipped continents remain honest, inert shells.\n3. **Continent launcher** — deliberate Play/Learn actions for the active continent or selected region, with full-width region rows that expose their existing progress without starting a round themselves.",
)
product = product.replace(
    "- Learn and Play remain direct;",
    "- Learn and Play remain direct once the learner has deliberately selected the geographic scope;",
)
write("PRODUCT.md", product)

routing_doc = read("docs/architecture/routing.md")
routing_doc = routing_doc.replace(
    "Every domain uses the identical three-level shape. Home carries no Play control at all: it commits to a mode and nothing else. The continent index splits each shipped continent into a body that opens the launcher and a trailing Play control that starts a continent-wide round directly; an unshipped continent renders inert, with no action. Only Flags adds a world Play/Learn pair above its continent list, because only Flags teaches the world.",
    "Every domain uses the identical three-level shape. Home carries no Play control at all: it commits to a mode and nothing else. On the continent index, each shipped continent is one full-width navigation row that opens the launcher; it does not start a round directly. An unshipped continent renders inert, with no action. Only Flags adds a deliberate world Play/Learn pair above its continent list, because only Flags teaches the world.",
)
routing_doc = routing_doc.replace(
    "One routed launcher represents `(domain, continentScope, selectedRegion | null)`. A region URL does not identify a second screen: `/#/locations/africa/west-africa` is the Africa Locations launcher with West Africa selected. Its Play and Learn actions both name and target West Africa, while an explicit All Africa control clears the selection. The region list is always present; an Africa map may progressively enhance Locations, Outlines, and Neighbours without blocking the launcher or becoming a second selection model.",
    "One routed launcher represents `(domain, continentScope, selectedRegion | null)`. A region URL does not identify a second screen: `/#/locations/africa/west-africa` is the Africa Locations launcher with West Africa selected. Region rows are selection controls with their existing progress visible; they do not contain a second Play action. The launcher's Play and Learn actions both name and target West Africa, while an explicit All Africa control clears the selection. The region list is always present; an Africa map may progressively enhance Locations, Outlines, and Neighbours without blocking the launcher or becoming a second selection model.",
)
write("docs/architecture/routing.md", routing_doc)

config_path = ".impeccable/design.json"
config = json.loads(read(config_path))
config["tokens"]["depth"]["arcade"] = (
    "Home mode-card exception only: 2px solid text-colour border + 2px 2px 0 hard offset shadow, "
    "collapsing via diagonal translate(2px, 2px) on press. Post-mode continent and region selection "
    "uses soft tile depth."
)
principles = config["principles"]
principles[-1] = (
    "Navigation is mode-first: Home chooses the learning domain, then full-width continent and region "
    "rows choose geography before deliberate launcher Play/Learn actions"
)
write(config_path, json.dumps(config, indent=2, ensure_ascii=False) + "\n")

# Shell assets changed, so advance the existing cache-version convention.
for path in [
    "public/sw.js",
    "scripts/verify-atlas-brand.mjs",
    "scripts/verify-map.mjs",
    "scripts/verify-domain-integration.mjs",
    "scripts/verify-routing.mjs",
    "scripts/verify-neighbor-map.mjs",
    "scripts/verify-british-english.mjs",
]:
    text = read(path)
    if "flag-atlas-v16" not in text:
        raise RuntimeError(f"{path}: expected v16 cache reference")
    write(path, text.replace("flag-atlas-v16", "flag-atlas-v17"))

# Final source-level guardrails before the full build/test suite runs.
for path in [
    "src/ui/views/domain.ts",
    "src/ui/views/launcher.ts",
    "src/app.ts",
    "src/routing/routes.ts",
]:
    if "quick-play" in read(path):
        raise RuntimeError(f"{path}: learner-facing/dead Quick Play contract remains")

for path in ["src/styles/styles.css", "src/styles/atlas-theme.css"]:
    if "__play" in read(path):
        raise RuntimeError(f"{path}: split row Play styling remains")

print("Issue #77 source patch applied.")

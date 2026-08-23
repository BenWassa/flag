from __future__ import annotations

import json
import re
from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    Path(path).write_text(text, encoding="utf-8")


def replace_required(path: str, old: str, new: str) -> None:
    text = read(path)
    if old not in text:
        raise RuntimeError(f"{path}: required text not found: {old[:90]!r}")
    write(path, text.replace(old, new, 1))


def regex_once(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, lambda _match: replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return updated


# The first one-shot pass already materialised the view/CSS/app/routing changes.
# Resume at the verifier boundary where that pass stopped.
ia = read("scripts/verify-ia.mjs")
ia = ia.replace("import { icon } from '../dist/ui/components/icons.js';\n", "")
ia = ia.replace("const playIcon = icon('play');\n", "")

ia = regex_once(
    ia,
    r"  const openButtons = actionTags\(index, 'button', 'open-scope'\);.*?\n  \}\n\}\n\n// Only Flags",
    """  const openButtons = actionTags(index, 'button', 'open-scope');
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

// Only Flags""",
    "verify-ia continent contract",
)

ia = regex_once(
    ia,
    r"    const regionWrappers = openingTags\(html, 'div'\).*?\n\n    const selectedRows =",
    """    const regionWrappers = openingTags(html, 'div').filter((tag) => hasClass(tag, 'region-row'));
    const regionOpenButtons = actionTags(html, 'button', 'select-region');
    const regionPlayButtons = actionTags(html, 'button', 'quick-play');
    assert.equal(regionWrappers.length, AFRICA_MAP_REGION_CONFIGS.length, `${name} has five full-width region rows.`);
    assert.equal(regionOpenButtons.length, AFRICA_MAP_REGION_CONFIGS.length, `${name} has five region selectors.`);
    assert.equal(regionPlayButtons.length, 0, `${name} has no inline region Play shortcuts.`);
    assert.equal(
      occurrences(html, 'class=\"region-row__progress\"'),
      AFRICA_MAP_REGION_CONFIGS.length,
      `${name} gives every region a progress strip.`,
    );
    assert.deepEqual(sortedIds(regionOpenButtons), africaRegionIds, `${name} exposes every region selector.`);

    for (const config of AFRICA_MAP_REGION_CONFIGS) {
      const id = config.scope.id;
      const open = regionOpenButtons.find((tag) => attribute(tag, 'data-id') === id);
      assert.ok(open, `${name} exposes ${config.scope.label} selection.`);
      assert.equal(attribute(open, 'data-domain'), launcherCase.domain);
      assert.equal(attribute(open, 'aria-pressed'), String(id === scope.id));
    }

    const selectedRows =""",
    "verify-ia region contract",
)

ia = regex_once(
    ia,
    r"// Shared icon and CSS contracts make the split controls independently usable\..*?\nconst styles =",
    """// Pre-round geography selection uses labelled scope controls rather than
// inline Play shortcuts or Unicode glyphs.
for (const html of allPreRoundSurfaces) {
  assert.equal(/[▶►▸⏵]/u.test(html), false, 'Pre-round controls never use Unicode play glyphs.');
}

const styles =""",
    "verify-ia obsolete Play icon contract",
)

ia = regex_once(
    ia,
    r"const openControlRule = styles\.match\(.*?\n\n// Touch-target sizing for Learn",
    """const continentListRule = atlasTheme.match(/\\.page--tile-index \\.continent-list\\s*\\{([^}]*)\\}/)?.[1];
assert.ok(continentListRule, 'Domain continent selection has a canonical Atlas-theme rule.');
assert.match(
  continentListRule,
  /grid-template-columns:\\s*minmax\\(0,\\s*1fr\\)/,
  'Phone continent selection is a single full-width stack.',
);

const continentOpenRule = atlasTheme.match(/\\.page--tile-index \\.continent-row__open\\s*\\{([^}]*)\\}/)?.[1];
assert.ok(continentOpenRule, 'Continent rows have a dedicated full-width control rule.');
assert.match(continentOpenRule, /width:\\s*100%/, 'The whole continent row is the navigation target.');
assert.match(continentOpenRule, /min-height:\\s*112px/, 'Supported continent rows remain generous touch targets.');

const regionOpenRule = atlasTheme.match(/\\.region-row__open\\s*\\{([^}]*)\\}/)?.[1];
assert.ok(regionOpenRule, 'Region rows have a dedicated full-width control rule.');
assert.match(regionOpenRule, /width:\\s*100%/, 'The whole region row is the selection target.');
assert.match(regionOpenRule, /min-height:\\s*92px/, 'Region rows remain generous touch targets with progress visible.');

const regionProgressRule = atlasTheme.match(/\\.region-row__progress\\s*\\{([^}]*)\\}/)?.[1];
assert.ok(regionProgressRule, 'Region progress has an explicit layout slot.');
assert.match(regionProgressRule, /grid-column:\\s*1\\s*\\/\\s*-1/, 'Region progress spans the full row width.');
assert.equal(atlasTheme.includes('.continent-row__play'), false, 'Canonical navigation styling has no dead continent Play cell.');
assert.equal(atlasTheme.includes('.region-row__play'), false, 'Canonical navigation styling has no dead region Play cell.');
assert.equal(app.includes('quick-play'), false, 'Application dispatch contains no row-level Quick Play path.');

// Touch-target sizing for Learn""",
    "verify-ia CSS contract",
)

ia = ia.replace(
    "console.log('Issue 21 IA verification passed: split rows, scoped actions, routed launchers, retryable progressive maps, accessible selection state, responsive layouts, removed content, SVG Play controls, and CSS interaction contracts.');",
    "console.log('IA verification passed: mode-first Home, full-width geography selection, deliberate launcher Play/Learn, visible region progress, routed launchers, accessible selection state, and responsive layout contracts.');",
)
write("scripts/verify-ia.mjs", ia)

# Normative product/design documentation now matches the shipped mode-first,
# full-width selection model rather than the retired row-level Play experiment.
design = read("DESIGN.md")
replacements = [
    (
        "- **tiles, icon buttons and row play controls** — no standing depth; they translate down 1px and darken slightly;",
        "- **tiles, icon buttons and geographic selection rows** — no standing depth; they translate down 1px and darken slightly;",
    ),
    (
        "2. **Domain continent index** (`/{domain}`) — the six continents *for that mode*, as tiles carrying the continent silhouette, country and region counts, an evidence strip, and one direct Play control. Flags additionally offers a world round above the list, because Flags is the only mode whose curriculum is the world.\n3. **Continent launcher** (`/{domain}/{continent}`) — the shared launcher: Play the whole continent, the region list with per-region Play, and Learn. Selecting a region retargets the same screen rather than opening another one.",
        "2. **Domain continent index** (`/{domain}`) — the six continents *for that mode* as full-width stacked geography rows carrying the continent silhouette, country and region counts, and live evidence. A supported row opens that continent's launcher; it does not start a round. Flags additionally offers deliberate world Learn/Play actions above the list because Flags is the only mode whose curriculum is the world.\n3. **Continent launcher** (`/{domain}/{continent}`) — the shared launcher: one deliberate Play action for the active scope, a full-width region list with visible progress, and Learn. Selecting a region retargets the same screen and the same Play/Learn actions rather than opening another page or bypassing the launcher.",
    ),
    (
        "Mode cards stack in a single column on phone portrait; continent tiles sit in a two-column grid from 375px up and collapse to one column below it. Short landscape (≥700px wide, ≤600px tall) switches the mode list to two columns, keeping the same cards rather than introducing a second layout.",
        "Mode cards and post-mode geography selection both favour vertical scanability on phone portrait. Mode cards stack in one column, and continent/region selection remains a single full-width stack at ordinary phone widths. Short landscape (≥700px wide, ≤600px tall) may reflow constrained surfaces deliberately where it improves fit, but desktop density is not the phone default.",
    ),
    (
        "Region cards are fast scope-selection/game-entry surfaces inside one mode's launcher: region identity, country count, evidence summary, and a single Play control for the mode already chosen. They do not need to become achievement dashboards.",
        "Region cards are full-width scope-selection surfaces inside one mode's launcher: region identity, country count, live evidence summary and progress strip, plus an explicit selected state. They do not start a round themselves and do not need to become achievement dashboards; the launcher's normal Play/Learn actions operate on whichever scope is selected.",
    ),
    (
        "The four-domain launch row that region cards carried under scope-first navigation is retired. It existed to let a learner pick a mode *after* picking geography; mode-first ordering answers that question one screen earlier, so repeating four launchers on every region row would now be redundant chrome rather than a shortcut.",
        "The four-domain launch row that region cards carried under scope-first navigation is retired. The later row-level Quick Play experiment is also retired: once a mode is chosen, continent and region rows answer only the geographic-selection question, while deliberate Play/Learn remains on the active launcher. This keeps each surface responsible for one decision and avoids tiny trailing action cells.",
    ),
    (
        "domain-launch shortcuts on region cards remain the way to start a session.",
        "the active launcher's normal Play/Learn actions remain the way to start a session.",
    ),
]
for old, new in replacements:
    if old not in design:
        raise RuntimeError(f"DESIGN.md: required text not found: {old[:90]!r}")
    design = design.replace(old, new, 1)
write("DESIGN.md", design)

product = read("PRODUCT.md")
for old, new in [
    (
        "2. **Continent index** — that mode's six continents, with direct Play. Continents the mode has not shipped appear as honest, inert shells.\n3. **Continent launcher** — Play the whole continent, or any of its regions, plus Learn.",
        "2. **Continent index** — that mode's six continents as full-width geography rows with visible evidence. A supported row opens its launcher; unshipped continents remain honest, inert shells.\n3. **Continent launcher** — deliberate Play/Learn actions for the active continent or selected region, with full-width region rows that expose their existing progress without starting a round themselves.",
    ),
    (
        "- Learn and Play remain direct;",
        "- Learn and Play remain direct once the learner has deliberately selected the geographic scope;",
    ),
]:
    if old not in product:
        raise RuntimeError(f"PRODUCT.md: required text not found: {old[:90]!r}")
    product = product.replace(old, new, 1)
write("PRODUCT.md", product)

routing_doc = read("docs/architecture/routing.md")
for old, new in [
    (
        "Every domain uses the identical three-level shape. Home carries no Play control at all: it commits to a mode and nothing else. The continent index splits each shipped continent into a body that opens the launcher and a trailing Play control that starts a continent-wide round directly; an unshipped continent renders inert, with no action. Only Flags adds a world Play/Learn pair above its continent list, because only Flags teaches the world.",
        "Every domain uses the identical three-level shape. Home carries no Play control at all: it commits to a mode and nothing else. On the continent index, each shipped continent is one full-width navigation row that opens the launcher; it does not start a round directly. An unshipped continent renders inert, with no action. Only Flags adds a deliberate world Play/Learn pair above its continent list, because only Flags teaches the world.",
    ),
    (
        "One routed launcher represents `(domain, continentScope, selectedRegion | null)`. A region URL does not identify a second screen: `/#/locations/africa/west-africa` is the Africa Locations launcher with West Africa selected. Its Play and Learn actions both name and target West Africa, while an explicit All Africa control clears the selection. The region list is always present; an Africa map may progressively enhance Locations, Outlines, and Neighbours without blocking the launcher or becoming a second selection model.",
        "One routed launcher represents `(domain, continentScope, selectedRegion | null)`. A region URL does not identify a second screen: `/#/locations/africa/west-africa` is the Africa Locations launcher with West Africa selected. Region rows are selection controls with their existing progress visible; they do not contain a second Play action. The launcher's Play and Learn actions both name and target West Africa, while an explicit All Africa control clears the selection. The region list is always present; an Africa map may progressively enhance Locations, Outlines, and Neighbours without blocking the launcher or becoming a second selection model.",
    ),
]:
    if old not in routing_doc:
        raise RuntimeError(f"routing.md: required text not found: {old[:90]!r}")
    routing_doc = routing_doc.replace(old, new, 1)
write("docs/architecture/routing.md", routing_doc)

config_path = ".impeccable/design.json"
config = json.loads(read(config_path))
config["tokens"]["depth"]["arcade"] = (
    "Home mode-card exception only: 2px solid text-colour border + 2px 2px 0 hard offset shadow, "
    "collapsing via diagonal translate(2px, 2px) on press. Post-mode continent and region selection uses soft tile depth."
)
config["principles"][-1] = (
    "Navigation is mode-first: Home chooses the learning domain, then full-width continent and region rows choose geography before deliberate launcher Play/Learn actions"
)
write(config_path, json.dumps(config, indent=2, ensure_ascii=False) + "\n")

# Shell CSS/JS changed: follow the existing service-worker cache convention.
cache_paths = [
    "public/sw.js",
    "scripts/verify-atlas-brand.mjs",
    "scripts/verify-map.mjs",
    "scripts/verify-domain-integration.mjs",
    "scripts/verify-routing.mjs",
    "scripts/verify-neighbor-map.mjs",
    "scripts/verify-british-english.mjs",
]
for path in cache_paths:
    text = read(path)
    if "flag-atlas-v16" not in text:
        raise RuntimeError(f"{path}: expected v16 cache reference")
    write(path, text.replace("flag-atlas-v16", "flag-atlas-v17"))

# Guard the completed architecture before the workflow runs npm test.
for path in [
    "src/ui/views/domain.ts",
    "src/ui/views/launcher.ts",
    "src/app.ts",
    "src/routing/routes.ts",
]:
    if "quick-play" in read(path):
        raise RuntimeError(f"{path}: Quick Play contract remains")
for path in ["src/styles/styles.css", "src/styles/atlas-theme.css"]:
    if "__play" in read(path):
        raise RuntimeError(f"{path}: split-row Play styling remains")

print("Issue #77 continuation patch applied.")

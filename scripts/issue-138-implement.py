from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, found {count}')
    target.write_text(text.replace(old, new, 1))


replace_once(
    'src/react/screens/PassiveScreens.tsx',
    "import { getContinentAchievementReadModel, type EarnedAchievementState } from '../../domain/achievements.js';",
    "import { getContinentAchievementReadModel, getWorldAchievementReadModel, type EarnedAchievementState } from '../../domain/achievements.js';",
)
replace_once(
    'src/react/screens/PassiveScreens.tsx',
    "export function HomeScreen({ ledgers, persisting }: { ledgers: ProgressLedgers; persisting: boolean }) {\n  const actions = useAtlasActions();",
    "export function HomeScreen({ ledgers, achievements, persisting }: { ledgers: ProgressLedgers; achievements: EarnedAchievementState; persisting: boolean }) {\n  const actions = useAtlasActions();\n  const worldAchievement = getWorldAchievementReadModel(achievements);",
)
replace_once(
    'src/react/screens/PassiveScreens.tsx',
    "      {!persisting ? <StorageNotice /> : null}\n      <h2 className=\"atlas-eyebrow\">Modes</h2>",
    "      {!persisting ? <StorageNotice /> : null}\n      {worldAchievement.crownEarned ? <section className=\"world-crown\" aria-labelledby=\"world-crown-title\" data-world-crown-earned>\n        <div className=\"world-crown__identity\"><h2 id=\"world-crown-title\">World Crown</h2><p>Earned · all six continents complete</p></div>\n      </section> : null}\n      <h2 className=\"atlas-eyebrow\">Modes</h2>",
)
replace_once(
    'src/react/AtlasApp.tsx',
    "case 'home': return <HomeScreen ledgers={ledgers} persisting={allPersisting} />;",
    "case 'home': return <HomeScreen ledgers={ledgers} achievements={store.achievements} persisting={allPersisting} />;",
)

css_anchor = ".brand-name {\n  font-size: 18px;\n  font-weight: 800;\n  letter-spacing: -.03em;\n}\n"
css_world = css_anchor + """
/* World Crown is an earned-only global state. Keep its Home treatment quiet:
   text carries the meaning; gold only reinforces the final prestige tier. */
.world-crown {
  margin: -2px 0 24px;
  padding: 12px 0 13px;
  border-block: 1px solid color-mix(in srgb, var(--prestige) 72%, var(--line));
}

.world-crown__identity {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.world-crown h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -.02em;
}

.world-crown p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 650;
  line-height: 1.35;
  text-align: right;
}

@media (max-width: 420px) {
  .world-crown__identity {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .world-crown p { text-align: left; }
}
"""
replace_once('src/styles/atlas-theme.css', css_anchor, css_world)

replace_once(
    'src/react/test/components.test.tsx',
    "render(<AtlasActionsContext value={atlasActions}><HomeScreen ledgers={ledgers()} persisting /></AtlasActionsContext>);",
    "render(<AtlasActionsContext value={atlasActions}><HomeScreen ledgers={ledgers()} achievements={createInitialAchievementState()} persisting /></AtlasActionsContext>);\n\n    expect(screen.queryByRole('heading', { name: 'World Crown' })).toBeNull();",
)
replace_once(
    'src/react/test/components.test.tsx',
    "  it('keeps continent interaction aligned with canonical domain support', () => {",
    "  it('shows the World Crown only when the persisted achievement is earned', () => {\n    const earned = { ...createInitialAchievementState(), worldCrown: true };\n    render(<AtlasActionsContext value={actions()}><HomeScreen ledgers={ledgers()} achievements={earned} persisting /></AtlasActionsContext>);\n\n    expect(screen.getByRole('heading', { name: 'World Crown' })).toBeTruthy();\n    expect(screen.getByText('Earned · all six continents complete')).toBeTruthy();\n  });\n\n  it('keeps continent interaction aligned with canonical domain support', () => {",
)

Path('tests/browser/world-crown.spec.ts').write_text("""import { expect, test } from '@playwright/test';

const EARNED_WORLD = {
  version: 1,
  regionDomainMasteries: [],
  completeRegions: [],
  completeContinents: [],
  worldCrown: true,
};

const VIEWPORTS = [
  { label: 'phone portrait', width: 390, height: 844 },
  { label: 'short landscape', width: 844, height: 390 },
];

test('an unearned World Crown adds no routine Crown decoration', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('[data-world-crown-earned]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'World Crown' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Modes' })).toBeVisible();
});

for (const viewport of VIEWPORTS) {
  test(`earned World Crown is visible and usable on ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.addInitScript((state) => {
      localStorage.setItem('flag-atlas:earned-achievements:v1', JSON.stringify(state));
    }, EARNED_WORLD);
    await page.goto('/');

    const crown = page.locator('[data-world-crown-earned]');
    await expect(crown).toBeVisible();
    await expect(page.getByRole('heading', { name: 'World Crown' })).toBeVisible();
    await expect(page.getByText('Earned · all six continents complete')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Modes' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Flags/i })).toBeVisible();

    const layout = await page.evaluate(() => {
      const crown = document.querySelector('[data-world-crown-earned]')!.getBoundingClientRect();
      return {
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        crownLeft: crown.left,
        crownRight: crown.right,
        viewportWidth: window.innerWidth,
      };
    });
    expect(layout.horizontalOverflow).toBe(false);
    expect(layout.crownLeft).toBeGreaterThanOrEqual(0);
    expect(layout.crownRight).toBeLessThanOrEqual(layout.viewportWidth);
  });
}
""")

replace_once(
    'scripts/verify.mjs',
    "const renderHome = (ledgers, persisting = true) => renderScreen(HomeScreen, { ledgers, persisting });",
    "const renderHome = (ledgers, achievements, persisting = true) => renderScreen(HomeScreen, { ledgers, achievements, persisting });",
)
replace_once(
    'scripts/verify.mjs',
    "home: renderHome(ledgers),",
    "home: renderHome(ledgers, achievements),",
)
replace_once(
    'scripts/verify-ia.mjs',
    "const home = renderScreen(HomeScreen, { ledgers, persisting: true });\nconst homeWithoutPersistence = renderScreen(HomeScreen, { ledgers, persisting: false });",
    "const home = renderScreen(HomeScreen, { ledgers, achievements, persisting: true });\nconst homeWithoutPersistence = renderScreen(HomeScreen, { ledgers, achievements, persisting: false });",
)

replace_once(
    'DESIGN.md',
    "The World Crown is the highest and final prestige tier. The domain/state model supports and persists `worldCrown`, but v1 has no React learner-facing Crown renderer and the state cannot currently be earned because global four-domain curriculum is incomplete.\n\nDo not show locked/decorative Crowns in routine states, and do not introduce a prestige tier above the Crown.",
    "The World Crown is the highest and final prestige tier. All six continents now have complete four-domain curriculum, so the existing `worldCrown` state is genuinely reachable. When earned, Home shows one quiet World Crown line with explicit earned wording; the state is not duplicated across domain indexes or expanded into a ceremony/dashboard.\n\nDo not show locked/decorative Crowns in routine states, and do not introduce a prestige tier above the Crown.",
)
replace_once(
    '.impeccable/design.json',
    '"World completion alone reserves the Crown; the state exists but no learner-facing React Crown surface ships in v1"',
    '"World completion alone reserves the Crown; an earned-only World Crown state is surfaced quietly on Home"',
)
replace_once(
    'PRODUCT.md',
    "All six real continents now have intended four-domain production curriculum. Oceania's 14-country implementation is owned by #27; its World Crown presentation consequence remains separated into #138.",
    "All six real continents now have intended four-domain production curriculum. The existing World Crown state is therefore reachable; #138 surfaces it only after it is genuinely earned.",
)
replace_once(
    'PRODUCT.md',
    "- **#138** owns the learner-facing World Crown surface/final acceptance now that the underlying world curriculum is complete;",
    "- the World Crown appears only when earned, as a quiet Home prestige line rather than a locked decoration, ceremony or new progression economy;",
)
replace_once(
    'docs/architecture/earned-achievements.md',
    "There is no learner-facing React World Crown renderer in current v1 production. The persisted state and read model are now genuinely reachable; Issue #138 owns learner-facing surfacing and final acceptance without changing the qualification hierarchy.",
    "The persisted state and read model are genuinely reachable. Issue #138 surfaces `crownEarned` on Home only when true; the renderer consumes the existing read model and does not duplicate or change qualification rules.",
)
replace_once(
    'docs/architecture/earned-achievements.md',
    "There is no dedicated Progress screen, no separate region badge/crown, no full-screen continent trophy ceremony and no World Crown surface in current v1 production.",
    "There is no dedicated Progress screen, no separate region badge/crown and no full-screen continent trophy ceremony. An earned World Crown has one quiet Home presentation; an unearned Crown has no routine UI decoration.",
)

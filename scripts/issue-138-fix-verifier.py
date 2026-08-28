from pathlib import Path


def replace_once(path_name: str, old: str, new: str) -> None:
    path = Path(path_name)
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path_name}: expected exactly one transformed verifier match, found {count}')
    path.write_text(text.replace(old, new, 1))


# Preserve verify.mjs's existing helper API: the achievement fixture is already
# in scope, and callers that pass `false` must continue to mean persistence off.
replace_once(
    'scripts/verify.mjs',
    "const renderHome = (ledgers, achievements, persisting = true) => renderScreen(HomeScreen, { ledgers, achievements, persisting });",
    "const renderHome = (ledgers, persisting = true) => renderScreen(HomeScreen, { ledgers, achievements, persisting });",
)
replace_once(
    'scripts/verify.mjs',
    "home: renderHome(ledgers, achievements),",
    "home: renderHome(ledgers),",
)

# The remaining verifiers render Home directly rather than through AtlasApp.
# Pass the existing achievement fixture explicitly; do not make Home tolerate
# an undefined state because production always owns this state.
replace_once(
    'scripts/verify-domain-integration.mjs',
    "const homeHtml = renderScreen(HomeScreen, { ledgers, persisting: true });\nassert.equal((homeHtml.match(/class=\"atlas-card\"/g) ?? []).length, 4, 'Home exposes all four learning domains.');",
    "const achievements = createInitialAchievementState();\nconst homeHtml = renderScreen(HomeScreen, { ledgers, achievements, persisting: true });\nassert.equal((homeHtml.match(/class=\"atlas-card\"/g) ?? []).length, 4, 'Home exposes all four learning domains.');",
)
replace_once(
    'scripts/verify-domain-integration.mjs',
    "\nconst achievements = createInitialAchievementState();\nconst flagsIndexHtml",
    "\nconst flagsIndexHtml",
)
replace_once(
    'scripts/verify-action-feedback.mjs',
    "const home = renderScreen(HomeScreen, { ledgers, persisting: true });",
    "const home = renderScreen(HomeScreen, { ledgers, achievements: createInitialAchievementState(), persisting: true });",
)
replace_once(
    'scripts/verify-british-english.mjs',
    "const homeHtml = renderScreen(HomeScreen, { ledgers: britishLedgers, persisting: true });",
    "const homeHtml = renderScreen(HomeScreen, { ledgers: britishLedgers, achievements, persisting: true });",
)

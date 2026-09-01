from pathlib import Path
import re


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(text)


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)

# Shared, domain-neutral timing policy for equivalent Play recognition mechanics.
write('src/state/play-feedback-timing.ts', '''/** Shared Play feedback dwell for equivalent one-answer recognition mechanics. */\nexport const PLAY_FEEDBACK_DWELL_CORRECT_MS = 620;\nexport const PLAY_FEEDBACK_DWELL_WRONG_MS = 1500;\n\nexport function playFeedbackDwellMs(correct: boolean): number {\n  return correct ? PLAY_FEEDBACK_DWELL_CORRECT_MS : PLAY_FEEDBACK_DWELL_WRONG_MS;\n}\n''')

write('src/state/play-feedback-timing.test.ts', '''import { describe, expect, it } from 'vitest';\nimport { PLAY_FEEDBACK_DWELL_CORRECT_MS, PLAY_FEEDBACK_DWELL_WRONG_MS, playFeedbackDwellMs } from './play-feedback-timing.js';\n\ndescribe('Play feedback dwell', () => {\n  it('keeps correct feedback readable without stalling play', () => {\n    expect(playFeedbackDwellMs(true)).toBe(620);\n    expect(PLAY_FEEDBACK_DWELL_CORRECT_MS).toBeGreaterThanOrEqual(400);\n    expect(PLAY_FEEDBACK_DWELL_CORRECT_MS).toBeLessThanOrEqual(900);\n  });\n\n  it('gives wrong feedback longer to read', () => {\n    expect(playFeedbackDwellMs(false)).toBe(1500);\n    expect(PLAY_FEEDBACK_DWELL_WRONG_MS).toBeGreaterThan(PLAY_FEEDBACK_DWELL_CORRECT_MS);\n    expect(PLAY_FEEDBACK_DWELL_WRONG_MS).toBeGreaterThanOrEqual(1200);\n  });\n});\n''')

# Flags consumes the shared policy without changing behaviour.
p = 'src/state/flags-round.ts'
s = read(p)
s = replace_once(s,
"import { setActiveRoundRoute } from './active-round.js';\nimport type { RoundContext } from './round-context.js';",
"import { setActiveRoundRoute } from './active-round.js';\nimport { playFeedbackDwellMs } from './play-feedback-timing.js';\nimport type { RoundContext } from './round-context.js';",
'flags timing import')
s = re.sub(r"/\*\*\n \* Play dwell before the round moves on\.[\s\S]*?const PLAY_DWELL_WRONG_MS = 1500;\n\n", '', s, count=1)
s = replace_once(s,
"attempt.correct ? PLAY_DWELL_CORRECT_MS : PLAY_DWELL_WRONG_MS,",
"playFeedbackDwellMs(attempt.correct),",
'flags shared dwell')
write(p, s)

# Locations consumes the same Play policy; Learn's miss/reveal ladder remains untouched.
p = 'src/state/locations-round.ts'
s = read(p)
s = replace_once(s,
"import { beginRoundLaunch, isCurrentRoundLaunch } from './round-launch-guard.js';\nimport type { RoundContext } from './round-context.js';\n\nconst PLAY_DWELL_CORRECT_MS = 620;\nconst PLAY_DWELL_WRONG_MS = 1500;",
"import { beginRoundLaunch, isCurrentRoundLaunch } from './round-launch-guard.js';\nimport { playFeedbackDwellMs } from './play-feedback-timing.js';\nimport type { RoundContext } from './round-context.js';",
'locations shared timing import')
s = replace_once(s,
"? outcome.correct ? PLAY_DWELL_CORRECT_MS : PLAY_DWELL_WRONG_MS\n      : outcome.revealed",
"? playFeedbackDwellMs(outcome.correct)\n      : outcome.revealed",
'locations shared dwell')
write(p, s)

# Outlines adopts the same outcome-aware dwell and a safe skip hook.
p = 'src/state/outlines-round.ts'
s = read(p)
s = replace_once(s,
"import { beginRoundLaunch, isCurrentRoundLaunch } from './round-launch-guard.js';\nimport type { RoundContext } from './round-context.js';",
"import { beginRoundLaunch, isCurrentRoundLaunch } from './round-launch-guard.js';\nimport { playFeedbackDwellMs } from './play-feedback-timing.js';\nimport type { RoundContext } from './round-context.js';",
'outlines timing import')
s = replace_once(s,
"  cancelPending(): void;\n  /** No-op unless an outline round has just finished",
"  cancelPending(): void;\n  /** Skips the remaining Play feedback dwell. Returns false when nothing is pending. */\n  advanceNow(): boolean;\n  /** No-op unless an outline round has just finished",
'outlines interface advanceNow')
s = replace_once(s,
"    store.answerOutline(countryId);\n    announce(answerAnnouncement(countryId));",
"    const attempt = store.answerOutline(countryId);\n    announce(answerAnnouncement(countryId));",
'capture outline attempt')
s = replace_once(s,
"      pendingOutlineAdvance = window.setTimeout(() => {\n        pendingOutlineAdvance = null;\n        if (store.view.name !== 'outline-quiz') return;\n        store.advanceOutline();\n        announceResult();\n        finishInteraction(null);\n      }, 180);",
"      pendingOutlineAdvance = window.setTimeout(advancePending, playFeedbackDwellMs(attempt.correct));",
'outline outcome dwell')
s = replace_once(s,
"  function reviewMistakes(): void {",
"  function advancePending(): void {\n    pendingOutlineAdvance = null;\n    if (store.view.name !== 'outline-quiz') return;\n    store.advanceOutline();\n    announceResult();\n    finishInteraction(null);\n  }\n\n  function advanceNow(): boolean {\n    if (pendingOutlineAdvance === null) return false;\n    cancelPending();\n    advancePending();\n    return true;\n  }\n\n  function reviewMistakes(): void {",
'outline advance functions')
s = replace_once(s,
"  return { currentScope, begin, submitAnswer, announceResult, cancelPending, reviewMistakes, repeat };",
"  return { currentScope, begin, submitAnswer, announceResult, cancelPending, advanceNow, reviewMistakes, repeat };",
'outline return advanceNow')
write(p, s)

# Outlines Play gets the same live score as equivalent recognition Play surfaces.
p = 'src/react/screens/RecognitionScreens.tsx'
s = read(p)
s = replace_once(s,
"{play && !outlineAsset ? <LiveScore score={score} /> : null}",
"{play ? <LiveScore score={score} /> : null}",
'outline live score')
write(p, s)

# Wire Enter to the safe Outlines Play skip hook, mirroring the existing Flags controller contract.
p = 'src/react/AtlasApp.tsx'
s = read(p)
s = replace_once(s,
"      if (event.key === 'Enter' && store.view.name === 'outline-quiz' && store.outlineAnsweredCountryId !== null && store.outlineSession?.mode === 'learn') actions.advance('outlines');",
"      if (event.key === 'Enter' && store.view.name === 'outline-quiz' && store.outlineAnsweredCountryId !== null && store.outlineSession?.mode === 'learn') actions.advance('outlines');\n      if (event.key === 'Enter' && store.view.name === 'outline-quiz' && store.outlineAnsweredCountryId !== null && store.outlineSession?.mode === 'test') { event.preventDefault(); rounds.outlines.advanceNow(); }",
'outline Play Enter skip')
write(p, s)

# Make the existing verifier's Outlines claim real: score parity plus all three controllers consuming one timing policy.
p = 'scripts/verify-play-feedback.mjs'
s = read(p)
s = replace_once(s,
"const outlineBefore = renderOutlineQuiz(westOutlineAsset, outlineSession, null);\nassert.ok(\n  !outlineBefore.includes('answer-feedback--correct') && !outlineBefore.includes('answer-feedback--wrong'),",
"const outlineBefore = renderOutlineQuiz(westOutlineAsset, outlineSession, null);\nassert.ok(outlineBefore.includes('round-score'), 'Outlines Play shows the same live score contract as Flags and Locations.');\nassert.deepEqual(\n  [...outlineBefore.matchAll(/round-score__value\\\">([^<]*)/g)].map(([, value]) => value),\n  ['0', '1'],\n  'Outlines Play opens with the correct/left score and no artificial exemption.',\n);\nassert.ok(\n  !outlineBefore.includes('answer-feedback--correct') && !outlineBefore.includes('answer-feedback--wrong'),",
'outline verifier live score')
marker = '/* --- Round timing keeps rapid play viable --- */'
start = s.index(marker)
end = s.index('console.log(', start)
new_timing = '''/* --- Round timing keeps rapid play viable --- */\n\nconst timingSource = readFileSync(new URL('../.verify-dist/state/play-feedback-timing.js', import.meta.url), 'utf8');\nconst sharedCorrect = Number(/PLAY_FEEDBACK_DWELL_CORRECT_MS = (\\d+)/.exec(timingSource)?.[1]);\nconst sharedWrong = Number(/PLAY_FEEDBACK_DWELL_WRONG_MS = (\\d+)/.exec(timingSource)?.[1]);\nassert.ok(sharedCorrect >= 400 && sharedCorrect <= 900, 'Shared correct feedback has a readable but quick dwell.');\nassert.ok(sharedWrong > sharedCorrect && sharedWrong >= 1200, 'Shared wrong feedback gets longer to read than a correct answer.');\n\nfor (const [label, file] of [\n  ['Flags', 'flags-round.js'],\n  ['Locations', 'locations-round.js'],\n  ['Outlines', 'outlines-round.js'],\n]) {\n  const source = readFileSync(new URL(`../.verify-dist/state/${file}`, import.meta.url), 'utf8');\n  assert.ok(source.includes('playFeedbackDwellMs'), `${label} Play consumes the shared domain-neutral dwell policy.`);\n}\nconst flagsRoundSource = readFileSync(new URL('../.verify-dist/state/flags-round.js', import.meta.url), 'utf8');\nconst outlinesRoundSource = readFileSync(new URL('../.verify-dist/state/outlines-round.js', import.meta.url), 'utf8');\nassert.ok(flagsRoundSource.includes('advanceNow'), 'The Flags Play dwell can be skipped from the keyboard.');\nassert.ok(outlinesRoundSource.includes('advanceNow'), 'The Outlines Play dwell can be skipped from the keyboard.');\n\n'''
s = s[:start] + new_timing + s[end:]
write(p, s)

# Exact-production browser acceptance for feedback visibility, live score and reduced motion.
write('tests/browser/outlines-feedback-parity.spec.ts', r'''import { expect, test } from '@playwright/test';

async function openOutlinesPlay(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/outlines/africa/west-africa');
  await page.getByRole('button', { name: /Play West Africa/i }).click();
  await expect(page.locator('.outline-stage')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('.round-score')).toBeVisible();
}

test('Outlines Play keeps feedback readable and live score visible', async ({ page }) => {
  test.setTimeout(90_000);
  await openOutlinesPlay(page);
  const before = await page.locator('.quiz-count').innerText();
  await page.locator('.answer-button').first().click();
  const feedback = page.locator('.answer-feedback');
  await expect(feedback).toBeVisible();
  const wrong = await feedback.evaluate((node) => node.classList.contains('answer-feedback--wrong'));
  await page.waitForTimeout(wrong ? 1000 : 400);
  await expect(page.locator('.quiz-count')).toHaveText(before);
  await expect(feedback).toBeVisible();
  await expect(page.locator('.quiz-count')).not.toHaveText(before, { timeout: wrong ? 1400 : 900 });
});

test('Outlines Play feedback remains functional with reduced motion', async ({ page }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOutlinesPlay(page);
  await page.locator('.answer-button').first().click();
  await expect(page.locator('.answer-feedback')).toBeVisible();
  await expect(page.locator('.round-score')).toBeVisible();
});
''')

print('Applied #147 post-#137 feedback parity candidate.')

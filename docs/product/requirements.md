# Flag Atlas — Product Requirements Document

**Status:** MVP implementation baseline  
**Product:** Mobile-first world flag learning application  
**Core catalog:** 195 sovereign-state flags  
**Primary experience:** Learn and Test, organized by world → continent → region  
**Design benchmark:** Seterra's speed and geographic organization, with a stronger visual system and a persistent adaptive learning model.

## 1. Product thesis

Flag Atlas should make learning every national flag feel intrinsically satisfying. Engagement comes from quick recognition, visible knowledge growth, clean visual feedback, and progressively harder distinctions. The product deliberately avoids streaks, coins, lives, points economies, mascots, forced daily goals, and other engagement layers that do not improve learning.

The application maintains a durable model of what the learner knows. At any point it must be able to answer:

1. Which flags has this learner never been tested on?
2. Which flags are still being learned?
3. Which flags have been demonstrated as mastered?
4. Which flags should appear next?

Those answers must survive app restarts and must never depend on transient quiz UI state.

## 2. Vision decisions

### Experience

- Fast and direct like Seterra.
- Cleaner, more contemporary interface.
- Mobile-first touch targets and layout.
- Flags dominate the screen; chrome stays quiet.
- Progress is informative rather than gamified.
- A learner can begin useful practice in one or two taps.

### Learning control

Users choose between two primary intents:

- **Learn:** adaptive practice with immediate answer feedback.
- **Test:** a balanced sample from the chosen scope with answer correctness withheld until the round ends.

The default learner path is adaptive, while geographic scope remains fully user-controlled.

### Scope

MVP is flags only. Country-location maps, capitals, geography picking, outlines, and broader country knowledge are possible future modules and must not complicate the initial information architecture.

### Release priority

The first release optimizes for an excellent core loop:

**Choose scope → Learn/Test → Answer → Update knowledge model → Review results → Continue**

## 3. Goals

1. Teach recognition of all 195 core national flags.
2. Support learning at world, continent, and region level.
3. Persist every meaningful learning result.
4. Prioritize unseen and weak flags automatically in Learn mode.
5. Phase out established flags while retaining periodic checks.
6. Deliberately surface confusingly similar flags.
7. Keep answer positions genuinely balanced.
8. Make progress legible without turning the product into a dashboard.
9. Work well as an installable mobile web app today.
10. Keep the domain layer portable to Firebase-backed web or a future native shell.

## 4. Non-goals for MVP

- Streaks or daily goals.
- XP, coins, lives, energy, currencies, leaderboards, or rewards stores.
- Social network features.
- Multiplayer.
- Capitals, currencies, country outlines, maps, or population quizzes.
- Flag history or symbolism lessons.
- AI-generated explanations.
- User accounts or cloud synchronization.
- Territories and dependencies in the core denominator.

## 5. Core catalog

The default curriculum contains 195 sovereign states:

- 193 UN member states.
- Palestine.
- Vatican City / Holy See.

Core continent totals:

| Continent | Countries |
|---|---:|
| Africa | 54 |
| Asia | 48 |
| Europe | 44 |
| North America | 23 |
| South America | 12 |
| Oceania | 14 |
| **Total** | **195** |

Antarctica has no sovereign states and is excluded.

Territories, dependencies, and additional disputed/partially recognized states should be separate optional content packs later. The core denominator must not shift silently.

## 6. Geography taxonomy

Every core country belongs to exactly one continent and exactly one learning region. Search may surface aliases or transcontinental expectations later, but the curriculum must remain deterministic.

### Africa — 54

- North Africa — 6
- West Africa — 16
- Central Africa — 9
- East Africa — 18
- Southern Africa — 5

### Asia — 48

- Central Asia — 5
- East Asia — 5
- Southeast Asia — 11
- South Asia — 8
- West Asia — 19

### Europe — 44

- Northern Europe — 10
- Western Europe — 9
- Eastern Europe — 10
- Southern Europe — 15

### North America — 23

- Northern America — 2
- Central America — 8
- Caribbean — 13

### South America — 12

- Andean — 5
- Atlantic — 3
- Southern Cone — 4

### Oceania — 14

- Australia & New Zealand — 2
- Melanesia — 4
- Micronesia — 5
- Polynesia — 3

The country-level source of truth lives in `src/data/countries.ts`. Automated verification must fail if totals, ISO identifiers, or region assignments become inconsistent.

## 7. Core learning state

The user-facing system has exactly three buckets.

### Unseen

The country has never appeared as the target of an answered question.

Display: `Unseen`

### Learning

The country has been tested but has not yet demonstrated stable recognition.

Display examples:

- `Learning 0/3`
- `Learning 1/3`
- `Learning 2/3`

### Mastered

The learner has satisfied the active mastery requirement across separate quiz rounds.

Display: `Mastered`

The simple bucket model is intentionally separate from the internal scheduler. Future adaptive research may change review timing or evidence weighting without changing the user-facing vocabulary.

## 8. Mastery v1

### First exposure

Correct:

`Unseen → Learning 1/3`

Incorrect:

`Unseen → Learning 0/3`

### Learning progression

A correct answer grants at most one mastery credit per quiz session.

`Learning 1/3 → Learning 2/3 → Mastered`

Three qualifying correct answers must occur in separate rounds. Repeating the same target twice in one session can never manufacture mastery.

### Learning error

An incorrect answer resets the active mastery streak to zero and records the selected wrong country as a confusion edge.

### Mastered retention

After mastery, the app schedules periodic checks. Initial v1 intervals:

- 2 days
- 7 days
- 21 days
- 60 days
- 180 days

Correct retention answers advance the next review interval.

### Mastered lapse

A wrong answer while Mastered returns the country to Learning and increments its lapse count. Previously mastered flags use a shorter two-correct recovery target in v1.

## 9. Adaptive mastery research track

The v1 heuristic is intentionally modular and should be treated as the first scheduler, not the final learning science model.

Before locking a long-term algorithm, research should compare:

- retrieval-practice evidence;
- spacing-effect evidence;
- desirable difficulty and interference;
- Leitner-style systems;
- SM-2 lineage;
- FSRS-style memory-state scheduling;
- whether response latency adds predictive value after accuracy and recency;
- whether explicit confidence improves or merely burdens the interaction;
- how visually similar distractors affect durable recognition;
- how quickly a mastered lapse should be relearned.

### Research questions

1. Should mastery require a fixed count or a predicted recall probability threshold?
2. Should an extremely slow correct answer count equally toward mastery?
3. Should Test-mode answers carry more evidentiary weight than Learn-mode answers because feedback is withheld?
4. How much inter-session spacing is required before two successes should count as independent evidence?
5. Should mastery be scope-independent? Current requirement: yes. Senegal is either known or not known regardless of whether it was learned in West Africa or World mode.
6. What target recall probability best balances progress speed and retention?
7. When a user repeatedly confuses two flags, should those flags be paired immediately or after a short delay?

### Architectural requirement

The scheduler must implement a narrow domain interface so a future algorithm can replace v1 without changing screens, storage semantics, or curriculum data.

## 10. Learn mode

Purpose: build recognition efficiently.

### New scope behavior

If the chosen scope contains Unseen countries, Learn mode prioritizes first exposure. The learner should see all flags in the scope before ordinary review dominates.

### Post-exposure behavior

Once Unseen reaches zero, a 10-question Learn session should target roughly:

- 70% Learning.
- 20% due Mastered retention.
- 10% challenge/other retention.

Unused category slots are redistributed.

### Priority inside Learning

Selection weight increases for:

1. Most recently missed flags.
2. Repeatedly missed flags.
3. Low lifetime accuracy.
4. Known confusion pairs.
5. Due reviews.
6. Slow correct recognition.
7. Flags near the current mastery threshold.

Immediate feedback is shown after each answer.

## 11. Test mode

Purpose: measure a scope cleanly.

Requirements:

- User chooses the geographic scope.
- Questions sample across that scope rather than concentrating only on weak items.
- Correctness is not revealed during the round.
- Final results show score, missed flags, selected wrong answers, and learning-state changes.
- Test answers update the knowledge model because they are valid evidence of recognition.

Future research may assign different evidence weights to Learn and Test answers while retaining one unified progress ledger.

## 12. Quiz construction

Default round: 10 questions.

Possible later lengths: 5, 20, Endless.

### Target constraints

- Target must belong to the selected scope.
- Standard rounds should not repeat a target.
- Review Mistakes may use a smaller target pool.

### Distractor hierarchy

Distractors should become educational rather than arbitrary.

Priority order:

1. User-specific confusion choices.
2. Curated known-similar flag cluster.
3. Same region.
4. Same continent.
5. Global fallback.

Examples of useful clusters:

- Mali / Guinea / Senegal / Cameroon.
- Chad / Romania.
- Indonesia / Monaco.
- Ireland / Côte d’Ivoire.
- Netherlands / Luxembourg.
- Colombia / Ecuador / Venezuela.
- Slovenia / Slovakia.
- Qatar / Bahrain.
- Australia / New Zealand.
- Republic of the Congo / Democratic Republic of the Congo.

## 13. Answer-position integrity

Correct-option placement must not form learnable patterns.

Requirements for each generated session:

- Four answer positions are approximately equally represented.
- Maximum count difference between positions is one.
- No correct position may occur three times consecutively.
- Session randomization is seeded for reproducible debugging.
- Correct position is generated independently of country identity.

This is a hard QA requirement, not a cosmetic feature.

## 14. Flag assets

Primary quiz presentation should use SVG flag assets rather than platform emoji.

MVP currently resolves ISO-2 codes to FlagCDN SVG assets and caches requested assets through the service worker. Before a fully offline production release, the 195 SVGs should be vendored or served from a controlled asset bucket so external availability is not part of the core learning path.

Requirements:

- Preserve flag aspect ratio.
- Never crop the flag.
- Do not use a surrounding UI color derived from the flag.
- Before answer submission, image alt text must not reveal the country name.
- Only the active quiz flag is eager/high-priority; ledger and result thumbnails lazy-load.

## 15. Navigation model

Primary hierarchy:

`World → Continent → Region`

### Home

Shows:

- World Mastered / Learning / Unseen totals.
- Learn World.
- Test World.
- Six continent index rows rather than a decorative card grid.
- Per-continent progress.
- Direct access to the full Progress ledger.

### Continent

Shows:

- Continent progress.
- Learn.
- Test.
- Region list with status.

### Region

Shows:

- Region progress.
- Learn.
- Test.
- Country-level ledger for that region.

### Learning Ledger

Shows the complete country state independent of quiz history presentation.

Filters:

- All.
- Unseen.
- Learning.
- Mastered.

Future filters:

- Due.
- Recently missed.
- Weakest.

## 16. Quiz screen UX

The flag is the dominant visual element.

Screen contains:

- Exit control.
- Scope label.
- Round progress.
- Learn/Test state.
- Flag image.
- Four large country options.

### Efficiency controls

- Number keys `1`–`4` select the matching answer.
- `Enter` advances after Learn-mode feedback.
- `Escape` exits the current quiz.
- Numeric shortcuts supplement normal button operation; they are never required.

### Learn answer behavior

Correct answer:

- Highlight correct choice.
- Show country name.
- Show current mastery state.
- User taps Next or presses Enter.

Incorrect answer:

- Highlight selected wrong option.
- Highlight correct option.
- Show correct country and current state.
- User taps Next or presses Enter.

### Test answer behavior

- Record choice.
- Do not reveal correctness.
- Advance quickly.

## 17. Results

Every round result should answer:

- How many were correct?
- Which flags were missed?
- Which answer was chosen for each miss?
- Which flags became Mastered?
- What can the learner do next?

Newly mastered flags should be named and shown when present. Mastery is the product-specific success moment; it may receive stronger emphasis than routine answers without becoming a reward economy.

Primary actions:

- Review Mistakes.
- Another Round.
- Back to Atlas.

No confetti, loot, streak extension, or unrelated reward surfaces.

## 18. Learning ledger requirements

For every country persist at minimum:

- current status;
- mastery streak;
- lifetime correct;
- lifetime incorrect;
- current correct streak;
- lapse count;
- retention level;
- first seen time;
- last seen time;
- last correct time;
- last incorrect time;
- mastery time;
- next scheduled review;
- average response time;
- wrong-country confusion counts;
- last session that granted mastery credit.

Every attempt should preserve:

- session;
- target country;
- selected country;
- correctness;
- response time;
- timestamp;
- status before and after;
- mastery streak before and after.

## 19. Visual design system

The shipped source of truth is `/DESIGN.md`. The core thesis is **the flag is the color system**: flags provide the visual richness while product chrome stays precise and quiet.

### Character

- Modern atlas index / international identification desk.
- Operate-first: fast, scan-friendly, predictable, and touch-friendly.
- Cool neutral canvas and white working surfaces.
- Graphite text with registration blue reserved for primary actions, selection, focus, and round progress.
- Flat ruled lists and proximity instead of repetitive rounded content cards.
- Minimal elevation; a subtle border/shadow is allowed on flag images so white flags remain legible.
- Flag colors remain visually dominant.

### Explicit anti-patterns

- No warm-paper + display-serif editorial treatment in the operational product.
- No decorative world-map/grid texture.
- No continent/card bento as the default page scaffold.
- No ornamental label/eyebrow above every heading.
- No glass, gradient text, decorative glow, or reward-style chrome.
- No emoji or text glyphs as interface icons when the shared SVG icon primitive can express the action.

### Interaction principles

- Touch targets at least 44px.
- Primary actions large enough for one-handed mobile use.
- Minimal modal behavior.
- Routine motion approximately 100–220ms and tied to state.
- Reduced-motion support without hiding state changes.
- Hover styling only where hover and a fine pointer exist.
- Mobile safe-area insets respected.
- Short landscape receives structural adaptation rather than simple scale reduction.
- No hidden swipe-only controls.

### Typography

Use one fixed-role system sans-serif stack across headings, controls, metadata, and data. Product hierarchy comes from size, weight, spacing, and tone. Comparable progress numerals use tabular figures. Do not introduce a display serif or monospace-as-costume into the core product UI.

## 20. Accessibility

- Keyboard-operable controls.
- Visible focus states.
- Sufficient text/control contrast.
- Status communicated with text as well as color.
- Reduced-motion media query.
- Forced-colors fallback consideration.
- Dynamic mobile viewport and safe-area support.
- Generic `Flag to identify` alt text before answer reveal.
- Country-specific alt text after reveal.
- Responsive structure supports portrait and short-landscape quiz use.

## 21. Persistence and offline strategy

MVP is local-first.

- Progress stored locally.
- Attempts stored locally with a bounded history.
- No sign-in required.
- Service worker caches app shell and fetched flag assets.
- Core UI should remain usable after install even if connectivity is intermittent.

A future Firebase adapter may add authenticated synchronization while retaining local-first behavior.

## 22. Technical architecture requirements

The application is divided into:

- `data` — static countries, regions, confusion seeds.
- `domain` — mastery and quiz algorithms.
- `infrastructure` — persistence and asset providers.
- `state` — application orchestration.
- `ui` — render-only components/views.

UI code must not own mastery rules. Storage code must not decide what gets tested next. Country data must not be embedded in screen components. Shared interface icons, progress presentation, and flag rendering belong in reusable UI components rather than repeated view markup.

See [`../architecture/overview.md`](../architecture/overview.md) for implementation details.

## 23. Deployment path

### MVP

GitHub Pages through GitHub Actions.

### Later

Firebase Hosting can replace the hosting target without changing app architecture.

Potential later Firebase services:

- Authentication.
- Firestore progress synchronization.
- Remote Config for scheduler experiments.
- Analytics / experiment instrumentation.

No Firebase dependency should be introduced until a concrete cloud feature requires it.

## 24. Analytics plan

Local MVP does not require telemetry.

If analytics are added later, relevant product events include:

- session started/completed;
- question answered;
- country first seen;
- country mastered;
- mastery lost;
- region first pass completed;
- continent first pass completed;
- region mastered;
- continent mastered.

Useful product metrics:

- first-pass completion rate;
- sessions to mastery;
- retention-check accuracy;
- lapse rate after mastery;
- percentage of errors concentrated in confusion pairs;
- return-to-mastery time after a lapse.

## 25. Acceptance criteria

### Curriculum integrity

- Exactly 195 core countries.
- Unique ISO-3 identifier per country.
- Every country assigned to one valid continent.
- Every country assigned to one valid region in that continent.
- Region totals sum to continent totals.
- Continent totals sum to 195.

### Quiz integrity

- Exactly one correct answer.
- Four unique answer options.
- Target belongs to selected scope.
- No repeated standard target within a round.
- Correct answer positions balanced within ±1.
- No three-position correct-answer run.

### Learning integrity

- First answered exposure removes Unseen status.
- Correct and incorrect answers persist immediately.
- A country can earn at most one mastery credit per session.
- Mastery requires successes across separate sessions.
- Mastered errors return the country to Learning.
- Confusion choice is persisted on every wrong answer.
- Restarting the app preserves state.

### UX integrity

- Home provides Learn and Test without opening settings.
- A continent can be reached in one tap from Home.
- A region can be reached in one additional tap.
- Flag description is never shown before an answer.
- Test mode does not reveal correctness during the round.
- Every quiz answer is reachable by touch, keyboard tab navigation, and optional `1`–`4` shortcut.
- Exiting World returns Home; exiting continent/region practice returns to that selected scope.

## 26. MVP implementation checklist

- [x] 195-country data catalog.
- [x] Continent and region taxonomy.
- [x] Unseen / Learning / Mastered ledger.
- [x] Three-session initial mastery rule.
- [x] Two-success recovery after mastered lapse.
- [x] Retention interval hooks.
- [x] Learn mode.
- [x] Test mode.
- [x] First-pass prioritization.
- [x] Adaptive learning priority heuristic.
- [x] Confusion graph capture.
- [x] Similarity-aware distractors.
- [x] Balanced correct-answer positions.
- [x] Results and mistake review.
- [x] Local persistence.
- [x] Mobile-first PWA shell.
- [x] GitHub Pages workflow.
- [x] Impeccable visual-system review and Atlas Index redesign.
- [x] Shared SVG UI icon primitive and keyboard quiz accelerators.
- [x] Lazy-load noncritical flag thumbnails.
- [ ] Vendor all 195 SVG assets for guaranteed offline use.
- [ ] Deep adaptive-mastery literature review and v2 scheduler proposal.
- [ ] Production accessibility audit.
- [ ] Cross-browser/device QA.

## 27. Future product directions

Only after the flag loop is strong:

1. Country picker / map-location mode.
2. Country outlines.
3. Capitals.
4. Custom study sets.
5. Hard similarity-only mode.
6. Reverse mode: country name → choose flag.
7. Typed answer Expert mode.
8. Cloud synchronization.
9. Territories/dependencies pack.
10. Historical flag packs.

## 28. Product benchmark note

Seterra demonstrates the value of fast, scope-specific geography quizzes and already separates content by geography and quiz type. Flag Atlas keeps that immediacy while making durable knowledge state, adaptive scheduling, confusion-aware practice, and a cleaner mobile interface central to the product rather than treating each quiz as an isolated score event.

Reference benchmark pages:

- https://www.geoguessr.com/quiz/seterra
- https://www.geoguessr.com/fl/2022

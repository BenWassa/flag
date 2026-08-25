# Atlas Product

**Status:** Atlas v1.0 production truth  
**Product:** mobile-first geography-learning PWA  
**Learner-facing language:** modern British English (`en-GB`)

## Product purpose

Atlas teaches world geography through direct retrieval and geographic context across four peer learning domains:

- **Flags** — identify countries from national flags;
- **Locations** — identify countries by geographic position;
- **Outlines** — identify countries by silhouette;
- **Neighbours** — identify complete direct land-border neighbour sets.

Atlas should remain fast, low-friction and information-first. Geography is usually the dominant visual object. Progress and prestige should clarify learning rather than create an activity economy: no XP, coins, lives, reward shop, fantasy rank ladder or routine celebration layer.

The product is deliberately mobile-first, progressively disclosed and minimally gamified. Meaningful learning matters more than interaction volume.

## Current production information architecture

Navigation is **mode-first**:

`Home → learning domain → continent → Play scope`

Home contains the four domain choices and starts no round. A domain index shows all six continents. Supported continents open their continent launcher; unsupported continents remain honest inert shells.

Inside a supported continent launcher:

- the whole-continent row starts **Play** for the continent;
- each region row starts **Play** for that region;
- a subordinate **Learn {Continent}** action starts Learn for the whole continent;
- there is no select-region-then-Play intermediate state in the ordinary v1 UI.

Flags additionally exposes deliberate World Play/Learn actions because the complete 195-country flag curriculum exists globally.

Typed hash routes own durable navigation state. Active round order, current question, guesses, timers and result objects remain ephemeral session state. Browser Back/Forward remains first-class behaviour; a hard refresh of an activity route falls back to that activity's stable scope.

## Learn and Play

### Learn

Learn is for familiarisation and corrective learning. It is domain-appropriate rather than a slower copy of Play.

**Flags Learn** is a browse-and-reveal gallery for the complete selected scope. Names are hidden until individually revealed or revealed together. Reveal state is ephemeral. Browsing or revealing flags writes **no** country learning evidence.

**Locations Learn** is guided map retrieval. Learners can retry; first-try, after-miss and revealed outcomes remain distinct. Genuine unassisted retrieval can contribute country learning evidence; assisted/revealed outcomes are recorded with weaker semantics.

**Outlines Learn** is multiple-choice silhouette retrieval with immediate correctness feedback. Genuine clean retrieval contributes learning evidence; wrong answers provide contradictory evidence.

**Neighbours Learn** asks the learner to build the complete land-neighbour set for each target. Clean completion, assisted completion and exhausted/revealed outcomes remain distinct evidence qualities.

### Play

Play is scored retrieval/assessment. The stable internal activity identifier remains `test` for compatibility.

Play gives correctness/result feedback without changing the evidence or achievement rule in presentation code. Each domain keeps its native task semantics:

- Flags and Outlines score recognition questions;
- Locations gives one scored map tap per target;
- Neighbours scores clean completion of the entire required neighbour set for a target.

Results offer repeat and mistake review where applicable.

## Country-level learning evidence

Country records are the live learning/scheduling layer. They answer operational questions such as:

- has this country been encountered or retrieved correctly?;
- is the evidence still weak?;
- is there strong evidence?;
- has contradictory evidence caused a lapse?;
- is review due where the domain supports due dates?;
- what confusion or miss history should influence future practice?

Country evidence is **not** learner-facing prestige. Internal compatibility state may still use `unseen`, `learning` and `mastered`; routine product copy presents learning evidence rather than calling an individual country a Mastered achievement.

The ordinary blue progress strip represents countries with at least one successful retrieval. It is intentionally separate from durable Mastery.

## Perfect round

A **Perfect round** is transient feedback for one Play result with no misses under that domain's native scoring rules.

It is shown on Results and does not persist as an achievement. A single perfect round is not Mastery.

Perfect-round feedback can occur at continent, region or World scope where that Play route exists. Only region-scoped Play results participate in the current region × domain Mastery streak logic.

## Learner-facing Mastery

The first durable prestige unit is **region × domain Mastery**: for example, Flags of West Africa or Locations of Central Asia.

Purple is reserved for this durable competency state. Country-level evidence does not independently promote a country into learner-facing Mastery.

### Current v1.0 qualification behaviour

The achievement engine currently awards region × domain Mastery after **two consecutive perfect region-scoped Play results** for that region and domain. A non-perfect region-scoped Play result resets the in-progress streak; an already-earned Mastery is not revoked.

There is a known v1.0 qualification-integrity defect: ordinary region Play is full-scope in Locations, but Flags, Outlines and Neighbours currently default to 10 targets. The achievement recorder does not yet verify that those results covered every eligible target in the region. Therefore a region containing more than 10 eligible targets can currently earn Mastery in those three domains after two perfect 10-target region Play rounds.

The locked product rule is stricter: Mastery should require two consecutive perfect **complete-region** Play results. Issue **#108** owns closing the implementation gap. Until #108 ships, documentation and tests must not describe complete-region coverage as already enforced in all four domains.

## Completion hierarchy

### Complete region

A region is complete only when:

1. that learner-facing region has genuine, non-empty curriculum in **all four** domains; and
2. all four region × domain Masteries have been earned.

Unsupported geography never counts as automatically complete.

The shipped presentation is deliberately restrained: the region row keeps its useful target/country count and progress strip, earned domain Mastery remains visibly purple, and a complete region gains a gold completion treatment. There is no separate region badge, shield or Crown.

### Complete continent

A continent is complete only when every learner-facing region required by that continent has genuine four-domain curriculum and every one of those regions is complete.

The achievement state is persisted independently. In production, a completed continent is surfaced on the **domain continent index** by replacing its ordinary geography silhouette with the continent trophy/crest artwork and applying the completion row treatment.

The repository contains trophy artwork for all six continents. Those assets are not merely dormant files: the completed-continent row renders them through the React presentation layer.

There is no separate full-screen continent trophy ceremony in v1.0.

### World completion

World completion is the highest and final prestige tier. The persisted achievement model contains a `worldCrown` state and exposes it through the achievement read model.

The Crown cannot currently be earned because complete four-domain curriculum does not yet exist for every continent. North America and Oceania remain incomplete. There is also **no current React learner-facing World Crown renderer or ceremony**. The Crown remains the reserved eventual presentation for genuine world completion; do not invent a tier above it.

## Persistence and reset

The four domain learning ledgers persist independently. Earned achievements and in-progress region-perfect-run streaks persist in separate versioned local-storage namespaces.

Current earned Mastery/completion is monotonic: once awarded, later lapses or non-perfect rounds do not revoke it. Live country evidence may weaken or become due independently.

Infrastructure helpers exist to clear achievement/streak storage, but the current React product exposes **no learner-facing full progress/achievement reset control**. The retired Progress screen's reset utility is not part of v1.0 production UI. Clearing browser/site data can of course remove local state; a future coordinated in-product reset would need to reset all relevant ledgers and achievement/streak state together.

No new reset feature is committed by this document.

## Where progress appears now

The dedicated **Progress** screen has been retired. Atlas does not currently promise a replacement dashboard.

Progress is distributed into the learning flow:

- Home shows concise per-domain evidence progress;
- domain continent indexes show supported coverage/progress and completed-continent trophy state;
- continent launchers show whole-continent and region progress strips;
- region rows show earned Mastery and complete-region treatment;
- Results show round performance, including transient Perfect round feedback.

The richer cross-domain Progress composition from the former screen is historical, not an active future requirement.

## Current geography coverage

| Domain | Production-ready coverage |
| --- | --- |
| Flags | full 195-country curriculum; World, all six continents and learner-facing regions |
| Locations | Africa, South America, Europe and Asia, plus their supported learner-facing regions |
| Outlines | Africa, South America, Europe and Asia, plus their supported learner-facing regions |
| Neighbours | Africa, South America, Europe and Asia, with only targets whose complete canonical land-neighbour set is representable |

**North America (#22)** and **Oceania (#27)** remain open geography expansion work for Locations, Outlines and Neighbours. Their continent rows may appear as honest unavailable shells, but unsupported geography is not Play/Learn-ready and cannot qualify for Mastery/completion.

Flags remains globally available independently of those geography gaps.

## Locked product and design constraints

- canonical country identity is ISO3;
- product copy uses British English: **Neighbours, colour, centre, behaviour, practise** as the verb;
- stable internal identifiers such as `neighbors`, `/neighbors`, `test` and existing storage keys remain unchanged for compatibility;
- one canonical Natural Earth 1:10m production topology pipeline owns geography used by Locations, Outlines and Neighbours;
- no handwritten country geometry, second topology source or handwritten neighbour table;
- geography identity comes from geography itself, not a continent/region colour taxonomy;
- Atlas Blue is ordinary action, green correct, red wrong, purple durable Mastery and gold scarce prestige/completion;
- state cannot rely on colour alone;
- geography should normally be the richest visual object;
- no glassmorphism, bento dashboard treatment or decorative UI overload;
- tactile depth is allowed, but the interface should not become toy-like or bounce-heavy.

See `DESIGN.md`, `docs/product/colour-system.md`, `docs/product/learning-and-mastery.md` and `docs/architecture/earned-achievements.md` for the durable implementation boundaries.

## Deliberately deferred or optional

- **#104** is a deferred product exploration of a map-first continent launcher. It is not scheduled and would require a deliberate reversal or refinement of current colour/accessibility rules before implementation.
- a dedicated achievement milestone queue/ceremony is optional product/design work, not current v1 behaviour;
- a new Progress dashboard is not currently promised;
- World Crown learner-facing artwork/surface remains deferred until genuine world completion is achievable and a focused design decision is made;
- country-evidence decay/revalidation must remain separate from already-earned prestige unless a future product decision explicitly changes that rule.

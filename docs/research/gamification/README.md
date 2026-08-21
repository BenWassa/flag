# Gamification Research Archive

> **Archive, not current product truth.** Accepted decisions now live in [`docs/product/gamification.md`](../../product/gamification.md), [`docs/product/learning-and-mastery.md`](../../product/learning-and-mastery.md), and [`DESIGN.md`](../../../DESIGN.md).

This folder preserves the reasoning and original design artifact that led to Atlas's gamification hierarchy. The work was exploratory: it tested how to make progress feel valuable without turning ordinary learning into a reward economy.

## Core reasoning

### Reward meaningful learning, not interaction volume

The central principle was that prestige should follow demonstrated knowledge rather than taps, rounds played, or activity volume. Scarcity was treated as part of the design: the more prestigious a visual signal, the less often it should appear.

This led to rejecting XP, coins, arbitrary streak rewards, fantasy rank ladders, routine confetti, and large numbers of cheap badges or crowns. Ordinary interaction can still feel tactile and satisfying; reward ceremony is reserved for meaningful milestones.

### Separate transient feedback from durable competence

Correctness and achievement serve different jobs.

- **Green** = correct, immediate and transient.
- **Red** = wrong/error, immediate and transient.
- **Purple** = durable mastery/competence.
- **Gold** = scarce completeness/prestige.
- **Atlas Blue** = ordinary action/navigation, not achievement.

This prevents the colour used for a correct answer from also becoming the permanent mastery language.

### Country-level “mastery” was too small

The discussion initially considered country-level mastery treatment, then rejected it as inflated. Knowing one flag, one outline, one location, or one neighbour set is useful learning evidence, but it is too small a body of knowledge to carry a prestigious learner-facing mastery label.

Country therefore remains the underlying evidence unit rather than a prestige tier.

### Region × domain became the first meaningful mastery unit

The first coherent learner-facing mastery unit is one complete domain across a region:

- Flags;
- Outlines;
- Locations;
- Neighbours.

The selected visual direction was **Option B — Clean Icons**: compact domain icons in region lists, with richer icon-on-shield treatment available in dedicated/expanded region contexts. Shield-within-shield treatments were rejected as visually muddy.

The icon family explored was:

- flag icon for Flags;
- country-outline icon for Outlines;
- map-pin / POI icon for Locations;
- adjacency/shared-border icon for Neighbours.

### Qualification vs rank was a useful information-architecture analogy

Military systems were considered only as an information-architecture reference, **not** as an aesthetic direction. The useful distinction was between qualification badges (evidence of a specific competency) and higher-order rank/status signals.

That analogy helped separate regional domain competence from rarer aggregate achievements instead of making every completed object look equally prestigious.

### Game precedents reinforced scarcity

Game systems were reviewed for the same distinction: small achievements can proliferate until prestige symbols become cheap. Duolingo's historical crown system, console trophy hierarchies, and completion rewards in games were discussed as examples of why the strongest symbol should sit above routine progress rather than be attached to every small unit.

The design therefore stopped at a short hierarchy:

1. region × domain mastery — purple competency mark;
2. complete region — restrained gold accent only;
3. complete continent — continent silhouette crest;
4. complete world — singular Crown.

A separate region medal/emblem was rejected. Crowns were deliberately not proliferated across regions or ordinary learning objects.

### Earned state and celebration intensity

The working direction was that earned mastery/completion remains earned for now. Revalidation, decay, or later loss of achievement was explicitly deferred as a deeper learning-model question.

Interaction intensity was kept asymmetric:

- ordinary interaction — tactile/responsive;
- correct/wrong — crisp semantic feedback;
- rare mastery/completion — stronger but restrained celebration.

Constant celebration was rejected because it would reduce the perceived value of the rare milestones.

## Original artifact

[`gamification-design-brief.md`](gamification-design-brief.md) preserves the final Markdown brief produced in the design conversation, with only a short archival rename note added.

## References

The following sources were consulted during the discussion. They are preserved as research provenance, not as normative product requirements.

- Achievement difficulty / quantity and motivation: https://www.sciencedirect.com/science/article/pii/S074756321930086X
- Colour and performance-context research discussed for red: https://pubmed.ncbi.nlm.nih.gov/23808916/
- Cross-cultural colour/emotion associations: https://pubmed.ncbi.nlm.nih.gov/36462095/
- Additional colour/emotion evidence discussed for green and related associations: https://pubmed.ncbi.nlm.nih.gov/39806242/
- Colour complexity/status research discussed in relation to restrained prestige styling: https://academic.oup.com/jcr/article/52/6/1232/8120421
- “Juicy” interaction / feedback research discussed for responsiveness versus over-amplification: https://nickballou.com/publication/2024-kao-et-al-juicy/
- Gamification and learning-design review discussed for competence/autonomy versus superficial reward mechanics: https://link.springer.com/article/10.1007/s11423-023-10337-7
- U.S. Army talent/qualification material used only as a qualification-vs-rank information-architecture analogy: https://www.army.mil/ATLP
- Duolingo home-screen/crown-system redesign precedent: https://blog.duolingo.com/new-duolingo-home-screen-design/
- Nintendo completion-reward precedent discussed in chat: https://www.nintendo.com/en-gb/News/2008/Set-your-gaming-goals-for-2008-250805.html
- PlayStation trophy hierarchy precedent discussed in chat: https://blog.playstation.com/2020/10/07/upcoming-trophy-levelling-changes-detailed/comment-page-3/

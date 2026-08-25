# Atlas Colour System

**Status:** locked v1 semantic palette

Atlas uses one restrained semantic colour system across all learning domains. Geography does not receive an identity palette by continent, region or hemisphere.

## Locked semantic roles

| Role | Value | Use |
| --- | --- | --- |
| Canvas | `#F6F8FB` | cool near-white page ground |
| Primary text | `#101318` | graphite text / strongest neutral |
| Atlas Blue | `#2563EB` | ordinary action, selection, focus family, ordinary progress |
| Pressed blue | `#1749B8` | tactile pressed/depth state |
| Action tint | `#EAF0FF` | quiet action/selected background |
| Correct | `#137A55` | correct retrieval feedback |
| Wrong | `#B42318` | incorrect retrieval feedback |
| Mastery | `#6D3FC0` | durable region × domain Mastery |
| Prestige | `#E0AF2F` | scarce completion / prestige |

## Rules

### Blue is ordinary

Atlas Blue is the workhorse colour. Use it for primary action, focus/selection family and the ordinary successful-retrieval progress strip. Blue must not be mistaken for prestige.

### Green and red are feedback

Green means correct and red means wrong. They should not become continent/region identity colours or long-lived decorative fills.

Domain-specific corrective mechanics may retain established intermediate/reveal treatments where they communicate outcome quality, but those colours do not create new product-level achievement tiers.

### Purple is durable Mastery

Purple is reserved for learner-facing **region × domain Mastery**. Country-level learning evidence may be strong internally or operationally, but individual countries do not become purple prestige objects merely because their evidence is strong.

Purple state must include a non-colour cue such as the current Mastered mark/accessible label.

### Gold is scarce

Gold is reserved for genuine prestige/completion:

- transient Perfect round result treatment;
- complete-region treatment;
- completed-continent trophy/crest treatment;
- eventual World Crown presentation.

Gold should not appear as a routine progress fill, common button colour or geographic identity theme.

### Colour is not sufficient by itself

State must remain understandable without colour. Pair semantic colour with label, icon/mark, geometry, border/treatment, accessible name or another perceivable cue appropriate to the component.

## Geography has no identity palette

Locked decision:

- no continent colour taxonomy;
- no region colour taxonomy;
- no hemisphere theming;
- do not derive UI identity colours from flag-colour distributions;
- geography identity comes from shape, name, hierarchy and context.

Issue #104 deliberately remains a deferred exploration because its map-first proposal includes region tinting and geography-encoded progress. Any future implementation must explicitly revisit this locked decision and provide a non-colour progress cue; the current colour system must not be silently weakened as a side effect of a launcher redesign.

## Achievement interaction

The current visual hierarchy is:

`ordinary blue progress → purple Mastery → restrained gold completion → continent trophy/crest → World Crown`

A Perfect round is a one-result gold acknowledgement, not a persistent Mastery state. Completed-continent trophy assets are currently rendered on completed rows in domain continent indexes. The World Crown state exists in the achievement model but has no learner-facing React renderer in v1.

## Accessibility

- preserve sufficient text/control contrast;
- keep visible focus independent of hover;
- support forced-colour/high-contrast fallbacks where applicable;
- never remove the text/icon cue solely because a colour treatment exists;
- avoid saturation/density as the only encoding of progress.

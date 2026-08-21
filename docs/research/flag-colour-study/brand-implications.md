# Atlas Colour Study — Findings & Brand Implications

> Archival transcription of the condensed final report from the Flag Atlas colour-study conversation. Current product truth belongs in `docs/product/colour-system.md`, `PRODUCT.md` and `DESIGN.md`.

## Executive summary

The study supports a clear core colour system for Atlas:

- **Blue** should be the primary brand/action colour.
- **Green** should remain reserved for correct/positive feedback.
- **Red** should remain reserved for wrong/error feedback.
- **Purple** should represent mastery.
- **Gold** should be used sparingly as a premium mastery/completeness accent.
- The surrounding interface should stay **cool, neutral and restrained** so flags and geography remain visually dominant.

The key conclusion is not that blue is the most common flag colour. It is that **blue is the strongest major flag-derived colour family that remains semantically available**.

## Global flag-colour findings

Across the 195-country curriculum, with every country contributing equal aggregate weight:

| Colour family | Approx. share of total flag area |
| --- | ---: |
| Red | **30.8%** |
| Blue + cyan | **20.5%** |
| White / near-white | **16.2%** |
| Green | **15.3%** |
| Yellow / gold | **9.8%** |
| Grey | 3.3% |
| Black / near-black | 2.3% |
| Orange | 1.8% |
| Purple | **0.1%** |

### Main observations

1. **Red is the dominant colour family globally.**
2. **Blue is the second-largest major family.**
3. **Green is also highly prevalent.**
4. **Yellow/gold is familiar but materially less dominant.**
5. **Purple is exceptionally rare in national flags.**

The broad ordering matters more to the product decision than the final decimal place.

## Why blue was selected

### Red

Red is the largest flag family at roughly **31%**.

It is highly representative of national flags, but Atlas already needs red to mean:

- wrong answer;
- error;
- destructive or warning state where appropriate.

Using red for both brand and error would weaken semantic clarity.

### Green

Green accounts for roughly **15%** of flag area.

It is also highly flag-native, but Atlas needs green to mean:

- correct answer;
- confirmation;
- positive immediate feedback.

Using green as the brand family would blur ordinary actions with success states.

### Blue

Blue and related cyan tones account for roughly **21%** of global flag area.

Unlike red and green, blue remains semantically free.

It can therefore consistently mean:

> **act / explore / select / continue**

That makes blue the strongest flag-derived family for:

- primary actions;
- selection;
- navigation emphasis;
- focus;
- active controls;
- exploration and progression through an interaction.

## Recommended core palette

| Role | Token | Recommended colour |
| --- | --- | --- |
| Primary action | `action` | **`#2563EB`** |
| Pressed / physical depth | `action-pressed` | **`#1749B8`** |
| Action tint / selected surface | `action-soft` | **`#EAF0FF`** |
| Canvas | `canvas` | **`#F6F8FB`** |
| Primary text | `text` | **`#101318`** |
| Correct | `correct` | **`#137A55`** |
| Wrong | `wrong` | **`#B42318`** |
| Mastery | `mastery` | **`#6D3FC0`** |
| Prestige / completeness | `prestige` | **`#E0AF2F`** |

## Why Atlas Blue is not the literal measured blue

The measured representative of the flag-blue family was approximately:

**`#3A5CA2`**

That colour describes the data well but is comparatively subdued for a tactile primary control.

Atlas Blue is:

**`#2563EB`**

The UI token stays in essentially the same hue family while increasing lightness and chroma for:

- clearer affordance;
- stronger tactile presence;
- better distinction from the neutral shell;
- a more energetic learning experience.

The design rule is:

> **derive the family from evidence; tune the UI token for usability.**

## Semantic colour model

### Blue = action

Use for:

- primary buttons;
- selected states;
- navigation emphasis;
- focus;
- active controls;
- progression through ordinary interactions.

Blue should not imply correctness or mastery.

### Green = correct

Use for:

- correct answers;
- immediate positive task feedback;
- confirmation where the meaning is genuinely success.

Avoid general decorative green or green navigation chrome.

### Red = wrong

Use for:

- incorrect answers;
- errors;
- genuine destructive states where appropriate.

Avoid routine decorative red so the state remains immediately legible.

### Purple = mastery

Purple is especially useful because it is almost absent from ordinary national-flag imagery.

At roughly **0.1%** of measured flag area, it naturally looks unusual within Atlas.

That makes it well suited to a durable mastery state without competing with:

- ordinary actions;
- correct feedback;
- wrong feedback;
- normal flag imagery.

### Gold = exceptional mastery / completeness

Gold should not become another routine status colour.

Use it sparingly for things such as:

- crowns;
- complete regions or higher-order completion treatment;
- prestige highlights;
- exceptional achievement details.

Purple carries the mastery semantics. Gold adds scarcity and value.

## Accessibility figures

Reference contrast checks from the study:

| Combination | Approx. contrast | Result |
| --- | ---: | --- |
| White on `#2563EB` | 5.17:1 | AA |
| White on `#1749B8` | 7.83:1 | AAA |
| White on `#137A55` | 5.33:1 | AA |
| White on `#B42318` | 6.57:1 | AA |
| White on `#6D3FC0` | 6.73:1 | AA |
| Dark text on `#E0AF2F` | 9.17:1 | AAA |
| White on `#E0AF2F` | 2.03:1 | insufficient for normal text |

White text should therefore not be the default on mastery gold.

Semantic states must also remain identifiable through wording, icons/marks, borders/state treatment, layout or other non-colour cues.

## Geographic implications

### Continents

The exploratory study found genuine differences in flag-colour prevalence between continents, including:

- comparatively more green in Africa;
- strong red presence in Asia and Europe;
- comparatively more blue in North America and especially Oceania;
- a comparatively high yellow/gold share in South America, although red remained the largest of the tracked major families there.

These are interesting descriptive findings, not a strong reason to build separate semantic palettes.

**Recommendation: do not colour-code continents from this study.**

If continent accents are ever explored, they should remain secondary, subtle and evidence-tested rather than replacing the global semantic system.

### Regions

Region-level differences were less reliable because many of the repository's 24 learning regions contain only a small number of countries.

A 24-region colour taxonomy would likely:

- overstate noisy differences;
- create visual clutter;
- compete with correct/wrong/mastery semantics;
- teach arbitrary colour associations rather than geography.

**Recommendation: do not theme learning regions by flag colour.**

Region identity should come from geography, maps, naming, grouping and progression.

### Hemispheres

Northern/Southern and Eastern/Western comparisons showed modest differences, such as somewhat more blue in the Southern group and somewhat more blue/yellow in the Western group.

These patterns largely reflect continent composition and are not a useful UI system.

**Recommendation: treat hemisphere analysis as exploratory only.**

## Brand implications

### 1. Atlas can have a stronger identity without making the whole interface more colourful

The brand does not need many decorative hues.

A strong system can consist of:

- neutral canvas;
- graphite typography;
- one clear action blue;
- tightly controlled semantic colours.

This keeps flags and maps as the richest visual objects.

### 2. Tactility can come from depth rather than additional colour roles

A more tactile Atlas interface does not require a larger palette.

Physicality can come from:

- brighter blue top surfaces;
- darker blue pressed/depth states;
- disciplined radii;
- state transitions;
- subtle transform/scale motion;
- spacing and hierarchy.

The colour semantics can remain strict.

### 3. Mastery can carry most of the expressive personality

Routine navigation should stay relatively quiet.

Mastery is where the product can afford more character through:

- purple;
- crown imagery;
- restrained gold;
- stronger depth or special transition treatment.

This creates hierarchy without turning every tap into a reward event.

### 4. Gold becomes more valuable when it is genuinely scarce

If gold appears on ordinary buttons, progress, navigation and miscellaneous accents, it will stop feeling special.

Reserve it for genuinely high-value mastery/completeness moments.

### 5. The brand system should be global rather than geographically themed

The evidence supports deriving the **core palette from the aggregate visual vocabulary of world flags**.

It does not support assigning a separate colour identity to every geographic scope.

A universal action/semantic system is clearer and more coherent.

## Recommended brand rule

> **Atlas uses a restrained neutral interface around the colours of the world. Blue drives exploration and action; green confirms correctness; red communicates mistakes; purple signifies mastery; gold appears only when mastery deserves something exceptional.**

## Final recommendation

Adopt Atlas Blue `#2563EB` as the primary brand/action colour. Keep green and red strictly semantic. Make purple the main mastery colour and gold a deliberately scarce prestige/completeness accent.

Do not introduce continent, region or hemisphere colour theming from this research unless later product testing demonstrates a clear learning benefit.

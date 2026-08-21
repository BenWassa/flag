# Country naming policy

**Status:** active source-of-truth policy  
**Reviewed:** 2026-08-19  
**Scope:** English country display names, ISO identifiers, aliases, and rename-sensitive regression checks.

## Source hierarchy

Atlas should not invent or maintain country names from memory.

1. **UNGEGN World Geographical Names / UNTERM** — primary reference for current country names and article treatment. The UNGEGN country records expose English short/formal names and identify `UN terms` as their source.
2. **UN Statistics Division M49** — primary reference for M49 codes, ISO alpha-3 linkage, UN statistical-region membership, and the UN's current day-to-day English country/area naming table. M49 states that its names are based on UNTERM.
3. **Country government / foreign ministry** — secondary confirmation when normal English display treatment matters, especially articles or endonym styling.
4. **ISO 3166** — identifier compatibility reference. The app continues to use ISO3 as the stable `Country.id`.

Official references:

- UNGEGN country dashboard: https://ungegn.un.org/dashboard/countries/index
- UN M49: https://unstats.un.org/unsd/methodology/m49/

## Display-name rule

The product teaches recognisable country names, so the UI uses a natural, compact English display name rather than mechanically copying every formal UN construction.

Examples:

- UNGEGN records `Gambia (the)` / `the Republic of the Gambia`; Atlas renders **The Gambia**.
- The app may retain familiar compact teaching labels such as **North Korea**, **South Korea**, **Tanzania**, **Russia**, and **United States**, while official/alternate forms can live in aliases where useful.

Article normalisation is intentional: parenthetical UN indexing such as `Gambia (the)` is converted into normal display English rather than shown literally.

British-English product copy does not override this naming policy. Canonical country names and aliases continue to follow the authoritative naming sources above rather than localisation spelling rules.

## Rename-sensitive regression set

These names should be explicitly checked whenever the country catalog changes:

| ISO3 | Current Atlas display | Legacy / alternate forms to keep out of the primary label |
|---|---|---|
| CPV | Cabo Verde | Cape Verde |
| CIV | Côte d'Ivoire | Ivory Coast |
| GMB | The Gambia | Gambia as primary UI label |
| SWZ | Eswatini | Swaziland |
| CZE | Czechia | Czech Republic |
| MKD | North Macedonia | Macedonia / former Yugoslav Republic of Macedonia |
| TLS | Timor-Leste | East Timor |
| TUR | Türkiye | Turkey |

Legacy forms remain useful aliases where they improve recognition/search, but should not silently replace the current display label.

## Audit procedure

Before a release that changes the country catalog:

1. Compare the rename-sensitive set against current UNGEGN/UNTERM and M49.
2. Review the UN M49 **Recent changes** table for country-name changes.
3. Confirm ISO2/ISO3 mapping is unchanged or intentionally migrated.
4. Add old names as aliases when they remain common enough to help learners.
5. Add/update automated assertions for any changed primary label.
6. Record the source and date in the relevant implementation log.

## Current audit — 2026-08-19

The catalog already uses the major modern names **Cabo Verde, Eswatini, Czechia, North Macedonia, Timor-Leste, and Türkiye**. `GMB` was corrected from **Gambia** to **The Gambia**, with `Gambia` retained as an alias.

This policy is intentionally separate from map-boundary policy. A country name can be current even when the pilot SVG geometry is still MVP-grade.

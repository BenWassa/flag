# /release — Flag Atlas

ARGUMENTS: `patch` (default) | `minor` | `major` | `--verify-only`

This is Flag Atlas's own release recipe, verified working on 2026-08-22
(v0.5.0). It replaces detection with fixed commands — read it and run it
verbatim rather than re-deriving from scratch.

There is no manual deploy step and no `--deploy` flag: pushing to `main`
is the deploy trigger (see Step 7).

---

## Step 1: pre-flight

```bash
git branch --show-current        # expect: main (this repo releases directly from main)
git status --short                # review — stage only what's actually part of this release
git fetch origin main --quiet
git status -sb                    # confirm ahead/behind; rebase only if behind
```

If `git status --short` shows unrelated in-progress work, ask the user before
sweeping it into the release commit.

## Step 2: quality gates

```bash
npm test    # runs: npm run check (tsc --noEmit) && npm run build && npm run verify
```

`npm run verify` is a chain of ~24 `scripts/verify-*.mjs` scripts run against
the compiled `dist/` output (see root `CLAUDE.md` — there is no separate unit
test framework). All must pass. There is no `lint` or `format` script in this
repo — do not invent one.

## Step 3: pick the bump level

No fixed rule — read `git log <lastTag>..HEAD --oneline` and judge:

- **patch**: bug fixes, docs, internal refactors, no new learner-facing capability.
- **minor**: any new learner-facing capability (a new screen, a new domain entry
  point, a new install/PWA affordance), even if bundled with fixes.
- **major**: not used yet in this repo's history (still pre-1.0 and moving fast).

State the chosen level and why before bumping — this is the one judgment call
in an otherwise mechanical recipe.

## Step 4: version bump

```bash
npm version --no-git-tag-version <level>   # patch | minor | major
```

No custom `version:*` script exists — this is the whole bump. It updates both
`package.json` and `package-lock.json`.

## Step 5: build

```bash
npm run build
```

`dist/` is git-ignored (never committed) — this step is a final compile sanity
check with the bumped version baked in, not something that produces
release-committed artifacts.

## Step 6: commit

Stage exactly the files that changed for this release (never blind `git add -A`):

```bash
git add <changed files> package.json package-lock.json
```

Commit message convention (verified against 0.4.1, 0.4.2, 0.5.0):

```
chore(release): bump version to X.Y.Z

<1-3 sentence summary of what shipped and why this bump level, in the
style of a PR description — not a file-by-file diff>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

## Step 7: tag

Annotated tag, `vX.Y.Z` (matches `git tag --sort=-version:refname`). Body
convention (verified against v0.4.1, v0.4.2, v0.5.0) is a changelog with
whichever of these sections are non-empty — omit empty ones, never pad:

```
Flag Atlas X.Y.Z

<Patch|Minor|Major> release.

Fixed:
- ...

Added:
- ...

Changed:
- ...

Docs:
- ...

Not verified: <explicit callout when something in scope could not be
physically/manually verified — this repo is honest about that in every
prior tag>
```

```bash
git tag -a vX.Y.Z -m "$(cat <<'EOF'
...
EOF
)"
```

## Step 8: push — this IS the deploy step

```bash
git push --follow-tags
```

Deploy is **CI-triggered, not manual**: `.github/workflows/ci.yml` runs on
push to `main`; `.github/workflows/pages.yml` runs via `workflow_run` after
CI completes successfully and publishes `dist/` to GitHub Pages. There is
nothing further to run. Confirm it actually fired and finished:

```bash
gh run list --branch main --limit 3 --workflow "Deploy GitHub Pages"
gh run view <run-id> --json status,conclusion -q '.status + " " + (.conclusion // "pending")'
```

Poll every ~5s rather than sleeping blind; both CI and the Pages deploy
finish in well under a minute historically.

## Step 9: close resolved issues

Per root `CLAUDE.md`'s "Working on issues" section, this repo expects issues
to be closed as part of wrapping up work that ships them:

```bash
gh issue close <n> --comment "Fixed/Shipped in vX.Y.Z (commit <sha>): <one line>."
```

Only close issues actually resolved by what just shipped. Leave anything
blocked on something you can't do yourself (physical device testing, a
decision only the user can make) open, and say so explicitly.

## Step 10: report

State: the new version, the tag, confirmation CI + Pages deploy both
succeeded (with run IDs/links), which issues were closed, and which known-open
issues were deliberately left alone and why.

---

### Notes for future runs

- This repo has shipped 0.2.0 → 0.4.1 → 0.4.2 → 0.5.0 — all releases go
  directly to `main` (mixed history of direct commits and merged PRs; release
  bump commits themselves have always been direct commits, not PRs).
- `dist/` and `node_modules/` are git-ignored; only source, scripts, and
  config are ever part of a release commit.
- No Firebase/other deploy target exists yet (tracked separately as #46) —
  do not add deploy steps speculatively.

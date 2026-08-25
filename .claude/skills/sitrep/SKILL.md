---
name: sitrep
description: Atlas issue/branch/docs situation report — reconcile live GitHub issues, PRs, branches and docs/open against the actual repo, then flag housekeeping. Use when the user asks for a "sit rep", "situation report", "status report", "where are we", or "what's open" regarding issues, branches or docs.
---

# /sitrep — Atlas situation report

ARGUMENTS: none (default, full report) | `--no-test` (skip the `npm test` gate)

Read-only by default. This skill **reports and recommends**; it does not
delete branches, close issues, move docs or push. Propose housekeeping, then
do it only if the user says yes in the same turn.

Verified working 2026-08-25 against `origin/main` at `fdda25e3`.

---

## Rule zero: GitHub is truth, the local checkout is a claim

Always `git fetch` before comparing, and always compare against
`origin/main`, never local `main`. A prior session can leave unpushed local
commits — that is exactly the kind of drift this report exists to catch.
Never state a "current main" SHA that you read from local `main` without
confirming it matches `origin/main`.

## Step 1: baseline

```bash
git fetch origin --quiet
git rev-parse origin/main
git log -1 --format='%H %s' origin/main
git status -sb
git log origin/main..main --oneline    # unpushed local work — report every commit
git log main..origin/main --oneline    # local is behind by these
git status --short                     # uncommitted/untracked
```

Report the `origin/main` SHA + subject as the baseline. If local `main`
diverges **in either direction**, that is a finding, not a footnote — say
what the unpushed commits touch and which open issue they relate to.

## Step 2: open issues

```bash
gh issue list --state open --limit 60
```

Report the count and the full list. Then group them by role rather than
listing them flat — the point of this report is that 18 open issues are not
18 equivalent tasks. Use the repo's actual structure:

- **correctness/integrity defects** (real bugs in shipped behaviour);
- **incomplete promises** (UI claims a capability the code doesn't deliver);
- **validation debt** (implemented, evidence outstanding);
- **engineering-transition cleanup** (#89 children, legacy compatibility);
- **future expansion** (new continents, new hosting);
- **deliberately parked** (captured, not scheduled).

## Step 3: PRs

```bash
gh pr list --state open
gh pr list --state all --limit 20
```

An empty open-PR list alongside a substantive unmerged branch is a finding:
work is complete-in-substance but not delivered.

## Step 4: branches

Classify every branch by whether it is actually contained in `origin/main`.
Squash-merged branches read as UNMERGED here, so cross-reference the PR
state before recommending anything.

```bash
for b in $(git branch -r --format='%(refname:short)' | grep -v HEAD | grep -v 'origin/main'); do
  if git merge-base --is-ancestor "$b" origin/main 2>/dev/null; then echo "MERGED   $b"; else
  echo "UNMERGED $b (+$(git rev-list --count origin/main.."$b") commits, last $(git log -1 --format='%ci' "$b" | cut -d' ' -f1))"; fi
done

for b in $(git branch --format='%(refname:short)'); do
  if git merge-base --is-ancestor "$b" origin/main 2>/dev/null; then echo "MERGED   $b"; else
  echo "UNMERGED $b (last $(git log -1 --format='%ci' "$b" | cut -d' ' -f1))"; fi
done
```

Then resolve each UNMERGED remote branch against its PR:

```bash
gh pr list --head "<branch>" --state all --json number,state,title \
  -q '.[] | "PR #\(.number) \(.state): \(.title)"'
```

Three outcomes, each with a different recommendation:

- **PR MERGED** → branch is squash-merged leftover; **safe to delete**.
- **PR CLOSED / superseded by a `-v2` branch** → abandoned; **safe to delete**.
- **no PR at all** → live undelivered work; **do not delete**, report it as
  work-in-flight and say what it contains.

## Step 5: docs/open ↔ GitHub consistency

Per root `CLAUDE.md`, `docs/open/index.md` is the source of truth for active
work and must not drift from GitHub.

```bash
# every docs/open doc should map to an OPEN issue
for f in docs/open/issue-*.md; do
  n=$(echo "$f" | grep -oE 'issue-[0-9]+' | grep -oE '[0-9]+')
  echo "$(gh issue view "$n" --json state -q .state 2>/dev/null || echo NOTFOUND)  #$n  $f"
done

# nothing in docs/closed should point at a still-open issue
for f in docs/closed/issue-*.md; do
  n=$(echo "$f" | grep -oE 'issue-[0-9]+' | grep -oE '[0-9]+')
  st=$(gh issue view "$n" --json state -q .state 2>/dev/null || echo NOTFOUND)
  [ "$st" != "CLOSED" ] && echo "MISFILED $st #$n $f"
done

# open issues with no doc
for n in $(gh issue list --state open --limit 60 --json number -q '.[].number'); do
  ls docs/open/ | grep -q "issue-$n-" || echo "#$n"
done
```

Interpretation matters here — do not report raw mismatches as defects:

- A docs/open doc whose issue is **CLOSED** → real housekeeping:
  `git mv` it to `docs/closed/` and drop it from `docs/open/index.md`
  sequencing, matching the existing `closed/issue-NN-*.md` closeout pattern.
- **Multiple docs for one issue** is normal (#71 and #89 both do this).
- **An open issue with no doc is usually fine.** #89's children (#93, #96–#101)
  are intentionally phase sections inside `issue-89-execution-plan.md`, and
  #46's children (#106/#107) plus new issues like #108 live as GitHub issues
  only. Only flag a missing doc when the issue is large/architectural and
  about to be worked on.

## Step 6: CI and deploy health

```bash
gh run list --branch main --limit 5
```

Confirm the most recent CI on `main` succeeded and that Pages actually
deployed (`Deploy GitHub Pages` → `success`, not `skipped`).

## Step 7: build gate

Unless `--no-test` was passed:

```bash
node --version    # repo requires 22.12+
npm test          # check + build + full verify chain
```

Report pass/fail plainly. If you did not run it, **say so explicitly** —
never imply a green suite you didn't observe. This repo's docs are honest
about unverified claims and the report must be too.

## Step 8: report

Structure, in this order:

1. **Baseline** — `origin/main` SHA + subject; local divergence if any.
2. **Health** — CI/Pages status; `npm test` result (or explicit "not run").
3. **Open issues** — count, grouped by role per Step 2, not a flat list.
4. **In flight** — unmerged branches with no PR; open PRs.
5. **Housekeeping** — concrete proposals, split into:
   - *safe to delete* (merged/abandoned branches, with the PR number proving it),
   - *needs a decision* (undelivered branches, unpushed local commits),
   - *docs moves* (closed issues still in `docs/open/`).
6. **Recommended next** — what to run now and what can run in parallel.

Keep it tight. Prose over tables unless comparing more than ~6 items on the
same axes. End with the single highest-value next action.

---

### Notes for future runs

- 2026-08-25 baseline: 18 open issues; `docs/open` was fully consistent with
  GitHub (every doc → an open issue, nothing misfiled in `docs/closed`).
- The four `docs/reconcile-*` / `docs/v1-project-truth-integration` branches
  came out of the v1 truth-reconciliation programme; the three `reconcile-*`
  ones are squash-merged leftovers (PRs #105/#109/#110).
- `issue-24-south-america-expansion` was superseded by
  `issue-24-south-america-expansion-v2` (PR #79) — the original is abandoned.
- Deleting a remote branch is a shared-state action: propose, never do it
  unprompted.

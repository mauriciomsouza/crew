# Plan — crew

crew packages an operating model for Claude Code (roles, briefs, source-of-truth documents, independent review and human gates) into a scaffold and a linter. This plan is kept current by the orchestrator. Status values: `not started`, `in progress`, `at gate`, `done`.

## Gates

<!-- crew:plan-gates:start -->
| Gate | Name | Exit question | Status |
| ---- | ---- | ------------- | ------ |
| G0 | Kickoff | Is the goal right, and is the plan worth starting? | done |
| G1 | Scope | Is this the right problem and the right cut? | done |
| G2 | Design | Does this look and behave the way the product should? | done |
| G3 | Production | May this change touch production, billing or secrets? | at gate |
| G4 | Ship | Go or no-go for this version? | not started |
| G5 | Publish | May this be posted publicly, here and now? | not started |
<!-- crew:plan-gates:end -->

## Phase 0 — Foundations (done)

- [x] Problem, audience and positioning in `docs/business/BUSINESS.md`
- [x] This repository uses its own structure: `CLAUDE.md`, `docs/AGENT_TEAM.md`, seven agents
- [x] Toolchain: TypeScript strict, tsup, Vitest, ESLint, Prettier, CI

## Phase 1 — MVP, v0.1 (in progress)

Exit: G4 Ship.

- [x] `crew init`: interactive and `--yes`, never overwrites without `--force`, `--dry-run`
- [x] `crew doctor`: frontmatter, roster, source-of-truth, secrets; non-zero exit on errors; `--json`
- [x] `crew add <role>`: marker-based table updates that keep hand-written content
- [x] Seven role templates
- [x] `examples/parcel`, generated and committed
- [x] Design system, mockups, screenshots
- [x] Landing page and interactive demo on GitHub Pages
- [ ] **G3:** owner enables GitHub Pages (Settings → Pages → Source: GitHub Actions)
- [ ] **G4:** first npm publish of `create-crew@0.1.0`

## Phase 2 — Launch

Exit: G5 Publish.

- [ ] Show HN, X and LinkedIn posts from `docs/marketing/LAUNCH.md`
- [ ] Answer every issue in the first week within 24 hours
- [ ] Collect five real `crew doctor --json` reports (opt-in) to tune rules

## Phase 3 — Next (roadmap, not committed)

- `crew brief <role>`: create a brief file from a template and hand it to the right agent
- `crew upgrade`: three-way merge of template updates into customised agent files
- Custom roles from a local or shared template pack (`--pack ./my-roles`)
- Doctor rules for stale documents (source-of-truth file untouched while its area changed)
- Localised templates (`--language` already flows into every agent prompt)

## Risks

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Claude Code changes the subagent file format | Medium | High | Doctor validates only stable fields; one place (`src/core/doctor.ts`) to update |
| Templates read as generic filler | Medium | High | Every template has concrete "you do not" and handoff sections; reviewed against three different project types |
| Overwriting a user's file | Low | Very high | Single write path, tests for kept / forced / unchanged, QA blocker by rule |
| Ceremony outweighs value for tiny tasks | High | Medium | Default team is four roles; AGENT_TEAM.md tells the orchestrator to take the shortest path |
| Name collision on npm | Low | Medium | `create-crew` checked before G4; fallback name listed in RELEASING.md |

## Decision log

| Date | Decision | Why | Decided by |
| ---- | -------- | --- | ---------- |
| 2026-11-01 | Default roles are business, design, dev, qa | Smallest team that still has independent review and a scope gate | Owner |
| 2026-11-01 | Pure core shared by CLI and browser demo | The demo cannot drift from the real output | Owner, on dev's proposal |
| 2026-11-01 | Marker comments for managed sections | `crew add` can update tables without touching hand-written content | Owner, on dev's proposal |
| 2026-11-01 | Ship on GitHub Pages, no backend | Zero cost, zero secrets, works under `/crew/` | Owner |

# Plan — Parcel

A habit tracker for people who keep breaking streaks.

The plan is a sequence of phases. Each phase ends at a **gate**: a point where the owner reviews evidence and explicitly approves moving on. The orchestrator keeps this file current; status values are `not started`, `in progress`, `at gate`, `done`.

## Gates

<!-- crew:plan-gates:start -->
| Gate | Name | Exit question | Status |
| ---- | ---- | ------------- | ------ |
| G0 | Kickoff | Is the goal right, and is the plan worth starting? | not started |
| G1 | Scope | Is this the right problem and the right cut? | not started |
| G2 | Design | Does this look and behave the way the product should? | not started |
| G3 | Ship | Go or no-go for this version? | not started |
<!-- crew:plan-gates:end -->

## Phases

### Phase 0 — Foundations

Goal: the team, the documents and the toolchain are in place.

- [ ] Fill in the source-of-truth documents listed in `CLAUDE.md`
- [ ] Agree the first iteration's goal with the owner
- [ ] `npx crew doctor` passes

### Phase 1 — First usable version

Goal: the smallest version that solves the core problem for one person, end to end.

- [ ] Brief with scope and acceptance criteria
- [ ] Implementation, reviewed and verified
- [ ] Owner has used it and approved

### Phase 2 — Release

Goal: a version people outside the team can use.

- [ ] Release checklist complete
- [ ] Announcement drafted
- [ ] Owner go

## Risks

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Scope grows during the phase | Medium | High | Out-of-scope items go to the next phase, not this one |
| Reviews become a formality | Medium | High | QA re-runs every check and records evidence |

## Decision log

| Date | Decision | Why | Decided by |
| ---- | -------- | --- | ---------- |

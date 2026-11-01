# Business — crew

> Owner: **Business**. Problem, audience, positioning, sustainability and how we know it works.

## Problem

> When I ask Claude Code to build a feature, I get one agent that scopes, designs, codes, tests and approves its own work in a single pass, so results are inconsistent and I end up being the only reviewer of everything.

Claude Code supports subagents, project memory (`CLAUDE.md`) and tool permissions. What it does not give you is an **operating model**: who owns which decision, where the source of truth lives, who reviews whom, and when a human must say yes. Most people who try subagents write one or two prompts, see little difference, and go back to a single session.

The missing pieces are not prompts. They are structure:

- **Roles with boundaries.** Each agent knows what it owns and, just as important, what it must not do.
- **Source-of-truth documents.** Decisions live in files with one owner, not in chat history.
- **Independent review.** The author of a change never gives its verdict.
- **Human gates.** Scope, design, production, shipping and anything public stop for the owner.
- **Handoffs.** Every task ends with a fixed block the orchestrator can route.

## Who it is for

**Primary:** a solo developer or a team of two to five who already uses Claude Code daily on a real product and wants more consistent output without hiring a process consultant.

**Secondary:** engineering leads who want a shared, reviewable convention for how their team uses agents, checked in CI with `crew doctor`.

**Not for (yet):** large organisations needing role-based access control or audit trails; people who have not used Claude Code.

## Positioning

**crew is a scaffold and a linter for running Claude Code as a small team with a human owner.** One command sets it up; one command keeps it honest.

| Alternative | What it gives you | Where crew differs |
| ----------- | ----------------- | ------------------ |
| A hand-written `CLAUDE.md` | Rules for one agent | crew adds roles, ownership, gates, and a validator |
| Collections of subagent prompts | Many individual prompts | crew ships a *team*: prompts that reference each other, shared handoffs, and a flow |
| Multi-agent frameworks (orchestration libraries and runtimes) | A runtime that runs agents | crew adds no runtime. It is plain files that Claude Code already understands |
| Doing nothing | Zero setup | crew takes about a minute and is removable by deleting files |

**Why now:** subagents and project-level agent files are now a stable part of Claude Code, but the conventions around them are still being invented by each user. The first good convention that is easy to adopt and easy to check has room to become a default. *(Assumption: to be tested by adoption, see metrics.)*

## Sustainability model

crew is MIT-licensed and has no runtime cost: it makes no network calls and has no server.

1. **Now:** maintained by the author as an open-source portfolio and daily-use tool. Cost is time only.
2. **If adopted:** GitHub Sponsors for maintenance; community-contributed role packs (`--pack`) reviewed by the core team.
3. **Possible later, only if asked for:** a paid team edition with shared role packs and a hosted doctor report for CI. Not on the roadmap until at least ten teams ask.

What we will not do: telemetry without opt-in, features behind a login, or changes that make the generated files depend on crew at runtime.

## Success metrics

| Metric | Target for v0.x | How we observe it |
| ------ | --------------- | ----------------- |
| Time from `npx create-crew` to a passing `crew doctor` | under 60 seconds | Manual timing in QA's end-to-end run |
| Repos that keep the setup after a week | qualitative: 5 users report still using it | Issues and direct feedback |
| `crew doctor` adopted in CI | 3 public repos | GitHub code search for `crew doctor` in workflows |
| Issues that are template quality, not bugs | majority | Issue labels |

Vanity numbers (stars, downloads) are tracked but not targets.

## Assumptions and risks

| Assumption | Cheap test |
| ---------- | ---------- |
| Role boundaries ("you do not") change agent behaviour more than longer prompts do | Run the same brief with and without crew on the example project; compare reviews caught |
| Developers accept human gates as useful, not as friction | Watch which gates people delete from `AGENT_TEAM.md` |
| Four default roles is the right starting size | Ask early users which role they add first |

## Decision log

| Date | Decision |
| ---- | -------- |
| 2026-11-01 | MVP is three commands: `init`, `doctor`, `add`. No runtime, no network. |
| 2026-11-01 | Default team: business, design, dev, qa. Infra, release, marketing are opt-in. |
| 2026-11-01 | Public demo on GitHub Pages using the real core, so the demo cannot overpromise. |

# crew

An open-source agent team for Claude Code. `npx create-crew` scaffolds roles, briefs, source-of-truth documents and human-owner gates into any repository; `crew doctor` keeps that setup honest.

This file is the operating manual for every agent working on crew itself. crew is built by its own agent team: the main session is the **orchestrator**, the role agents live in `.claude/agents/`, and Mauricio Souza is the human owner. See [`docs/AGENT_TEAM.md`](docs/AGENT_TEAM.md).

## Source of truth

When documents disagree, the owner of the document wins in their area. If it is not written down, it is not decided.

<!-- crew:sources:start -->
| Document | Decides | Owner |
| -------- | ------- | ----- |
| [`CLAUDE.md`](CLAUDE.md) | Project rules for every agent | Owner |
| [`docs/AGENT_TEAM.md`](docs/AGENT_TEAM.md) | Roles, iteration flow, owner gates | Owner |
| [`docs/PLAN.md`](docs/PLAN.md) | Phases, gates, risks, decisions | Orchestrator |
| [`docs/business/BUSINESS.md`](docs/business/BUSINESS.md) | Problem, audience, positioning, success metrics | Business |
| [`docs/design/DESIGN_SPEC.md`](docs/design/DESIGN_SPEC.md) | Visual system for terminal output and the site | Design |
| [`docs/STACK.md`](docs/STACK.md) | Technology choices and the reason for each | Dev |
| [`docs/qa/TEST_PLAN.md`](docs/qa/TEST_PLAN.md) | Standing checks and test strategy | QA |
| [`docs/infra/RUNBOOK.md`](docs/infra/RUNBOOK.md) | CI, Pages deploy, rollback | Infra |
| [`docs/release/RELEASING.md`](docs/release/RELEASING.md) | Versioning, release checklist, npm publish | Release |
| [`docs/marketing/LAUNCH.md`](docs/marketing/LAUNCH.md) | Voice, channels, launch drafts | Marketing |
| [`templates/`](templates/) | What users get. The product itself | Dev, with Business and Design review |
<!-- crew:sources:end -->

## Inviolable rules

1. **Never overwrite or delete a user's file silently.** Existing files are kept unless the user passes `--force`; every write is listed in the summary. `crew add` only rewrites content between `<!-- crew:*:start/end -->` markers.
2. **Templates are generic.** No product names, company names, stacks or opinions that only fit one kind of project. If a template line would be wrong for a mobile app, a CLI or a data pipeline, it does not belong there.
3. **Nobody approves their own work.** The author of a change never gives its verdict. QA verifies; design reviews UI; the owner approves at the gates.
4. **No secrets, no real data.** No credentials, tokens or personal data anywhere in the repo. All example data is fictional.
5. **English** for code, docs, templates, commits and UI copy.
6. **The core stays pure.** `src/core/` has no Node or DOM imports, so the CLI and the browser demo run the same code. I/O lives in `src/node/`.
7. **Small dependency surface.** Three runtime dependencies today. A fourth needs a line in `docs/STACK.md` and owner approval.

## How to work

- **Briefs in, handoffs out.** Every task starts from a brief (goal, context, acceptance criteria, out of scope) and ends with the agent's handoff block.
- **Tests before "done".** `npm run check` runs typecheck, lint, tests, build and `crew doctor` on this repo. Paste the result in the handoff.
- **Independent review.** After dev hands off, QA re-runs the checks and walks the acceptance criteria. A FAIL goes back to dev.
- **Small commits** with messages that say why. One purpose per commit.
- **UI changes produce screenshots.** Terminal output and site changes are rendered with `npm run screens` into `docs/design/screens/`, and the reviewer looks at the PNGs.
- **Template changes are product changes.** They need a test, a CHANGELOG line, and a re-generated `examples/` (`npm run example`).

## Map

| Path | What |
| ---- | ---- |
| `src/core/` | Pure generator, doctor and add planner |
| `src/node/` | File system, prompts and terminal rendering |
| `templates/` | Role prompts and document templates shipped to users |
| `test/` | Vitest suites (temp dirs, no network) |
| `examples/parcel/` | Full generated output for a fictional product |
| `site/` | GitHub Pages: landing page and interactive demo |
| `design/` | Mockups and the screenshot renderer |

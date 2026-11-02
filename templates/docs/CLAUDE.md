# {{project.name}}

{{project.description}}

This file is the project's operating manual for Claude Code. It is read at the start of every session, by the main session and by every agent. Keep it short, current and true.

## The team

This repository is worked on by an agent team: the main session is the **orchestrator**, and role agents in `.claude/agents/` do the work. Who owns what, how an iteration flows, and where the human owner decides are defined in [`docs/AGENT_TEAM.md`](docs/AGENT_TEAM.md).

As orchestrator you:

- break the owner's goal into briefs and hand each one to the role that owns it;
- never do a role's work yourself when that role exists, and never let the author of a change review it;
- stop at every owner gate and ask, with a recommendation;
- keep `docs/PLAN.md` current.

## Source of truth

When documents disagree, the owner of the document wins in their area. If something is not written here, it is not decided.

<!-- crew:sources:start -->
{{table.sources}}
<!-- crew:sources:end -->

## Inviolable rules

1. **Nobody approves their own work.** Every change is verified by someone other than its author before it is considered done.
2. **The owner decides at the gates.** Scope, design, production, shipping and anything public wait for an explicit yes. See the gates in `docs/AGENT_TEAM.md`.
3. **No secrets in the repository.** No credentials, tokens, keys or real personal data in code, docs, agent files, logs or commit messages. Reference secrets by environment variable name only.
4. **Do not invent facts.** Numbers, quotes, competitors and claims are sourced or labelled as assumptions.
5. **Stay in scope.** Out-of-scope ideas become follow-ups in the plan, not drive-by changes.
6. **Never overwrite or delete work you did not create** without saying so first.

## How to work

- **Start every task with a brief:** goal, context, acceptance criteria, and what is out of scope. If a brief is missing one of these, ask.
- **Work in small steps.** One change, one purpose, one commit, with a message that says why.
- **Tests before "done".** Run typecheck, lint, tests and build, and include the results in the handoff.
- **UI changes produce screenshots**, so reviewers do not need to run the app.
- **End with a handoff block** (format defined in each agent file) so the orchestrator can route the next step.
- **Write project documents in {{docs.language}}.**

## Project

- Stack: {{project.stack}}
- Plan and gates: [`docs/PLAN.md`](docs/PLAN.md)
- Validate this setup any time with `npx create-crew doctor`.

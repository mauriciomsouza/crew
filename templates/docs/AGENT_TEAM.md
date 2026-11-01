# Agent team — {{project.name}}

{{project.name}} is built by a small team of Claude Code agents with a human owner. The main session is the orchestrator; each role below is a subagent defined in `.claude/agents/<agent>.md`.

The model is simple: **every piece of work has an owner, every change has an independent reviewer, and the human decides at the gates.**

## Roles

<!-- crew:roles:start -->
{{table.roles}}
<!-- crew:roles:end -->

## How an iteration flows

<!-- crew:flow:start -->
{{diagram.flow}}
<!-- crew:flow:end -->

1. **Goal.** The owner states what they want and why.
2. **Brief.** The orchestrator writes a brief for the first role: goal, context, acceptance criteria, out of scope.
3. **Work.** The role does the work in its own area and ends with a handoff block.
4. **Review.** A different role verifies it. A FAIL goes back to the author with a reproducible report.
5. **Gate.** Where a gate applies, the orchestrator stops and asks the owner, with a recommendation.
6. **Record.** Decisions land in the document that owns them; `docs/PLAN.md` is updated.

## Points that require the human owner

The orchestrator must stop and ask before any of these. Silence is not approval.

<!-- crew:gates:start -->
{{table.gates}}
<!-- crew:gates:end -->

## Team rules

- **Nobody approves their own work.** The author of a change never gives its verdict.
- **One owner per document.** Others propose changes to it; the owner makes them.
- **Briefs in, handoffs out.** Every task starts from a brief and ends with the role's handoff block.
- **Evidence over assertion.** "Tests pass" comes with the command and its output; "looks right" comes with a screenshot.
- **Escalate early.** A blocked role says so in its handoff instead of guessing.
- **Small batches.** Prefer three small reviewed changes to one large one.

# Agent team — crew

crew is built and operated by the same kind of team it ships. The main session is the orchestrator; each role below is a subagent in `.claude/agents/<agent>.md`. Mauricio Souza is the human owner.

**Every piece of work has an owner, every change has an independent reviewer, and the human decides at the gates.**

## Roles

<!-- crew:roles:start -->
| Role | Agent | Owns | Typical deliverable |
| ---- | ----- | ---- | ------------------- |
| Orchestrator | main session | Briefs, routing, the plan, owner gates | Brief per task; updated PLAN.md |
| Business | `business` | Problem, audience, positioning, success metrics | Scoped brief with acceptance criteria |
| Design | `design` | Terminal output, site, demo, design system | Spec plus rendered screenshots |
| Dev | `dev` | CLI source, templates, tests, stack | Small tested change, ready for review |
| QA | `qa` | Independent verification, test plan | PASS or FAIL verdict with evidence |
| Infra | `infra` | CI, GitHub Pages, npm provenance | Green pipeline and a runbook entry |
| Release | `release` | Versioning, changelog, npm publish checklist | Release candidate and a go/no-go question |
| Marketing | `marketing` | README voice, launch plan, announcements | Ready-to-post drafts per channel |
<!-- crew:roles:end -->

## How an iteration flows

<!-- crew:flow:start -->
```text
Owner
  │  goal
  ▼
Orchestrator ── writes briefs, routes handoffs, keeps PLAN.md
  │
  ├─▶ business    scope · metric · acceptance criteria   ◆ G1 Scope
  ├─▶ design      flows · states · copy · mockups        ◆ G2 Design
  ├─▶ dev         code · tests · screenshots
  ├─▶ qa          independent verdict, with evidence     ✗ FAIL → back to author
  ├─▶ infra       CI · environments · deploys            ◆ G3 Production
  ├─▶ release     changelog · version · go/no-go         ◆ G4 Ship
  └─▶ marketing   launch drafts per channel              ◆ G5 Publish

◆ stops for the owner’s explicit approval · nobody approves their own work
```
<!-- crew:flow:end -->

Not every iteration visits every role. A template wording fix is `dev → qa → release`. A new command is the full path. The orchestrator picks the shortest path that still has an independent reviewer and every gate the change touches.

1. **Goal.** The owner states what they want and why.
2. **Brief.** The orchestrator writes a brief for the first role: goal, context, acceptance criteria, out of scope.
3. **Work.** The role works in its own area and ends with its handoff block.
4. **Review.** A different role verifies. A FAIL returns to the author with a reproducible report.
5. **Gate.** Where a gate applies, the orchestrator stops and asks the owner, with a recommendation.
6. **Record.** Decisions land in the document that owns them; `docs/PLAN.md` is updated.

## Points that require the human owner

The orchestrator stops and asks before any of these. Silence is not approval.

<!-- crew:gates:start -->
| Gate | Decision | Brought by | The owner answers |
| ---- | -------- | ---------- | ----------------- |
| G0 | Kickoff | Orchestrator | Is the goal right, and is the plan worth starting? |
| G1 | Scope | Business | Is this the right problem and the right cut? |
| G2 | Design | Design | Does this look and behave the way the product should? |
| G3 | Production | Infra | May this change touch production, billing or secrets? |
| G4 | Ship | Release | Go or no-go for this version? |
| G5 | Publish | Marketing | May this be posted publicly, here and now? |
<!-- crew:gates:end -->

Specific to crew, the owner also decides:

| Decision | Why it needs the owner |
| -------- | ---------------------- |
| Any change to the default role set or the inviolable rules in a template | It changes what every new user gets |
| Adding a runtime dependency | Supply-chain surface for everyone who runs `npx` |
| Publishing to npm, tagging, or pushing to `main` | Public and hard to undo |
| Anything posted under the owner's name | Reputation |

## Team rules

- **Nobody approves their own work.** The author of a change never gives its verdict.
- **One owner per document.** Others propose changes; the owner makes them.
- **Briefs in, handoffs out.** Every task starts from a brief and ends with the role's handoff block.
- **Evidence over assertion.** "Tests pass" comes with the command and output; "looks right" comes with a screenshot path.
- **Escalate early.** A blocked role says so instead of guessing.
- **Small batches.** Three small reviewed changes beat one large one.

# Launch — crew

> Owner: **Marketing**. Voice, channels, plan and ready-to-post drafts. Nothing here is posted without the owner (gate G5).

## Voice

Plain, specific, a little dry. Developers have seen a lot of "AI agents will change everything" posts; crew wins by showing a command, a file tree and a doctor report.

- **Do:** lead with the pain, show the real output, say what it does not do.
- **Don't:** superlatives, "revolutionary", invented numbers, emoji walls, claims about productivity gains we have not measured.
- **Name:** always lowercase `crew`, in code formatting when it is the command.

## Channels

| Channel | Why | Format |
| ------- | --- | ------ |
| Show HN | Developers who will actually try it and give honest feedback | Plain text, technical, author answers every comment |
| X / Bluesky | Claude Code users share setups there | 5-post thread with the hero image and the demo link |
| LinkedIn | Engineering leads and design engineers | One post, story-first, link in the first comment |
| Product Hunt | Wider discovery, long-tail traffic | Gallery of the five screenshots, maker comment |
| r/ClaudeAI | Core audience | Text post, link to demo, no marketing tone |

## Launch plan

| Day | Action | Owner |
| --- | ------ | ----- |
| T−3 | Release `create-crew@0.1.0` (G4), confirm Pages demo is live | Release, Infra |
| T−2 | Dry run: a fresh machine runs `npx create-crew` and `crew doctor` from the README alone | QA |
| T−1 | Owner approves every draft below (G5) | Owner |
| T0, 8:00 PT (Tue) | Show HN | Owner posts |
| T0, 9:00 PT | X thread, LinkedIn post | Owner posts |
| T0 | Answer every HN comment and issue within the hour | Owner, with drafts from marketing |
| T+1 | r/ClaudeAI post | Owner posts |
| T+7 | Product Hunt | Owner posts |
| T+14 | Write-up: what we learned from the first users | Marketing drafts |

## README tagline variants

1. **Ship like a team of eight.** *(recommended: concrete, memorable, matches the product's shape: orchestrator plus seven roles)*
2. An agent team for Claude Code, with a human in charge.
3. Roles, reviews and human gates for Claude Code.

Sub-line, under all variants: *"An open-source agent team for Claude Code. Nobody approves their own work."*

## Drafts

### Show HN

**Title:** Show HN: Crew – an agent team for Claude Code with roles, reviews and human gates

**Body:**

> I use Claude Code daily, and the failure mode I kept hitting wasn't bad code. It was one session doing everything: scoping, designing, building, testing and then telling me it was done. There was no second opinion, and decisions lived in chat history.
>
> crew is a small CLI that sets up an operating model as plain files Claude Code already understands:
>
> - `CLAUDE.md` with a source-of-truth table and inviolable rules
> - `docs/AGENT_TEAM.md`: roles, an iteration flow, and the points where the human owner must approve
> - `.claude/agents/*.md`: business, design, dev, qa, infra, release, marketing. Each prompt says what the role owns, what it must not do, and ends with a fixed handoff block
>
> The rule that does most of the work: nobody approves their own work. QA re-runs checks and gives a PASS/FAIL with evidence; the author never does.
>
> `npx create-crew` scaffolds it (never overwrites existing files without `--force`). `crew doctor` lints it: frontmatter, every role in the team doc has an agent and vice versa, every source-of-truth doc exists, no keys in prompts. It exits non-zero, so it can run in CI. `crew add <role>` adds a role and updates the tables between marker comments, leaving the rest of your edits alone.
>
> There's a live demo that runs the real generator in the browser: https://mauriciomsouza.github.io/crew/demo.html
>
> The repo is built by its own crew. The agents, plan and gates are in the repo if you want to see it used for real.
>
> What it is not: a runtime or a framework. No server, no network calls, MIT. Delete the files and it's gone.
>
> I'd especially like feedback on the role prompts. They're the product.

### X / Bluesky thread

1. One Claude Code session that scopes, builds, tests and approves its own work will tell you it's done.

   I built crew: an open-source agent team for Claude Code. Roles, briefs, independent review and human gates. `npx create-crew` [hero image]

2. It's just files Claude Code already reads: `CLAUDE.md`, a team doc, and seven role agents. Each one knows what it owns, what it must not do, and how to hand off. [screenshot: generated tree]

3. The rule that matters most: nobody approves their own work. QA gives PASS or FAIL with evidence. The author never does. Scope, design, prod, ship and publish stop for you. [screenshot: flow diagram]

4. `crew doctor` lints the setup: agents match the roster, docs exist, no keys in prompts. Non-zero exit, so it goes in CI. [screenshot: doctor report]

5. Try it in the browser with the real generator: https://mauriciomsouza.github.io/crew/demo.html
   Code (MIT): https://github.com/mauriciomsouza/crew

### LinkedIn

> The most useful rule I've added to my AI-assisted workflow isn't a prompt. It's "nobody approves their own work."
>
> When one agent scopes, designs, builds and tests a feature, it also decides that it's done. That's the step that goes wrong.
>
> So I packaged the setup I use into an open-source tool called crew. One command adds an agent team to any repo for Claude Code: an orchestrator plus business, design, dev, QA, infra, release and marketing roles. Every role has clear ownership and a fixed handoff, and the human owner signs off at defined gates: scope, design, production, ship, publish.
>
> A second command, `crew doctor`, checks that the setup stays consistent, and can run in CI.
>
> It's built by its own agent team. The repo shows the plan, the gates and the reviews.
>
> Live demo (runs in the browser): https://mauriciomsouza.github.io/crew/demo.html
>
> I'd love feedback from people running AI agents on real products: which role would you add first?

### Product Hunt

- **Name:** crew
- **Tagline (60 chars):** Ship like a team of eight. An agent team for Claude Code.
- **Description:** crew sets up a real agent team in your repo for Claude Code: an orchestrator and seven roles with clear ownership, written briefs, independent review and human approval gates. `npx create-crew` scaffolds it; `crew doctor` keeps it consistent in CI. Plain Markdown, no runtime, MIT.
- **Gallery:** `hero.png`, `demo-dark.png`, `terminal-init.png`, `terminal-doctor.png`, `site-light.png`
- **Maker comment:** Same story as the Show HN body, shortened to three paragraphs, ending with the question about which role people would add first.

## Claims checked

| Claim | Evidence |
| ----- | -------- |
| Never overwrites without `--force` | `test/cli.test.ts` "never overwrites an existing file without --force" |
| `crew add` keeps hand-written content | `test/cli.test.ts` "preserves hand-written content outside the managed sections" |
| Doctor exits non-zero | `test/cli.test.ts` "exits 0 on a generated repo and 1 when something is broken" |
| Demo runs the real generator | `tsup.site.config.ts` bundles `src/core` to `site/assets/crew.js` |
| No network calls | No `fetch`/`http` imports in `src/`; see `docs/STACK.md` |

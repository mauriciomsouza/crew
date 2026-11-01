# Contributing to crew

Thanks for helping. crew is small on purpose, so the most valuable contributions are usually **better role templates** and **sharper doctor rules**, not new features.

## Setup

```bash
git clone https://github.com/mauriciomsouza/crew && cd crew
npm ci
npm run check    # typecheck, lint, test, build, crew doctor on this repo
```

Requires Node 22 (see `.nvmrc`).

| Command | What |
| ------- | ---- |
| `npm test` | Vitest, real temp directories, no network |
| `npm run build` | CLI to `dist/` |
| `npm run example` | Regenerate `examples/parcel` |
| `npm run preview` | Serve the site at `http://localhost:4173/crew/`, like GitHub Pages |
| `npm run screens` | Render mockups and the site to `docs/design/screens/` (needs Chrome at `/usr/bin/google-chrome` or `CHROME_PATH`) |

## How changes are made here

This repo is built by its own agent team, and human contributors follow the same rules. Read [`CLAUDE.md`](CLAUDE.md) and [`docs/AGENT_TEAM.md`](docs/AGENT_TEAM.md) first. In short:

1. **Open an issue first** for anything bigger than a typo, so scope is agreed before code.
2. **Templates stay generic.** A template line must hold for a web app, a CLI, a mobile app and a data pipeline. Product-specific advice belongs in the user's own files.
3. **Never write a user's file silently.** All writes go through `writeFiles` in `src/node/fs.ts`.
4. **`src/core` stays pure**: no Node or DOM imports. The browser demo runs it unchanged.
5. **Tests with the change.** Every doctor rule has a passing and a failing case.
6. **Screenshots for visible changes.** Terminal output or site changes include updated PNGs from `npm run screens`.
7. **Small commits** with messages that explain why.

## Using crew's agents on crew

If you use Claude Code, the agents in `.claude/agents/` work on this repo. Start a session and ask the orchestrator to write a brief for your change; it will route it to `dev`, and then to `qa` for an independent verdict.

## Code of conduct

Be kind, assume good intent, and keep discussion about the work.

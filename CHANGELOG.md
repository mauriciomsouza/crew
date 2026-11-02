# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/) as defined in [docs/release/RELEASING.md](docs/release/RELEASING.md).

## [Unreleased]

## [0.1.1] - 2026-11-02

### Fixed

- `npx create-crew` printed the help instead of scaffolding. npx resolves the bin symlink, so the CLI never saw the name `create-crew`; the package now ships a dedicated `create-crew` entry that defaults to `init`.

## [0.1.0] - 2026-11-01

### Added

- `npx create-crew` / `crew init`: scaffolds `CLAUDE.md`, `docs/AGENT_TEAM.md`, `docs/PLAN.md`, one agent per chosen role in `.claude/agents/`, and a source-of-truth stub for each role. Interactive prompts, or `--yes` with `--name`, `--description`, `--stack`, `--roles`, `--language`.
- Existing files are kept unless `--force` is passed; `--dry-run` shows the plan without writing.
- `crew doctor`: validates agent frontmatter, roster vs. agent files, source-of-truth documents, and scans for secrets. Exits 1 on errors; `--json` for CI.
- `crew add <role>`: adds an agent and its document, and regenerates the tables between `<!-- crew:*:start/end -->` markers without touching anything else.
- `crew roles`: lists available roles.
- Seven role templates: business, design, dev, qa, infra, release, marketing.
- `examples/parcel`: full generated output for a fictional product.
- Landing page and live in-browser demo on GitHub Pages, built from the same core as the CLI.

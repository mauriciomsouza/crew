# Stack — crew

> Owner: **Dev**. Every choice here has a reason; a new dependency needs a line here and owner approval.

## Runtime and language

| Choice | Why |
| ------ | --- |
| Node 22+, ESM only | Current LTS; `node:util` `parseArgs` removes the need for a CLI framework |
| TypeScript, `strict` plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` | The CLI writes into other people's repos; the compiler should be as suspicious as QA |
| npm, single package | One package, two bins (`create-crew`, `crew`). No workspace tooling to explain |

## Runtime dependencies (3)

| Package | Why | Considered instead |
| ------- | --- | ------------------ |
| `@clack/prompts` | Small, good-looking prompts with cancel handling | `prompts`, `inquirer` (heavier, older look) |
| `picocolors` | Tiny, respects `NO_COLOR` | `chalk` (larger, ESM-only churn) |
| `yaml` | Correct YAML 1.2 parsing for agent frontmatter, zero deps | `gray-matter` (pulls in `js-yaml` and more than we need) |

## Dev dependencies

| Package | Why |
| ------- | --- |
| `tsup` | One config, bundles templates as strings (`.md` text loader), emits `.d.ts` |
| `vitest` | Fast, ESM-native, temp-dir tests without mocks |
| `eslint` + `typescript-eslint` (strict) + `prettier` | Lint for bugs, Prettier for formatting; they do not overlap |
| `playwright-core` | Renders mockups and the site to PNG with the system Chrome; no browser download |

## Architecture

```text
src/
  core/        pure: roles, templates, generate, doctor, add   ← also bundled for the browser demo
  node/        fs reader/writer, prompts, terminal rendering
  cli.ts       argument parsing and dispatch
templates/     Markdown shipped to users, imported as strings at build time
```

- **Pure core.** `src/core` takes and returns data. The CLI wraps it with a file system reader; the demo wraps it with an in-memory one (`memoryRepo`). The demo is therefore the real generator, not a re-implementation.
- **One write path.** `writeFiles` decides kept / created / updated / unchanged. Commands never call `writeFileSync` directly.
- **Managed sections.** Tables that `crew add` regenerates sit between `<!-- crew:name:start -->` and `<!-- crew:name:end -->`. Everything outside the markers belongs to the user.
- **Templates are Markdown** with `{{var}}` and `{{#if flag}}` only. Unknown placeholders throw, so a typo fails a test instead of shipping.

## Conventions

- File names: kebab-case; one module per concept.
- Errors that a user can fix say what is wrong and what to run next.
- Tests use real temp directories, never mocked `fs`.
- No network access at runtime. Ever.

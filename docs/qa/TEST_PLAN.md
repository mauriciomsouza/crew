# Test plan — crew

> Owner: **QA**. Standing checks every change must pass, and how crew is tested.

## Standing checks

| Check | Command | Must be |
| ----- | ------- | ------- |
| Install from lockfile | `npm ci` | clean |
| Types | `npm run typecheck` | 0 errors |
| Lint and format | `npm run lint` | 0 problems |
| Unit and integration tests | `npm test` | all pass |
| Build | `npm run build` | `dist/cli.js` and `dist/index.d.ts` emitted |
| Dogfood | `npm run doctor` | HEALTHY on this repo |
| Example is current | `npm run example && git diff --exit-code examples/` | no diff |

## End-to-end script

Run in a fresh temp directory against the built CLI:

```bash
CREW="node $PWD/dist/cli.js"
cd "$(mktemp -d)"
$CREW init --yes --name Parcel --roles business,dev,qa   # 9 created
$CREW doctor                                              # HEALTHY, exit 0
$CREW add design                                          # 2 created, 4 updated
$CREW doctor                                              # HEALTHY, 4 roles
$CREW init --yes --name Parcel --roles business,dev,qa   # unchanged or kept, nothing overwritten
echo "# mine" > CLAUDE.md && $CREW init --yes             # CLAUDE.md kept
echo oops > .claude/agents/qa.md && $CREW doctor          # NEEDS WORK, exit 1
```

## Strategy

- **Core** (`src/core`): pure functions, tested with `memoryRepo`.
- **Commands** (`src/node`): tested through `init`, `doctor` and `add` against real temp dirs, with captured output.
- **Templates**: every role must contain the required sections; rendering with unknown placeholders throws.
- **Doctor**: every rule has at least one passing and one failing case.
- **UI**: screenshots in `docs/design/screens/` are regenerated for any output or site change and reviewed by eye.

## Risky areas

- Anything that writes files: overwrite behaviour, `--force`, paths outside the project.
- Marker replacement when a user has edited around the markers.
- YAML edge cases in frontmatter (colons in descriptions, lists for `tools`).
- Secret patterns: false positives on prose about secrets.

## Bug severity

| Severity | Meaning | Example |
| -------- | ------- | ------- |
| Blocker | Data loss, security, or the main path broken | `init` overwrites an existing `CLAUDE.md` |
| Major | A command gives a wrong answer | `doctor` passes a repo with a missing agent |
| Minor | Cosmetic or unclear | misaligned column in the summary |

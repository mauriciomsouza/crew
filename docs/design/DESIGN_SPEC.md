# Design spec — crew

> Owner: **Design**. The visual system for crew's terminal output, the site and the demo. It is called **Quiet Terminal**.

## Principles

1. **Output is interface.** Every line a command prints is designed: aligned, scannable, honest about what happened.
2. **Glyph plus word.** Status never relies on color alone. Everything reads correctly with `NO_COLOR=1` and in a screen reader.
3. **One accent.** Cyan marks the brand and focus. Green, yellow and red are reserved for status. Magenta is reserved for owner gates.
4. **Paths are the content.** File paths are full weight; explanations are dim. The eye lands on what changed.
5. **Calm by default.** No spinners for work that takes milliseconds, no banners, no emoji.

## Tokens

Colors are defined once in `site/assets/site.css` as CSS custom properties and mirrored by the CLI's ANSI palette.

### Color

| Token | Light | Dark | Use |
| ----- | ----- | ---- | --- |
| `--bg` | `#FBFBFA` | `#0B0C0E` | Page background |
| `--surface` | `#FFFFFF` | `#121317` | Cards, panels |
| `--surface-2` | `#F4F4F2` | `#181A1F` | Insets, code blocks |
| `--border` | `#E6E6E3` | `#24262C` | Hairlines |
| `--text` | `#111113` | `#EDEDEF` | Primary text (contrast ≥ 15:1) |
| `--text-muted` | `#5E6168` | `#9A9CA5` | Secondary text (≥ 4.6:1) |
| `--text-faint` | `#8A8D94` | `#6B6E77` | Captions, metadata only |
| `--accent` | `#0A8BA6` | `#3CCFE6` | Brand mark, links, focus ring |
| `--accent-soft` | `#E3F5F8` | `#0F2A30` | Accent backgrounds |

### Terminal palette

The terminal window is always dark, in both themes, so screenshots match what developers actually see.

| Token | Value | ANSI | Meaning |
| ----- | ----- | ---- | ------- |
| `--term-bg` | `#0D0E11` | — | Window background |
| `--term-text` | `#E6E6E9` | default | Paths, primary content |
| `--term-dim` | `#7C7F89` | dim | Explanations, unchanged items |
| `--term-cyan` | `#5ED4E8` | cyan | Brand mark, commands to run |
| `--term-green` | `#7BD88F` | green | `✓` pass, `+` created |
| `--term-yellow` | `#E8C46A` | yellow | `!` warning, `kept` |
| `--term-red` | `#F07178` | red | `✗` error |
| `--term-magenta` | `#C792EA` | magenta | `◆` owner gate |

### Spacing, radius, motion

| Token | Value |
| ----- | ----- |
| `--space-1` … `--space-8` | 4, 8, 12, 16, 24, 32, 48, 64 px |
| `--radius-sm` / `--radius` / `--radius-lg` | 6 / 10 / 14 px |
| `--shadow` | `0 1px 2px rgb(0 0 0 / .04), 0 8px 24px rgb(0 0 0 / .06)` (light); none plus border (dark) |
| `--ease` | `cubic-bezier(.2, .7, .2, 1)`, 160 ms for hover, 240 ms for reveal |

Motion respects `prefers-reduced-motion`: typing animations render instantly.

## Typography

| Role | Family | Size / line height | Weight | Tracking |
| ---- | ------ | ------------------ | ------ | -------- |
| Display | Inter (variable) | clamp(40px, 6vw, 68px) / 1.02 | 640 | −0.035em |
| H2 | Inter | 28px / 1.15 | 620 | −0.02em |
| H3 | Inter | 16px / 1.4 | 600 | −0.005em |
| Body | Inter | 16px / 1.6 | 420 | 0 |
| Small | Inter | 13px / 1.5 | 450 | 0 |
| Mono | JetBrains Mono (variable) | 13px / 1.65 | 420 | 0 |
| Eyebrow | JetBrains Mono | 12px / 1 | 500 | 0.04em, uppercase |

Fonts are self-hosted (`site/assets/fonts/`, SIL OFL) so the site renders the same on Pages, locally and in screenshots.

## Terminal output conventions

Every command follows the same shape:

```text
                                   ← blank line
crew · <command> <subject>  v0.1.0 ← heading: bold cyan mark, dim separator and version
                                   ← blank line
  + CLAUDE.md          project rules     ← 2-space gutter, glyph, padded path, dim note
  · docs/PLAN.md       exists, kept (use --force to replace)   ← yellow note, dim path
                                   ← blank line
  9 created · 1 kept               ← summary: colored counts, dim separators
```

| Glyph | Word | Color | Meaning |
| ----- | ---- | ----- | ------- |
| `+` | created | green | New file |
| `~` | updated | cyan | crew-managed file rewritten (only marked sections) |
| `·` | kept / unchanged | dim | Existing file left alone |
| `✓` | passed | green | Doctor check passed |
| `!` | warning | yellow | Works, but worth fixing |
| `✗` | error | red | Must fix; exit code 1 |
| `◆` | gate | magenta | Requires the human owner |

Rules:

- Paths are relative to the project root and padded into one column.
- Doctor details sit under their check behind a dim `│` rail, one problem per line, each saying **what** and **where** (`file:line`).
- The verdict is a single badge line: `HEALTHY` on green or `NEEDS WORK` on red, followed by the tally.
- Errors that a user can fix end with the command to run.
- Secrets are never echoed: matches are redacted to the first four and last two characters.

## Components (site)

| Component | Notes |
| --------- | ----- |
| Terminal window | Dark in both themes, three muted window dots, title in mono `--term-dim`, 14px radius |
| Command pill | Mono, `--surface-2`, copy button with `aria-label="Copy command"` and a 1.2s "Copied" state |
| File tree | Mono, folders in `--text-muted`, files in `--text`, selected row on `--accent-soft` with a 2px accent bar |
| Role card | Title, agent id in mono, one-line "owns"; gate badge when the role brings one |
| Gate badge | `◆ G2 Design`, magenta text on a 10% magenta background |

## Accessibility

- Text contrast ≥ 4.5:1 in both themes (`--text-faint` is used only for non-essential metadata).
- Visible focus: 2px `--accent` ring with 2px offset on every interactive element.
- The demo is fully keyboard operable; the file tree uses `role="tree"` with arrow-key navigation.
- Touch targets ≥ 44px on mobile.
- Theme follows `prefers-color-scheme`, with a manual toggle stored per viewer.

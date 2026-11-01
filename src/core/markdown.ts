/** Minimal Markdown helpers for the structures crew generates and reads back. */

export interface Section {
  heading: string;
  body: string;
}

export function findSection(source: string, heading: RegExp): Section | undefined {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex(
    (l) => /^#{1,6}\s/.test(l) && heading.test(l.replace(/^#+\s*/, '')),
  );
  if (start === -1) return undefined;
  const level = /^#+/.exec(lines[start] ?? '')?.[0].length ?? 2;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = /^(#+)\s/.exec(lines[i] ?? '');
    if (m?.[1] && m[1].length <= level) {
      end = i;
      break;
    }
  }
  return { heading: lines[start] ?? '', body: lines.slice(start + 1, end).join('\n') };
}

/** Parses the first GitHub-flavoured table in `source` into header + rows. */
export function parseTable(source: string): { header: string[]; rows: string[][] } | undefined {
  const lines = source.split(/\r?\n/).map((l) => l.trim());
  const isRow = (l: string) => l.startsWith('|') && l.endsWith('|');
  const isSep = (l: string) => /^\|(\s*:?-{3,}:?\s*\|)+$/.test(l);
  const first = lines.findIndex((l, i) => isRow(l) && isSep(lines[i + 1] ?? ''));
  if (first === -1) return undefined;
  const cells = (l: string) =>
    l
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());
  const rows: string[][] = [];
  for (let i = first + 2; i < lines.length && isRow(lines[i] ?? ''); i++)
    rows.push(cells(lines[i] ?? ''));
  return { header: cells(lines[first] ?? ''), rows };
}

export function codeSpans(cell: string): string[] {
  return [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? '');
}

/** Pulls a local file path out of a table cell: a link target or a code span. */
export function pathFromCell(cell: string): string | undefined {
  const link = /\]\(([^)\s#]+)(?:#[^)]*)?\)/.exec(cell)?.[1];
  const candidate = link ?? codeSpans(cell)[0];
  if (!candidate || /^[a-z]+:\/\//i.test(candidate)) return undefined;
  return candidate.replace(/^\.\//, '');
}

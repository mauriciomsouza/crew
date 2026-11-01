import pc from 'picocolors';
import type { CheckResult, DoctorReport, GeneratedFile, Status } from '../core/index.js';
import type { WriteResult } from './fs.js';

/**
 * Terminal output conventions (see docs/design/DESIGN_SPEC.md, "Terminal"):
 * - one accent color (cyan) for the brand mark and interactive focus only
 * - status glyphs always paired with a word, never color alone
 * - paths are the primary content: default weight; explanations are dim
 * - two-space left gutter for everything below a heading
 */
export const glyph = {
  pass: pc.green('✓'),
  warn: pc.yellow('!'),
  fail: pc.red('✗'),
  add: pc.green('+'),
  update: pc.cyan('~'),
  skip: pc.dim('·'),
  gate: pc.magenta('◆'),
};

export function mark(): string {
  return `${pc.bold(pc.cyan('crew'))}`;
}

export function heading(text: string, version?: string): string {
  return `\n${mark()} ${pc.dim('·')} ${text}${version ? pc.dim(`  v${version}`) : ''}\n`;
}

const kindLabel: Record<GeneratedFile['kind'], string> = {
  rules: 'project rules',
  team: 'roles, flow, owner gates',
  plan: 'phases and gates',
  agent: 'agent',
  doc: 'source of truth',
  config: 'crew settings',
};

export function fileList(files: GeneratedFile[], result: WriteResult): string {
  const width = Math.max(...files.map((f) => f.path.length));
  const status = (path: string) => {
    if (result.written.includes(path)) return glyph.add;
    if (result.overwritten.includes(path)) return glyph.update;
    return glyph.skip;
  };
  return files
    .map((f) => {
      const skipped = result.skipped.includes(f.path);
      const unchanged = result.unchanged.includes(f.path);
      const note = skipped
        ? pc.yellow('exists, kept (use --force to replace)')
        : unchanged
          ? pc.dim('unchanged')
          : pc.dim(kindLabel[f.kind]);
      const path = skipped || unchanged ? pc.dim(f.path.padEnd(width)) : f.path.padEnd(width);
      return `  ${status(f.path)} ${path}  ${note}`;
    })
    .join('\n');
}

export function summaryLine(result: WriteResult, dryRun = false): string {
  const parts = [
    result.written.length && pc.green(`${result.written.length} created`),
    result.overwritten.length && pc.cyan(`${result.overwritten.length} updated`),
    result.skipped.length && pc.yellow(`${result.skipped.length} kept`),
    result.unchanged.length && pc.dim(`${result.unchanged.length} unchanged`),
  ].filter(Boolean);
  return `  ${parts.join(pc.dim(' · '))}${dryRun ? pc.dim('  (dry run, nothing written)') : ''}`;
}

const statusGlyph: Record<Status, string> = {
  pass: glyph.pass,
  warn: glyph.warn,
  fail: glyph.fail,
};

function checkBlock(c: CheckResult): string {
  const title = c.status === 'fail' ? pc.bold(c.title) : c.title;
  const lines = [`  ${statusGlyph[c.status]} ${title}`];
  const detailColor = c.status === 'pass' ? pc.dim : (s: string) => s;
  for (const d of c.details) lines.push(`    ${pc.dim('│')} ${detailColor(d)}`);
  return lines.join('\n');
}

export function doctorReport(report: DoctorReport): string {
  const body = report.checks.map(checkBlock).join('\n');
  const passed = report.checks.filter((c) => c.status === 'pass').length;
  const tally = [
    pc.green(`${passed} passed`),
    report.warnings > 0 &&
      pc.yellow(`${report.warnings} warning${report.warnings === 1 ? '' : 's'}`),
    report.errors > 0 && pc.red(`${report.errors} error${report.errors === 1 ? '' : 's'}`),
  ].filter(Boolean);
  const verdict = report.ok
    ? `${pc.bgGreen(pc.black(' HEALTHY '))} ${tally.join(pc.dim(' · '))}`
    : `${pc.bgRed(pc.white(' NEEDS WORK '))} ${tally.join(pc.dim(' · '))}`;
  return `${body}\n\n  ${verdict}\n`;
}

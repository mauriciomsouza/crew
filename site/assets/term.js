// Renders crew's terminal output as HTML from the real core results, following
// the conventions in docs/design/DESIGN_SPEC.md ("Terminal output conventions").
// Kept in sync with src/node/ui.ts by the same spec; both are reviewed by design.

export const VERSION = '0.1.0';

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const span = (cls, text) => `<span class="${cls}">${esc(text)}</span>`;
/** Doctor messages mark identifiers with backticks; show them in the accent instead. */
const code = (text) => esc(text).replace(/`([^`]+)`/g, '<span class="t-cyan">$1</span>');
export const dim = (t) => span('t-dim', t);
export const cyan = (t) => span('t-cyan', t);
export const green = (t) => span('t-green', t);
export const yellow = (t) => span('t-yellow', t);
export const red = (t) => span('t-red', t);
export const bold = (t) => span('t-b', t);

const KIND = {
  rules: 'project rules',
  team: 'roles, flow, owner gates',
  plan: 'phases and gates',
  agent: 'agent',
  doc: 'source of truth',
  config: 'crew settings',
};

export function prompt(command) {
  return `${span('t-green', '❯')} ${esc(command)}`;
}

export function heading(text) {
  return ['', `${span('t-cyan t-b', 'crew')} ${dim('·')} ${text}${dim(`  v${VERSION}`)}`, ''];
}

/**
 * @param {{path:string, kind:string}[]} files
 * @param {{created?:string[], updated?:string[], kept?:string[]}} status
 */
export function fileLines(files, status = {}) {
  const width = Math.max(...files.map((f) => f.path.length));
  return files.map((f) => {
    const pad = f.path.padEnd(width);
    if (status.kept?.includes(f.path)) {
      return `  ${dim('·')} ${dim(pad)}  ${yellow('exists, kept (use --force to replace)')}`;
    }
    const glyph = status.updated?.includes(f.path) ? span('t-cyan', '~') : green('+');
    return `  ${glyph} ${esc(pad)}  ${dim(KIND[f.kind] ?? f.kind)}`;
  });
}

export function summary({ created = 0, updated = 0, kept = 0 }) {
  const parts = [];
  if (created) parts.push(green(`${created} created`));
  if (updated) parts.push(cyan(`${updated} updated`));
  if (kept) parts.push(yellow(`${kept} kept`));
  return `  ${parts.join(dim(' · '))}`;
}

export function initOutput(config, files) {
  return [
    ...heading(`init ${bold(config.name)}`),
    ...fileLines(files),
    '',
    summary({ created: files.length }),
    '',
    `  ${bold('Next')}`,
    `  ${dim('1.')} Open Claude Code here and say: ${cyan('"Read CLAUDE.md and docs/AGENT_TEAM.md, then propose the first brief."')}`,
    `  ${dim('2.')} Run ${cyan('npx create-crew doctor')} whenever you change the team.`,
  ];
}

export function addOutput(role, plan) {
  const files = [...plan.create, ...plan.update];
  return [
    ...heading(`add ${bold(role)}`),
    ...fileLines(files, { updated: plan.update.map((f) => f.path) }),
    '',
    summary({ created: plan.create.length, updated: plan.update.length }),
  ];
}

const GLYPH = { pass: green('✓'), warn: yellow('!'), fail: red('✗') };

export function doctorOutput(report, folder) {
  const lines = [...heading(`doctor ${dim(folder)}`)];
  for (const c of report.checks) {
    lines.push(`  ${GLYPH[c.status]} ${c.status === 'fail' ? bold(c.title) : esc(c.title)}`);
    for (const d of c.details) lines.push(`    ${dim('│')} ${c.status === 'pass' ? dim(d) : code(d)}`);
  }
  const passed = report.checks.filter((c) => c.status === 'pass').length;
  const tally = [green(`${passed} passed`)];
  if (report.warnings) tally.push(yellow(`${report.warnings} warning${report.warnings === 1 ? '' : 's'}`));
  if (report.errors) tally.push(red(`${report.errors} error${report.errors === 1 ? '' : 's'}`));
  const badge = report.ok ? span('t-badge-ok', ' HEALTHY ') : span('t-badge-bad', ' NEEDS WORK ');
  lines.push('', `  ${badge} ${tally.join(dim(' · '))}`);
  return lines;
}

/** Types lines into `el`, line by line; instant when reduced motion is on. */
export async function play(el, lines, { delay = 38, signal } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.innerHTML = '';
  for (const line of lines) {
    if (signal?.aborted) return;
    el.insertAdjacentHTML('beforeend', `${line}\n`);
    if (!reduce) await new Promise((r) => setTimeout(r, line === '' ? delay * 2 : delay));
  }
}

/** Types a command character by character after a prompt. */
export async function type(el, command, { speed = 34, signal } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    el.insertAdjacentHTML('beforeend', `${prompt(command)}\n`);
    return;
  }
  el.insertAdjacentHTML('beforeend', `${span('t-green', '❯')} `);
  const node = document.createElement('span');
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  el.append(node, cursor);
  for (const ch of command) {
    if (signal?.aborted) return;
    node.textContent += ch;
    await new Promise((r) => setTimeout(r, speed + Math.random() * 30));
  }
  await new Promise((r) => setTimeout(r, 260));
  cursor.remove();
  el.insertAdjacentText('beforeend', '\n');
}

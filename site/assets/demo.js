// The live demo. All generation, add-planning and validation is done by the
// real crew core (./crew.js, bundled from src/core); this file only renders.
import {
  DEFAULT_ROLES,
  ROLES,
  ROLE_IDS,
  gatesFor,
  memoryRepo,
  planAdd,
  planInit,
  runDoctor,
  withDefaults,
} from './crew.js';
import { addOutput, dim, doctorOutput, initOutput, play, prompt, red, type } from './term.js';
import { initTheme } from './theme.js';

initTheme();

const $ = (s) => document.querySelector(s);
const term = $('#term');
const form = $('#config');
const picks = $('#role-picks');
const hint = $('#roles-hint');

/** @type {Record<string, string>} */
let files = {};
/** @type {Record<string, string>} */
let pristine = {};
/** @type {Map<string, 'new'|'updated'|'broken'>} */
const badges = new Map();
let selected = '';
let folder = 'parcel';
let busy = false;

// ---- Role picker ----------------------------------------------------------
const gateOf = new Map(gatesFor([...ROLE_IDS]).map((g) => [g.role, g]));
picks.innerHTML = ROLE_IDS.map((id) => {
  const r = ROLES[id];
  const g = gateOf.get(id);
  return `<label class="pick"><input type="checkbox" name="roles" value="${id}" ${DEFAULT_ROLES.includes(id) ? 'checked' : ''} />
    <span class="label"><b>${r.title}</b><small>${r.owns}</small></span>${g ? `<span class="gate" title="Owner gate: ${g.question}">◆ ${g.name}</span>` : '<span></span>'}</label>`;
}).join('');

function chosenRoles() {
  return [...form.querySelectorAll('input[name=roles]:checked')].map((i) => i.value);
}
function syncHint() {
  const n = chosenRoles().length;
  hint.classList.toggle('error', n === 0);
  hint.textContent = n === 0 ? 'Pick at least one role.' : `${n} role${n === 1 ? '' : 's'} + orchestrator = a crew of ${n + 1}.`;
}
picks.addEventListener('change', syncHint);
syncHint();

// ---- Terminal -------------------------------------------------------------
async function run(command, lines) {
  busy = true;
  setBusy(true);
  term.insertAdjacentHTML('beforeend', term.textContent.trim() ? '\n' : '');
  await type(term, command, { speed: 18 });
  const out = document.createElement('span');
  term.append(out);
  await play(out, lines, { delay: 22 });
  term.scrollTop = term.scrollHeight;
  busy = false;
  setBusy(false);
}
function setBusy(on) {
  for (const b of document.querySelectorAll('.chip, .run')) b.disabled = on;
}

// ---- Init -----------------------------------------------------------------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (busy) return;
  const data = new FormData(form);
  const roles = chosenRoles();
  if (roles.length === 0) {
    syncHint();
    return;
  }
  const config = withDefaults({
    name: String(data.get('name') || 'Parcel'),
    description: String(data.get('description') ?? ''),
    stack: String(data.get('stack') ?? ''),
    roles,
  });
  folder = config.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
  $('#term-title').textContent = `~/${folder}`;
  const plan = planInit(config);
  files = Object.fromEntries(plan.map((f) => [f.path, f.content]));
  pristine = { ...files };
  badges.clear();
  plan.forEach((f) => badges.set(f.path, 'new'));
  term.innerHTML = '';
  const flags = `--name ${quote(config.name)} --roles ${roles.join(',')}`;
  await run(`npx create-crew --yes ${flags}`, initOutput(config, plan));
  $('#actions').hidden = false;
  $('#breakers').hidden = false;
  $('#workspace').hidden = false;
  syncAddSelect();
  renderTree();
  open(plan.find((f) => f.kind === 'agent')?.path ?? 'CLAUDE.md');
});
const quote = (s) => (/^[\w.-]+$/.test(s) ? s : `"${s}"`);

// ---- Add / doctor ---------------------------------------------------------
function syncAddSelect() {
  const select = $('#add-role');
  const missing = ROLE_IDS.filter((id) => !(`.claude/agents/${id}.md` in files));
  select.innerHTML = missing.length
    ? missing.map((id) => `<option value="${id}">${id}</option>`).join('')
    : '<option value="">all roles added</option>';
  $('[data-action=add]').dataset.empty = missing.length ? '' : 'true';
}

$('#actions').addEventListener('click', async (e) => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (!action || busy) return;
  if (action === 'doctor') {
    const report = runDoctor(memoryRepo(files));
    await run('npx crew doctor', [...doctorOutput(report, folder), '', dim(`exit ${report.ok ? 0 : 1}`)]);
  }
  if (action === 'add') {
    const role = $('#add-role').value;
    if (!role) {
      await run('npx crew add', [`${red('✗')} Every role is already on the team.`]);
      return;
    }
    const plan = planAdd(memoryRepo(files), role);
    for (const f of plan.create) {
      files[f.path] = f.content;
      badges.set(f.path, 'new');
    }
    for (const f of plan.update) {
      if (files[f.path] !== f.content) badges.set(f.path, 'updated');
      files[f.path] = f.content;
    }
    pristine = { ...pristine, ...Object.fromEntries([...plan.create, ...plan.update].map((f) => [f.path, f.content])) };
    await run(`npx crew add ${role}`, addOutput(role, plan));
    syncAddSelect();
    renderTree();
    open(`.claude/agents/${role}.md`);
  }
});

// ---- Breakers -------------------------------------------------------------
$('#breakers').addEventListener('click', async (e) => {
  const kind = e.target.closest('[data-break]')?.dataset.break;
  if (!kind || busy) return;
  const agents = Object.keys(files).filter((p) => p.startsWith('.claude/agents/')).sort();
  const last = agents.at(-1);
  let note = '';
  if (kind === 'reset') {
    files = { ...pristine };
    for (const [p, b] of badges) if (b === 'broken') badges.delete(p);
    note = 'Restored every file.';
  } else if (kind === 'delete-agent' && last) {
    delete files[last];
    note = `rm ${last}`;
  } else if (kind === 'frontmatter' && agents[0]) {
    files[agents[0]] = files[agents[0]].replace(/^---\nname: [^\n]+/, '---\nname: [oops');
    badges.set(agents[0], 'broken');
    note = `Broke the YAML in ${agents[0]}`;
  } else if (kind === 'secret' && agents[0]) {
    // A fake, correctly shaped key; it is generated here and never valid.
    const fake = `sk-ant-api03-${Array.from({ length: 32 }, (_, i) => 'Ab3dEf7hJk9mNp2q'[i % 16]).join('')}`;
    files[agents[0]] += `\nWhen calling the API use ${fake}\n`;
    badges.set(agents[0], 'broken');
    note = `Pasted an API key into ${agents[0]}`;
  } else if (kind === 'source') {
    const doc = Object.keys(files).find((p) => p.startsWith('docs/') && !/AGENT_TEAM|PLAN/.test(p));
    if (doc) {
      delete files[doc];
      note = `rm ${doc}`;
    }
  }
  if (note) term.insertAdjacentHTML('beforeend', `\n${dim(`# ${note}`)}\n`);
  term.scrollTop = term.scrollHeight;
  renderTree();
  if (!(selected in files)) open(Object.keys(files).find((p) => p.startsWith('.claude/agents/')) ?? 'CLAUDE.md');
  else open(selected);
});

// ---- Tree -----------------------------------------------------------------
const ICON_DIR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>';
const ICON_FILE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/></svg>';

function buildTree(paths) {
  const root = {};
  for (const p of paths) {
    const parts = p.split('/');
    let node = root;
    parts.forEach((part, i) => {
      node[part] ??= i === parts.length - 1 ? p : {};
      node = node[part];
    });
  }
  return root;
}
function sortEntries(obj) {
  return Object.entries(obj).sort(([a, av], [b, bv]) => {
    const ad = typeof av === 'object';
    const bd = typeof bv === 'object';
    if (ad !== bd) return ad ? -1 : 1;
    return a.localeCompare(b);
  });
}
function renderTree() {
  const rows = [];
  const walk = (obj, depth) => {
    for (const [name, v] of sortEntries(obj)) {
      const pad = `padding-left:${10 + depth * 16}px`;
      if (typeof v === 'object') {
        rows.push(`<div class="node dir" role="treeitem" aria-expanded="true" aria-level="${depth + 1}" style="${pad}">${ICON_DIR}${name}/</div>`);
        walk(v, depth + 1);
      } else {
        const b = badges.get(v);
        rows.push(
          `<div class="node" role="treeitem" tabindex="-1" aria-level="${depth + 1}" aria-selected="${v === selected}" data-file="${v}" style="${pad}">${ICON_FILE}<span>${name}</span>${b ? `<span class="badge ${b}">${b}</span>` : ''}</div>`,
        );
      }
    }
  };
  walk(buildTree(Object.keys(files)), 0);
  $('#tree').innerHTML = rows.join('');
  const n = Object.keys(files).length;
  $('#ws-count').textContent = `${n} file${n === 1 ? '' : 's'}`;
  const focusable = $('#tree').querySelector('[aria-selected=true]') ?? $('#tree').querySelector('[data-file]');
  if (focusable) focusable.tabIndex = 0;
}
$('#tree').addEventListener('click', (e) => {
  const f = e.target.closest('[data-file]')?.dataset.file;
  if (f) open(f);
});
$('#tree').addEventListener('keydown', (e) => {
  const items = [...$('#tree').querySelectorAll('[data-file]')];
  const i = items.indexOf(document.activeElement);
  if (i === -1) return;
  const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
  if (next !== undefined) {
    e.preventDefault();
    items[Math.max(0, Math.min(items.length - 1, next))].focus();
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    open(items[i].dataset.file);
    $('#tree').querySelector('[aria-selected=true]')?.focus();
  }
});

// ---- Viewer ---------------------------------------------------------------
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
function highlight(src, path) {
  if (path.endsWith('.json')) return esc(src).replace(/("[^"]+")(:)/g, '<span class="md-key">$1</span>$2');
  let inFm = src.startsWith('---\n');
  let fmFences = 0;
  let inCode = false;
  return src
    .split('\n')
    .map((raw) => {
      const line = esc(raw);
      if (inFm) {
        if (raw === '---') {
          fmFences += 1;
          if (fmFences === 2) inFm = false;
          return `<span class="md-fm">${line}</span>`;
        }
        return line.replace(/^([\w-]+):/, '<span class="md-key">$1</span>:');
      }
      if (raw.startsWith('```')) {
        inCode = !inCode;
        return `<span class="md-code">${line}</span>`;
      }
      if (inCode) return `<span class="md-code">${line}</span>`;
      if (/^# /.test(raw)) return `<span class="md-h md-h1">${line}</span>`;
      if (/^#{2,6} /.test(raw)) return `<span class="md-h">${line}</span>`;
      if (/^<!--/.test(raw)) return `<span class="md-comment">${line}</span>`;
      if (/^\|/.test(raw)) return `<span class="md-table">${line}</span>`;
      return line
        .replace(/^(\s*)([-*]|\d+\.) /, '$1<span class="md-bullet">$2</span> ')
        .replace(/\*\*([^*]+)\*\*/g, '<span class="md-bold">**$1**</span>')
        .replace(/`([^`]+)`/g, '<span class="md-code">`$1`</span>');
    })
    .join('\n');
}
function open(path) {
  if (!(path in files)) return;
  selected = path;
  const content = files[path];
  $('#viewer-path').textContent = path;
  const lines = content.split('\n').length;
  $('#viewer-meta').textContent = `${lines} lines · ${new Blob([content]).size.toLocaleString()} bytes`;
  $('#viewer').innerHTML = highlight(content, path);
  $('#viewer').scrollTop = 0;
  for (const n of document.querySelectorAll('#tree [data-file]')) {
    const on = n.dataset.file === path;
    n.setAttribute('aria-selected', String(on));
    n.tabIndex = on ? 0 : -1;
  }
}

// Allow deep links like demo.html#run for screenshots and sharing.
if (location.hash === '#run') form.requestSubmit();
export { prompt };

import {
  ROLES,
  ROLE_IDS,
  flowDiagram,
  gatesFor,
  memoryRepo,
  planInit,
  runDoctor,
  withDefaults,
} from './crew.js';
import { dim, doctorOutput, initOutput, play, type } from './term.js';
import { initTheme } from './theme.js';

initTheme();

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

// Everything below is computed by the real crew core (site/assets/crew.js),
// the same code `npx create-crew` runs.
const config = withDefaults({
  name: 'Parcel',
  description: 'A habit tracker for people who keep breaking streaks.',
  roles: ['business', 'design', 'dev', 'qa'],
});
const files = planInit(config);
const repo = Object.fromEntries(files.map((f) => [f.path, f.content]));

// Hero: init, then doctor, then a short pause, on loop while visible.
const hero = document.getElementById('hero-term');
async function heroLoop() {
  const report = runDoctor(memoryRepo(repo));
  for (;;) {
    hero.innerHTML = '';
    await type(hero, 'npx create-crew --yes --name Parcel');
    const out = document.createElement('span');
    hero.append(out);
    await play(out, initOutput(config, files).slice(0, -3), { delay: 55 });
    await new Promise((r) => setTimeout(r, 700));
    await type(hero, 'npx create-crew doctor');
    const out2 = document.createElement('span');
    hero.append(out2);
    await play(out2, doctorOutput(report, 'parcel').filter((l) => !l.includes('│')), { delay: 70 });
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.static) return;
    await new Promise((r) => setTimeout(r, 5200));
  }
}
heroLoop();

// Flow diagram, straight from the generator, with gates highlighted.
const all = withDefaults({ name: 'crew', roles: [...ROLE_IDS] }).roles;
document.getElementById('flow').innerHTML = flowDiagram(all)
  .split('\n')
  .filter((l) => !l.startsWith('```'))
  .map((l) =>
    esc(l)
      .replace(/(◆ G\d \w+)/g, '<span class="t-magenta">$1</span>')
      .replace(/(✗ FAIL → back to author)/, '<span class="t-red">$1</span>')
      .replace(/^(Owner|Orchestrator)/, '<span class="t-b">$1</span>')
      .replace(/(─▶ )([a-z]+)/, '$1<span class="t-cyan">$2</span>')
      .replace(/^(◆ stops.*)$/, '<span class="t-dim">$1</span>'),
  )
  .join('\n');

// Role cards.
const gates = new Map(gatesFor(all).map((g) => [g.role, g]));
const defaults = new Set(config.roles);
const cards = [
  `<article class="role lead"><header><h3>Orchestrator</h3><span class="tag">main session</span></header><p>Writes briefs, routes handoffs, keeps the plan, and stops at every gate.</p><span class="gate">◆ G0 Kickoff</span></article>`,
  ...ROLE_IDS.map((id) => {
    const r = ROLES[id];
    const g = gates.get(id);
    return `<article class="role"><header><h3>${r.title}</h3><span class="tag">${id}</span></header><p>${r.owns}.</p>${
      g ? `<span class="gate">◆ ${g.id} ${g.name}</span>` : defaults.has(id) ? '' : ''
    }${defaults.has(id) ? '' : `<span class="muted" style="font-size:12px;margin-top:${g ? '0' : 'auto'}">optional · <code>crew add ${id}</code></span>`}</article>`;
  }),
];
document.getElementById('role-grid').innerHTML = cards.join('');

// Doctor: the same repo with the qa agent deleted.
const broken = { ...repo };
delete broken['.claude/agents/qa.md'];
const report = runDoctor(memoryRepo(broken));
document.getElementById('doctor-term').innerHTML = [
  `<span class="t-green">❯</span> npx create-crew doctor`,
  ...doctorOutput(report, 'parcel'),
  '',
  `${dim('exit 1')}`,
].join('\n');

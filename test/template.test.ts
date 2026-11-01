import { describe, expect, it } from 'vitest';
import { render } from '../src/core/template.js';
import { AGENT_TEMPLATES, DOC_TEMPLATES } from '../src/core/templates.js';
import { ROLE_IDS } from '../src/core/roles.js';

describe('render', () => {
  it('replaces variables', () => {
    expect(render('Hi {{a.b}}!', { vars: { 'a.b': 'there' }, flags: {} })).toBe('Hi there!');
  });

  it('keeps or drops if-blocks', () => {
    const t = 'a\n{{#if x}}\nyes\n{{/if}}\nb';
    expect(render(t, { vars: {}, flags: { x: true } })).toBe('a\nyes\nb');
    expect(render(t, { vars: {}, flags: { x: false } })).toBe('a\nb');
  });

  it('throws on unknown variables so typos never ship', () => {
    expect(() => render('{{nope}}', { vars: {}, flags: {} })).toThrow(
      /Unknown template variable: nope/,
    );
  });
});

describe('templates', () => {
  it('has an agent template for every role', () => {
    for (const id of ROLE_IDS)
      expect(AGENT_TEMPLATES[id]).toMatch(new RegExp(`^---\\nname: ${id}\\n`));
  });

  it.each(ROLE_IDS)('%s template has the sections every role needs', (id) => {
    const t = AGENT_TEMPLATES[id];
    for (const section of [
      '## Before you start',
      '## You own',
      '## You do not',
      '## How you work',
      '## Definition of done',
      '## Handoff',
      '## Escalate to the owner when',
    ]) {
      expect(t).toContain(section);
    }
  });

  it('keeps every managed section behind markers', () => {
    expect(DOC_TEMPLATES.claude).toContain('<!-- crew:sources:start -->');
    for (const m of ['roles', 'flow', 'gates'])
      expect(DOC_TEMPLATES.agentTeam).toContain(`<!-- crew:${m}:start -->`);
    expect(DOC_TEMPLATES.plan).toContain('<!-- crew:plan-gates:start -->');
  });
});

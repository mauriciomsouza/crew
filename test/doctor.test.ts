import { describe, expect, it } from 'vitest';
import { memoryRepo, runDoctor, type DoctorReport } from '../src/core/doctor.js';
import { planInit, withDefaults } from '../src/core/generate.js';
import { findSecrets } from '../src/core/secrets.js';

function healthy(): Record<string, string> {
  const files = planInit(withDefaults({ name: 'Parcel', roles: ['business', 'dev', 'qa'] }));
  return Object.fromEntries(files.map((f) => [f.path, f.content]));
}

const status = (r: DoctorReport, id: string) => r.checks.find((c) => c.id === id)?.status;
const details = (r: DoctorReport, id: string) =>
  r.checks.find((c) => c.id === id)?.details.join('\n') ?? '';

describe('doctor', () => {
  it('passes a freshly generated repo', () => {
    const report = runDoctor(memoryRepo(healthy()));
    expect(report.ok).toBe(true);
    expect(report.errors).toBe(0);
    expect(report.warnings).toBe(0);
  });

  it('fails when there is nothing to check', () => {
    const report = runDoctor(memoryRepo({}));
    expect(report.ok).toBe(false);
    expect(details(report, 'core-docs')).toContain('CLAUDE.md is missing');
  });

  it('rejects broken frontmatter', () => {
    const files = healthy();
    files['.claude/agents/dev.md'] = 'no frontmatter here';
    files['.claude/agents/qa.md'] = '---\nname: [unclosed\n---\nbody';
    const report = runDoctor(memoryRepo(files));
    expect(status(report, 'frontmatter')).toBe('fail');
    expect(details(report, 'frontmatter')).toContain('dev.md: missing frontmatter');
    expect(details(report, 'frontmatter')).toContain('qa.md: invalid YAML');
  });

  it('requires name to match the file and a description', () => {
    const files = healthy();
    files['.claude/agents/dev.md'] = `---\nname: developer\ntools: Read\n---\n${'x'.repeat(300)}`;
    const d = details(runDoctor(memoryRepo(files)), 'frontmatter');
    expect(d).toContain('`name` is "developer" but the file is dev.md');
    expect(d).toContain('`description` is required');
  });

  it('warns, but does not fail, on unknown tools', () => {
    const files = healthy();
    files['.claude/agents/dev.md'] = (files['.claude/agents/dev.md'] ?? '').replace(
      'tools: Read,',
      'tools: Telepathy, Read,',
    );
    const report = runDoctor(memoryRepo(files));
    expect(report.ok).toBe(true);
    expect(status(report, 'frontmatter')).toBe('warn');
    expect(details(report, 'frontmatter')).toContain('unrecognised tools Telepathy');
  });

  it('flags a role in AGENT_TEAM.md without an agent file', () => {
    const files = healthy();
    delete files['.claude/agents/qa.md'];
    const report = runDoctor(memoryRepo(files));
    expect(status(report, 'roster')).toBe('fail');
    expect(details(report, 'roster')).toContain(
      '`qa` is in AGENT_TEAM.md but .claude/agents/qa.md does not exist',
    );
  });

  it('flags an agent file missing from AGENT_TEAM.md', () => {
    const files = healthy();
    files['.claude/agents/legal.md'] =
      `---\nname: legal\ndescription: Reviews terms of service and licences for the project.\ntools: Read\n---\n${'x'.repeat(300)}`;
    const d = details(runDoctor(memoryRepo(files)), 'roster');
    expect(d).toContain(
      '.claude/agents/legal.md exists but `legal` is not in the AGENT_TEAM.md roles table',
    );
  });

  it('flags source-of-truth documents that do not exist', () => {
    const files = healthy();
    delete files['docs/business/BUSINESS.md'];
    const report = runDoctor(memoryRepo(files));
    expect(status(report, 'sources')).toBe('fail');
    expect(details(report, 'sources')).toContain(
      'docs/business/BUSINESS.md is listed in CLAUDE.md but does not exist',
    );
  });

  it('finds secrets in agent files and redacts them in the report', () => {
    const files = healthy();
    const key = `sk-ant-api03-${'A1b2C3d4'.repeat(4)}`;
    files['.claude/agents/dev.md'] += `\nUse this key: ${key}\n`;
    const report = runDoctor(memoryRepo(files));
    expect(report.ok).toBe(false);
    const d = details(report, 'secrets');
    expect(d).toMatch(/dev\.md:\d+ looks like a Anthropic API key/);
    expect(d).not.toContain(key);
  });
});

describe('findSecrets', () => {
  it('catches common token formats', () => {
    const hits = findSecrets(
      [
        'AKIAABCDEFGHIJKLMNOP',
        `ghp_${'a'.repeat(36)}`,
        'password = "hunter2hunter2hunter2"',
        '-----BEGIN PRIVATE KEY-----',
      ].join('\n'),
    );
    expect(hits.map((h) => h.rule)).toEqual([
      'AWS access key',
      'GitHub token',
      'hard-coded credential',
      'private key',
    ]);
  });

  it('ignores placeholders and prose about secrets', () => {
    const text = [
      'Never commit secrets. Reference them by environment variable name.',
      'API_KEY=${API_KEY}',
      'token: <your-token-here>',
      'password = changeme-changeme-changeme',
    ].join('\n');
    expect(findSecrets(text)).toEqual([]);
  });
});

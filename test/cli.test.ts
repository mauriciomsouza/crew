import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { add, doctor, init } from '../src/node/commands.js';
import { captureIo, tempDir } from './helpers.js';

const read = (dir: string, p: string) => readFileSync(join(dir, p), 'utf8');

describe('crew init', () => {
  it('scaffolds the chosen roles non-interactively', async () => {
    const dir = tempDir();
    const io = captureIo(dir);
    const code = await init(io, { yes: true, name: 'Parcel', roles: 'dev,qa' });
    expect(code).toBe(0);
    expect(existsSync(join(dir, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(dir, '.claude/agents/dev.md'))).toBe(true);
    expect(existsSync(join(dir, '.claude/agents/qa.md'))).toBe(true);
    expect(existsSync(join(dir, '.claude/agents/design.md'))).toBe(false);
    expect(io.output()).toContain('+ .claude/agents/dev.md');
    expect(io.output()).toMatch(/\d+ created/);
  });

  it('defaults to business, design, dev and qa', async () => {
    const dir = tempDir();
    await init(captureIo(dir), { yes: true, name: 'Parcel' });
    for (const r of ['business', 'design', 'dev', 'qa'])
      expect(existsSync(join(dir, `.claude/agents/${r}.md`))).toBe(true);
    expect(existsSync(join(dir, '.claude/agents/infra.md'))).toBe(false);
  });

  it('never overwrites an existing file without --force', async () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'CLAUDE.md'), '# My own rules\n');
    const io = captureIo(dir);
    await init(io, { yes: true, name: 'Parcel', roles: 'dev' });
    expect(read(dir, 'CLAUDE.md')).toBe('# My own rules\n');
    expect(io.output()).toContain('exists, kept (use --force to replace)');
    expect(io.output()).toContain('CLAUDE.md already existed and was kept');
  });

  it('replaces existing files with --force', async () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'CLAUDE.md'), '# My own rules\n');
    await init(captureIo(dir), { yes: true, force: true, name: 'Parcel', roles: 'dev' });
    expect(read(dir, 'CLAUDE.md')).toMatch(/^# Parcel\n/);
  });

  it('is idempotent: a second run changes nothing', async () => {
    const dir = tempDir();
    await init(captureIo(dir), { yes: true, name: 'Parcel', roles: 'dev' });
    const io = captureIo(dir);
    await init(io, { yes: true, name: 'Parcel', roles: 'dev' });
    expect(io.output()).toMatch(/\d+ unchanged/);
    expect(io.output()).not.toMatch(/created|kept/);
  });

  it('writes nothing with --dry-run', async () => {
    const dir = tempDir();
    const io = captureIo(dir);
    await init(io, { yes: true, dryRun: true, name: 'Parcel' });
    expect(existsSync(join(dir, 'CLAUDE.md'))).toBe(false);
    expect(io.output()).toContain('dry run, nothing written');
  });

  it('rejects unknown roles', async () => {
    await expect(init(captureIo(tempDir()), { yes: true, roles: 'dev,wizard' })).rejects.toThrow(
      /Unknown role: wizard/,
    );
  });

  it('takes the project name from package.json when not given', async () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: '@acme/parcel' }));
    await init(captureIo(dir), { yes: true, roles: 'dev' });
    expect(read(dir, 'CLAUDE.md')).toMatch(/^# parcel\n/);
  });
});

describe('crew doctor', () => {
  it('exits 0 on a generated repo and 1 when something is broken', async () => {
    const dir = tempDir();
    await init(captureIo(dir), { yes: true, name: 'Parcel', roles: 'dev,qa' });
    const ok = captureIo(dir);
    expect(doctor(ok, {})).toBe(0);
    expect(ok.output()).toContain('HEALTHY');

    writeFileSync(join(dir, '.claude/agents/qa.md'), 'oops');
    const bad = captureIo(dir);
    expect(doctor(bad, {})).toBe(1);
    expect(bad.output()).toContain('NEEDS WORK');
    expect(bad.output()).toContain('missing frontmatter');
  });

  it('can report as JSON', async () => {
    const dir = tempDir();
    await init(captureIo(dir), { yes: true, name: 'Parcel', roles: 'dev' });
    const io = captureIo(dir);
    doctor(io, { json: true });
    expect(JSON.parse(io.output())).toMatchObject({ ok: true, errors: 0 });
  });
});

describe('crew add', () => {
  it('adds the agent, its document, and updates the team tables', async () => {
    const dir = tempDir();
    await init(captureIo(dir), { yes: true, name: 'Parcel', roles: 'dev,qa' });
    const io = captureIo(dir);
    expect(add(io, 'infra', {})).toBe(0);
    expect(existsSync(join(dir, '.claude/agents/infra.md'))).toBe(true);
    expect(existsSync(join(dir, 'docs/infra/RUNBOOK.md'))).toBe(true);
    const team = read(dir, 'docs/AGENT_TEAM.md');
    expect(team).toContain('| Infra | `infra` |');
    expect(team).toContain('├─▶ qa');
    expect(team).toContain('└─▶ infra');
    expect(read(dir, 'CLAUDE.md')).toContain('docs/infra/RUNBOOK.md');
    expect(JSON.parse(read(dir, '.claude/crew.json')).roles).toEqual(['dev', 'qa', 'infra']);
    expect(doctor(captureIo(dir), {})).toBe(0);
  });

  it('preserves hand-written content outside the managed sections', async () => {
    const dir = tempDir();
    await init(captureIo(dir), { yes: true, name: 'Parcel', roles: 'dev' });
    const path = join(dir, 'docs/AGENT_TEAM.md');
    writeFileSync(path, `${read(dir, 'docs/AGENT_TEAM.md')}\n## Our notes\n\nKeep this.\n`);
    add(captureIo(dir), 'qa', {});
    expect(read(dir, 'docs/AGENT_TEAM.md')).toContain('## Our notes\n\nKeep this.');
  });

  it('keeps an existing, customised agent file', async () => {
    const dir = tempDir();
    await init(captureIo(dir), { yes: true, name: 'Parcel', roles: 'dev' });
    mkdirSync(join(dir, '.claude/agents'), { recursive: true });
    writeFileSync(join(dir, '.claude/agents/qa.md'), 'custom');
    const io = captureIo(dir);
    add(io, 'qa', {});
    expect(read(dir, '.claude/agents/qa.md')).toBe('custom');
    expect(io.output()).toContain('exists, kept');
  });

  it('explains when the managed markers were removed', async () => {
    const dir = tempDir();
    await init(captureIo(dir), { yes: true, name: 'Parcel', roles: 'dev' });
    writeFileSync(
      join(dir, 'docs/AGENT_TEAM.md'),
      read(dir, 'docs/AGENT_TEAM.md').replace(/<!-- crew:roles:(start|end) -->/g, ''),
    );
    const io = captureIo(dir);
    add(io, 'qa', {});
    expect(io.output()).toContain('has no crew:roles markers');
  });

  it('refuses outside a crew repo and on unknown roles', async () => {
    expect(add(captureIo(tempDir()), 'qa', {})).toBe(1);
    const dir = tempDir();
    await init(captureIo(dir), { yes: true, name: 'Parcel', roles: 'dev' });
    expect(() => add(captureIo(dir), 'wizard', {})).toThrow(/Unknown role: wizard/);
  });
});

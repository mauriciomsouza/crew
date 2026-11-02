import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { tempDir } from './helpers.js';

// Runs the built binaries the way npx does: through a symlink in node_modules/.bin,
// which Node resolves, so process.argv[1] is the real file in dist/.
const root = resolve(__dirname, '..');
const dist = join(root, 'dist');

function linkBin(dir: string, name: string, target: string): string {
  const bin = join(dir, 'node_modules', '.bin');
  mkdirSync(bin, { recursive: true });
  const link = join(bin, name);
  symlinkSync(join(dist, target), link);
  return link;
}

function run(file: string, args: string[], cwd: string): string {
  return execFileSync(process.execPath, [file, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, CI: '1', NO_COLOR: '1' },
  });
}

describe('published binaries', () => {
  beforeAll(() => {
    if (!existsSync(join(dist, 'create.js'))) {
      execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'ignore' });
    }
  }, 120_000);

  it('create-crew scaffolds by default when reached through a symlink', () => {
    const dir = tempDir();
    const link = linkBin(dir, 'create-crew', 'create.js');
    run(link, ['--yes', '--name', 'Parcel'], dir);
    expect(existsSync(join(dir, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(dir, '.claude', 'agents', 'dev.md'))).toBe(true);
  });

  it('create-crew still accepts an explicit command', () => {
    const dir = tempDir();
    const link = linkBin(dir, 'create-crew', 'create.js');
    run(link, ['init', '--yes', '--name', 'Parcel'], dir);
    expect(run(link, ['doctor'], dir)).toContain('HEALTHY');
  });

  it('crew with no command prints the help and writes nothing', () => {
    const dir = tempDir();
    const link = linkBin(dir, 'crew', 'cli.js');
    expect(run(link, [], dir)).toContain('Usage');
    expect(existsSync(join(dir, 'CLAUDE.md'))).toBe(false);
  });
});

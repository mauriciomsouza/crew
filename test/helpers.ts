import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach } from 'vitest';
import type { Io } from '../src/node/commands.js';

const dirs: string[] = [];

export function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'crew-test-'));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  while (dirs.length > 0) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

export function captureIo(cwd: string): Io & { output: () => string } {
  const lines: string[] = [];
  return {
    cwd,
    interactive: false,
    out: (t) => lines.push(t),
    // eslint-disable-next-line no-control-regex
    output: () => lines.join('\n').replace(/\x1b\[[0-9;]*m/g, ''),
  };
}

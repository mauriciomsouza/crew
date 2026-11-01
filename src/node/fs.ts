import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import type { GeneratedFile, RepoReader } from '../core/index.js';

export function fsRepo(root: string): RepoReader {
  const abs = (p: string) => join(root, p);
  return {
    read(path) {
      try {
        return readFileSync(abs(path), 'utf8');
      } catch {
        return undefined;
      }
    },
    exists: (path) => existsSync(abs(path)),
    list(dir) {
      try {
        return readdirSync(abs(dir)).filter((name) => statSync(join(abs(dir), name)).isFile());
      } catch {
        return [];
      }
    },
  };
}

export interface WriteResult {
  written: string[];
  overwritten: string[];
  /** Existed already and were left alone (would need --force). */
  skipped: string[];
  /** Existed with identical content; nothing to do. */
  unchanged: string[];
}

export interface WriteOptions {
  force?: boolean;
  dryRun?: boolean;
  /** Paths the caller knows are crew-managed and may always be rewritten. */
  managed?: Set<string>;
}

function assertInside(root: string, path: string): string {
  const target = resolve(root, path);
  const rel = relative(resolve(root), target);
  if (rel.startsWith('..') || rel.includes(`..${sep}`) || resolve(rel) === rel) {
    throw new Error(`Refusing to write outside the project: ${path}`);
  }
  return target;
}

/** Writes files, never replacing an existing one unless `force` or managed. */
export function writeFiles(
  root: string,
  files: GeneratedFile[],
  options: WriteOptions = {},
): WriteResult {
  const result: WriteResult = { written: [], overwritten: [], skipped: [], unchanged: [] };
  for (const file of files) {
    const target = assertInside(root, file.path);
    const exists = existsSync(target);
    if (exists && readFileSync(target, 'utf8') === file.content) {
      result.unchanged.push(file.path);
      continue;
    }
    if (exists && !options.force && !options.managed?.has(file.path)) {
      result.skipped.push(file.path);
      continue;
    }
    if (!options.dryRun) {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, file.content);
    }
    (exists ? result.overwritten : result.written).push(file.path);
  }
  return result;
}

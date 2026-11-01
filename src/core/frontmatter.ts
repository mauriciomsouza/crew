import { parse } from 'yaml';

export interface Frontmatter {
  data: Record<string, unknown>;
  body: string;
}

export type FrontmatterResult = { ok: true; value: Frontmatter } | { ok: false; error: string };

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseFrontmatter(source: string): FrontmatterResult {
  const match = FENCE.exec(source);
  if (!match) return { ok: false, error: 'missing frontmatter (file must start with ---)' };
  const [, raw = '', body = ''] = match;
  let data: unknown;
  try {
    data = parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message.split('\n')[0] : String(err);
    return { ok: false, error: `invalid YAML in frontmatter: ${message}` };
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'frontmatter must be a YAML mapping' };
  }
  return { ok: true, value: { data: data as Record<string, unknown>, body } };
}

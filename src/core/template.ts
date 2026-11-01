/**
 * A deliberately tiny template engine. Two constructs, nothing else:
 *
 *   {{key}}                 replaced with vars[key]; unknown keys throw
 *   {{#if flag}}...{{/if}}  kept when flags[flag] is true (not nestable)
 *
 * Small on purpose: templates stay readable as plain Markdown, and a
 * typo in a placeholder fails loudly in tests instead of shipping.
 */
export interface TemplateContext {
  vars: Record<string, string>;
  flags: Record<string, boolean>;
}

const IF_BLOCK = /\{\{#if ([\w.:-]+)\}\}\n?([\s\S]*?)\{\{\/if\}\}\n?/g;
const VAR = /\{\{([\w.]+)\}\}/g;

export function render(template: string, ctx: TemplateContext): string {
  const withBlocks = template.replace(IF_BLOCK, (_match, flag: string, body: string) => {
    if (!(flag in ctx.flags)) throw new Error(`Unknown template flag: ${flag}`);
    return ctx.flags[flag] ? body : '';
  });
  return withBlocks.replace(VAR, (_match, key: string) => {
    const value = ctx.vars[key];
    if (value === undefined) throw new Error(`Unknown template variable: ${key}`);
    return value;
  });
}

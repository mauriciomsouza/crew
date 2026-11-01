import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    {
      // Mirror tsup's `.md -> text` loader so templates import the same way in tests.
      name: 'markdown-as-text',
      enforce: 'pre',
      load(id) {
        if (!id.endsWith('.md')) return null;
        return `export default ${JSON.stringify(readFileSync(id, 'utf8'))};`;
      },
    },
  ],
  test: { include: ['test/**/*.test.ts'] },
});

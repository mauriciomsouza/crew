import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { cli: 'src/cli.ts', create: 'src/create.ts', index: 'src/index.ts' },
  format: 'esm',
  target: 'node22',
  platform: 'node',
  dts: { entry: { index: 'src/index.ts' } },
  clean: true,
  sourcemap: true,
  loader: { '.md': 'text' },
});

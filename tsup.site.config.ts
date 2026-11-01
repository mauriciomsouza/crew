import { defineConfig } from 'tsup';

// Bundles the pure, filesystem-free core (the same generator and doctor the
// CLI uses) for the in-browser demo at site/demo.html.
export default defineConfig({
  entry: { crew: 'src/core/index.ts' },
  outDir: 'site/assets',
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  clean: false,
  // Inline `yaml` and everything else: the site has no node_modules.
  noExternal: [/.*/],
  loader: { '.md': 'text' },
});

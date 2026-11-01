import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'site/assets', 'examples', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['site/**/*.js', 'design/**/*.mjs'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
);

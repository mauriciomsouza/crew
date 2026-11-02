#!/usr/bin/env node
// Entry point for `npx create-crew`. npx resolves the bin symlink, so process.argv[1]
// is dist/create.js rather than "create-crew"; the default command is set here instead
// of being guessed from the executable name.
const COMMANDS = new Set(['init', 'doctor', 'add', 'roles', 'help']);
const first = process.argv[2];
if (first === undefined || !COMMANDS.has(first)) process.argv.splice(2, 0, 'init');

await import('./cli.js');

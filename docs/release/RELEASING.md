# Releasing — crew

> Owner: **Release**. Nothing is published without the owner's explicit go (gate G4).

## Versioning

Semantic Versioning, read from the user's side:

| Bump | When |
| ---- | ---- |
| Major | Generated output changes so that `crew doctor` would fail on an existing repo, or a CLI flag is removed |
| Minor | New role, command, flag or doctor warning |
| Patch | Template wording, bug fixes, docs |

## Checklist

- [ ] Every included change has a QA PASS
- [ ] Clean working tree on `main`
- [ ] `npm ci && npm run check` green on the release commit
- [ ] `npm run example` produces no diff
- [ ] Version matches in `package.json` and `src/version.ts`
- [ ] `CHANGELOG.md` entry under the new version, dated
- [ ] `npm pack --dry-run` lists only `dist/`, `README.md`, `LICENSE`, `package.json`
- [ ] Owner go
- [ ] `npm publish --provenance --access public`
- [ ] `git tag vX.Y.Z && git push --tags`
- [ ] GitHub release with the changelog entry

If `create-crew` is unavailable on npm at G4, the fallback is `@mauriciomsouza/create-crew` with the same bins.

## Rollback

`npm deprecate create-crew@X.Y.Z "<reason>"`, publish a patched version, and note it in the changelog.

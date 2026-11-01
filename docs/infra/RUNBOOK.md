# Runbook — crew

> Owner: **Infra**. How crew is built, deployed and recovered.

## Environments

| Environment | What | Trigger |
| ----------- | ---- | ------- |
| Local | `npm run check` | by hand |
| CI | `.github/workflows/ci.yml` on Node 22 | every push and pull request |
| GitHub Pages | `site/` at https://mauriciomsouza.github.io/crew/ | push to `main` touching `site/`, `src/core/` or `templates/`; manual dispatch |
| npm | `create-crew` package | owner, after G4 |

## Environment variables

None at runtime. crew makes no network calls.

| Name | Where | Purpose |
| ---- | ----- | ------- |
| `NPM_TOKEN` | GitHub Actions secret (only if trusted publishing is not used) | Publish to npm |

## Deploy the site

The Pages workflow runs `npm ci`, `npm run build:site` (bundles `src/core` to `site/assets/crew.js`), uploads `site/` and deploys it.

One-time setup (owner): **Settings → Pages → Build and deployment → Source: GitHub Actions.**

Local preview under the real base path:

```bash
npm run build:site
npm run preview      # serves site/ at http://localhost:4173/crew/
```

## Rollback

- **Site:** re-run the Pages workflow on the previous good commit (Actions → Deploy site → Run workflow, choose the commit), or `git revert` and push.
- **npm:** `npm deprecate create-crew@x.y.z "broken, use x.y.(z+1)"`, then publish a fix. Unpublishing is a last resort and only within 72 hours.

## Incidents

1. Note what users see and since when.
2. Roll back first, investigate second.
3. Add a regression test before the fix lands.

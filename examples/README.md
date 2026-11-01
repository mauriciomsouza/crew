# Examples

## `parcel/`

The complete output of `crew init` for a fictional product, committed so you can read every generated file without installing anything:

```bash
npx create-crew --yes --name Parcel \
  --description "A habit tracker for people who keep breaking streaks." \
  --stack "Expo (React Native), Supabase, EAS" \
  --roles business,design,dev,qa,release
```

Parcel is invented. The stubs under `docs/` are what each role starts from; in a real project the role agents fill them in.

Regenerate after any template change with `npm run example`. CI fails if this folder is out of date.

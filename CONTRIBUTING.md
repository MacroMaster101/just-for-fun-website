# Contributing

Thanks for helping improve the Just For Fun website!

## Branch workflow

```text
feature/*  ──PR──▶  dev  ──PR──▶  main
```

1. Branch off `dev` with a short descriptive name, for example `feature/soundboard-search` or `fix/header-overflow`.
2. Open a pull request **into `dev`**. PRs opened against `main` from any other branch fail the *Branch flow* check.
3. Once changes on `dev` are ready to release, open a pull request from `dev` into `main`. Merging it deploys to [j4fn.site](https://j4fn.site).

Both `dev` and `main` are protected: no direct pushes, force-pushes, or deletions.

## Before opening a PR

Use **npm** (the repo only ships `package-lock.json`) and make sure these pass locally:

```bash
npm ci
npm run lint
npx tsc --noEmit
npm run build
```

CI runs the same steps plus `npm audit`, and CodeQL scans every PR. Please fix any findings before requesting a merge.

## Guidelines

- Keep PRs focused on one change and describe what changed and how you tested it.
- Match the surrounding code style. Use `rem`-based sizes so layouts scale with the fluid root font size.
- Never commit secrets. `.env` is ignored; document new variables in `.env.example`.
- Admin-only API routes must call `verifyAdmin()` from `src/lib/auth/admin.ts`.

## Security issues

Do not open a public issue for vulnerabilities. See [SECURITY.md](SECURITY.md).

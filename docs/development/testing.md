# Testing and validation

Run application commands from the repository root. Use the narrowest relevant checks while working, then run the applicable checks before handoff.

## Install dependencies

Install the locked npm dependencies with:

```bash
npm ci
```

This is environment setup rather than a source validation check.

## Current validation commands

The current `package.json` provides these non-interactive validation commands:

```bash
npm run format:check
npm run lint
npm run build
```

- `npm run format:check` checks repository formatting with Prettier.
- `npm run lint` runs ESLint across the repository.
- `npm run build` runs the TypeScript build and creates the Vite production bundle.
- The build writes generated output under `dist/`; do not commit it.

Check changed lines for whitespace errors with:

```bash
git diff --check origin/main...HEAD
```

The repository currently has no configured automated test runner. Do not report unit, integration, or E2E tests as passing unless a test runner has been added and the corresponding command was actually run.

## Security validation

Gitleaks runs in GitHub Actions as a dedicated security workflow for pull requests, pushes to `main`, and manual runs. It scans the full Git history with the standard Gitleaks rules and redacts detected secret values from logs.

Gitleaks is not an npm validation command and is not required as a local development dependency.

## Development commands

These commands are useful for development but are not completion checks:

```bash
npm run dev
npm run preview
```

They are long-running or interactive and should not be treated as handoff validation.

## Which checks to run

- Documentation-only changes: `git diff --check origin/main...HEAD`.
- JavaScript, TypeScript, JSX, TSX, or configuration changes that affect application compilation: `npm run format:check`, `npm run lint`, `npm run build`, and the repository check.
- Dependency manifest or lock-file changes: run `npm run format:check` plus the applicable source checks after `npm ci`, and keep `package.json` and `package-lock.json` aligned.
- GitHub Actions workflow changes: review the final workflow diff and run `git diff --check origin/main...HEAD`.
- Mixed changes: combine the applicable groups.

Use only checks that exist in the current repository. When `package.json` scripts or validation tooling change, update this document in the same change.

Do not claim a check was run when it was skipped or unavailable. State the reason when an applicable check could not be executed.

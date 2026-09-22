# WP Japanese Translation Checker repository instructions

These instructions apply to the entire repository.

## Repository boundaries

- The repository root contains the Vite / React / TypeScript application and its development configuration.
- `src/` contains product source. Read `src/AGENTS.md` before changing files under `src/`.
- `docs/development/` contains durable repository-wide development principles and validation guidance.
- Add new directories or documentation layers only when a concrete responsibility requires them. Do not create placeholder structure for systems that do not exist.

## Development documentation

- Read `docs/development/foundation.md` for repository-wide development principles.
- Read `docs/development/testing.md` before selecting validation commands.
- Keep documentation aligned with the code, commands, dependencies, and directories that exist on the current branch.

## Communication

- Do not narrate routine file reads, searches, edits, or successful commands unless the information helps the user make a decision or understand an important finding.
- Surface blocking issues, material changes in assumptions, required scope changes, and decisions that require user input.
- Keep communication concise and focused on the requested work.

## Approval requests

- Request approval before taking a destructive, unexpected, or decision-sensitive action that is not already clearly authorized and could materially affect the repository, environment, dependencies, or user data.
- Do not request additional approval for actions already clearly authorized by the user's request and these repository instructions.
- Do not broaden the requested scope while a material decision remains unresolved.

## End-of-turn reports

- When repository work is performed, briefly report the work performed, changed files, validation results, and any open items.
- Never report validation as successful unless it actually ran successfully.
- If validation was not run or was intentionally left to the user, state that clearly.
- When changes are pushed, include a compare URL using the repository state at the start of the work and the pushed SHA.

## Working rules

- Make the smallest change that fully satisfies the current issue.
- Keep implementation and documentation aligned with the current repository state.
- Do not add dependencies, abstractions, source structure, or documentation structure before a concrete responsibility requires them.
- Do not commit generated dependencies or build output such as `node_modules/` or `dist/`.
- Do not commit secrets, credentials, personal paths, machine names, or other local-only environment details.

## Code review

- Before raising a review finding, weigh at least the issue's occurrence frequency, user impact, and the complexity introduced by the proposed fix.
- Do not treat low-frequency, low-impact presentation edge cases as required fixes when they have no material effect on data integrity, operation results, important accessibility information, or recoverability.
- Do not require additional state, IDs, queues, coordination layers, abstractions, or lifecycle management solely to eliminate such low-impact edge cases.
- Low frequency does not reduce the importance of issues that can cause data loss or corruption, inconsistent operation results, loss of important accessibility information, or unrecoverable user states.

## GitHub Actions

- Keep CI, security, and release workflows limited to their intended purpose.
- Do not change workflow permissions, triggers, or jobs solely to run unrelated temporary processing.
- Remove temporary workflows before merge unless the task explicitly establishes a permanent need for them.
- When `.github/workflows/` changes, review the final diff for unrelated changes, obsolete assumptions, or temporary work.

## Documentation responsibilities

- Put direct working instructions in `AGENTS.md` files.
- Put durable repository-wide development principles and rationale in `docs/development/`.
- Update relevant documentation when a command, directory boundary, dependency, or development rule changes.
- Avoid duplicating validation command lists. Use `docs/development/testing.md` as the source of truth.

## Validation

- Run only checks applicable to the changed files, as documented in `docs/development/testing.md`.
- Documentation-only changes do not require application builds or linters unless code or configuration also changes.
- Never report a command as successful unless it actually ran successfully.

## Efficient workflow

- Inspect only the files, documentation, and history required for the requested task.
- Do not inspect dependency, generated, cache, build, distribution, or test-output directories unless the task requires them.
- Prefer the narrowest relevant validation while iterating.
- Do not re-read unchanged files or repeat successful commands unless new evidence makes it necessary.
- Do not broaden the requested scope unless necessary to complete the requested outcome.

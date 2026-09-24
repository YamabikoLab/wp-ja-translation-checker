# Contributing to WP Translation Checker

Thank you for your interest in improving WP Translation Checker (WTC).

WTC welcomes bug reports, specification discussions, improvement proposals, and pull requests from WordPress translators, developers, reviewers, and other contributors.

## Issues

Use GitHub Issues to report bugs, discuss translation-rule behavior, or propose improvements.

Before opening a new Issue, check whether the same topic is already being discussed. When reporting a problem, include the smallest useful example and explain the expected and actual behavior.

Translation-rule decisions should be grounded in the relevant WordPress translation guidance and the agreement recorded in the related Issue. Do not introduce a locale rule based only on implementation convenience.

Security vulnerabilities must not be reported in a public Issue. See [SECURITY.md](SECURITY.md).

## Pull requests

1. Start from the current `main` branch and create a focused branch for the change.
2. Read the requirements, design, architecture, and plan documents relevant to the change.
3. Follow the nearest applicable `AGENTS.md` before changing files.
4. Keep the change as small as practical and avoid unrelated refactoring.
5. Run the validation that applies to the changed files.
6. Open a pull request that explains what changed and references the related Issue when one exists.

Do not add application validation, dependencies, abstractions, or source/documentation structure that the current responsibility does not require.

## Development documentation

The main project documents are:

- [v1 requirements](docs/requirements/v1-requirements.md)
- [v1 design](docs/design/v1-design.md)
- [v1 architecture](docs/architecture/v1-architecture.md)
- [v1 implementation plan](docs/plans/v1-plan.md)
- [development foundation](docs/development/foundation.md)

Validation commands and guidance are maintained in [docs/development/testing.md](docs/development/testing.md). Treat that file as the source of truth rather than duplicating validation instructions here.

## Community

Participation in Issues, pull requests, reviews, and other WTC project discussions is covered by the [Code of Conduct](CODE_OF_CONDUCT.md).

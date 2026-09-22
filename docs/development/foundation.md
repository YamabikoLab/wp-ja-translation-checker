# Development foundation

This document defines cross-cutting development principles for WP Japanese Translation Checker. Working instructions live in `AGENTS.md` files, and validation commands live in `testing.md`.

## Development flow

Use the following conceptual order when a change requires these levels of decision:

```text
requirements
    ↓
design
    ↓
architecture
    ↓
implementation
```

- **Requirements** define what users, the product, or quality must achieve and why it matters.
- **Design** defines user-visible behavior, interactions, states, and messages.
- **Architecture** defines internal responsibilities, boundaries, ownership, and contracts.
- **Implementation** realizes the accepted decisions in source code.

Dedicated documentation for every layer is not required. Create documentation or structure only when the current change benefits from it.

## Scope and simplicity

- Implement only responsibilities required by the current product scope or an accepted near-term change.
- Do not add abstractions, persistence, services, state management layers, or infrastructure because they might be useful later.
- Keep requirements, user-visible design, architecture decisions, and implementation details at their appropriate abstraction levels.
- When implementation pressure reveals a missing design or architecture decision, resolve that decision at the owning level instead of hiding it in implementation complexity.

## Security and privacy

- Treat user input, uploaded or pasted content, parsed data, stored data, and external values as untrusted.
- Validate data at the boundary appropriate to its use and encode or escape output for its final context.
- Do not use `eval`, unsafe dynamic code execution, or unsafe deserialization.
- Do not expose secrets, credentials, personal data, stack traces, or local paths.
- Do not add telemetry, remote code, remote fonts, or external services without an explicit requirement and review.

## Accessibility

- Prefer semantic HTML and native browser behavior where they satisfy the requirement.
- Keep keyboard and assistive-technology use in mind when defining interactive behavior.
- Do not rely on color alone to communicate meaning.

## Dependencies

- Add a dependency only for a current need after considering maintenance, license, security, and overlap with platform or existing dependencies.
- Keep runtime and development dependencies separate.
- Keep `package-lock.json` aligned with `package.json` when dependencies change.
- Do not commit generated dependencies, caches, or build output.

## Source and documentation

- Follow the nearest `AGENTS.md` for active source responsibilities.
- Keep source boundaries concrete and responsibility-driven.
- Keep documentation aligned with the implementation and command surface that actually exists.
- Follow `testing.md` for current validation commands.
- Add new documentation layers only when they solve a current documentation or coordination need.

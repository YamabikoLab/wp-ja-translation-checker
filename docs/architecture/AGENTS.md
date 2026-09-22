# Architecture documentation instructions

These instructions apply to architecture documents under `docs/architecture/`.

## Purpose

- Describe the internal responsibilities, boundaries, ownership, and contracts needed to realize the accepted design.
- Explain how major responsibilities collaborate without tying the architecture to source files or implementation techniques.
- Keep architecture stable enough to remain useful when concrete implementation details change.
- Document only architecture that is needed by the current product scope or an accepted near-term change.

## Abstraction boundary

- Describe the technical structure between user-visible design and concrete implementation.
- Define major responsibilities and what each responsibility owns.
- Describe important dependencies, data flow, state ownership, lifecycle, contracts, and invariants when they materially affect the architecture.
- Describe external systems or platform capabilities only when they shape the system boundary.
- Do not merely restate user-visible behavior in more technical words. Add the internal responsibility model needed to realize that behavior.
- Do not describe source files, concrete class or function names, variables, event handler names, CSS details, DOM procedures, or test implementation unless a concrete implementation constraint is itself architecturally significant.
- Do not make architecture depend on the current source tree shape.

## Responsibilities and boundaries

- Give each responsibility one clear purpose.
- Keep state ownership explicit when multiple responsibilities collaborate.
- Keep contracts focused on what crosses a responsibility boundary, not on the concrete call shape used by the current implementation.
- Record prohibited coupling or other invariants when violating them would materially weaken the architecture.
- Do not introduce responsibilities, layers, services, adapters, or coordination mechanisms for hypothetical future needs.

## Dependencies and flow

- Distinguish structural dependency from runtime interaction when the distinction matters.
- A dependency describes what another responsibility or external capability is required to fulfill a responsibility.
- A runtime flow describes how responsibilities interact in a meaningful scenario.
- Use diagrams or tables only when they make the relationship materially easier to understand.
- Do not require stable IDs, machine-readable tables, generated diagrams, parsers, or architecture tooling unless the repository has a concrete need for them.

## Architecture decisions

Record an architecture decision when the choice materially affects responsibility boundaries, ownership, dependencies, lifecycle, extensibility, or an important quality requirement.

For important decisions, capture:

- the context or constraint;
- the accepted direction;
- the main reason for the decision;
- meaningful consequences or tradeoffs when they help future maintenance.

Do not turn ordinary implementation choices into architecture decisions.

## Quality requirements

- Record performance, reliability, compatibility, accessibility, security, privacy, or other quality concerns at architecture level only when they shape the technical structure.
- Keep measurable product expectations in requirements documentation when they are requirements rather than architecture decisions.
- Keep validation commands and test procedures out of architecture documents; follow `docs/development/testing.md` for repository validation.

## Document structure

Use only the sections needed to explain the architecture clearly. Typical sections may include:

- Context and Scope
- Constraints
- Solution Strategy
- Responsibilities and Boundaries
- Runtime Flow
- Architecture Decisions
- Quality Considerations
- Risks and Technical Debt

Do not add empty sections merely to satisfy a template. Prefer the smallest structure that keeps the architecture understandable and reviewable.

## Readability

- Use conceptual names rather than implementation identifiers.
- Prefer concise prose and focused tables over exhaustive inventories.
- Define terminology when a term has a repository-specific meaning.
- Keep architecture documents aligned with accepted Requirements and Design documents. If implementation planning reveals that an architecture decision must change, update the architecture before treating the new direction as accepted.

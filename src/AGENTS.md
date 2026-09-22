# WP Japanese Translation Checker source guidelines

These instructions apply to source files under `src/`.

## Source organization

- Keep the source structure easy to navigate by making file and directory boundaries reflect concrete responsibilities.
- Keep application entry points thin and move meaningful behavior into files that own a clear responsibility.
- Avoid generic `shared/`, `utils/`, or `helpers/` directories unless they represent a concrete responsibility rather than a collection of unrelated convenience functions.

## Code structure and reuse

- Introduce abstractions only for concrete responsibilities or shared reasons for change.
- Do not abstract or commonize code merely because implementations currently look similar.
- Keep implementation details from leaking across responsibility boundaries.
- Prefer clear, meaningful names that let readers understand returned values and state transitions without reconstructing implementation details.

## React readability

- Structure components so that the UI hierarchy and responsibility of each meaningful UI part are apparent from the component structure.
- Extract components when they represent a coherent UI responsibility, not merely to shorten a parent component.
- Prefer state representations that make valid conceptual states explicit instead of splitting one meaningful state across unrelated React state values.
- Keep control flow and lifecycle behavior easy to trace. Use Effects and custom Hooks when they make synchronization, lifecycle, or a coherent responsibility clearer, not merely to hide control flow.

## React code review guidelines

When reviewing React code, focus on correctness, lifecycle behavior, maintainability, and meaningful performance issues rather than style preferences.

- Verify Hooks follow React's rules and dependency lists are complete and semantically correct. Watch for stale closures and unstable dependencies.
- Verify each Effect is necessary for synchronization with something outside React or for lifecycle behavior. Avoid Effects that only derive React state from other React state.
- Ensure subscriptions, event listeners, observers, timers, and similar resources are cleaned up when required.
- Verify state has a clear owner and represents source-of-truth data rather than values that can be derived during render.
- Avoid duplicating the same conceptual state across multiple owners.
- Verify rendering remains pure. Do not mutate props, state, or shared values during render.
- Use refs for mutable values or DOM references that should not drive rendering, and do not retain references after their lifecycle becomes invalid.
- Verify mount, unmount, and remount behavior does not depend on assumptions that React may invalidate by recreating a component.
- Verify list item identity is stable and `key` values represent item identity rather than the current position.
- Investigate unnecessary rerenders only when they can have a meaningful cost. Prefer fixing ownership or unstable dependencies before adding memoization as a precaution.
- Extract components and custom Hooks when they own a meaningful UI, lifecycle, or synchronization responsibility, not merely to reduce line count.

## Source documentation

- Write comments and documentation so that responsibility, purpose, behavior, constraints, and rationale are understandable without tracing implementation details.
- In Japanese documentation and comments, prefer natural Japanese for explanatory concepts. Keep English when needed for source identifiers, proper nouns, or standardized technical terms.
- Describe domain or specification rules rather than translating expressions, data structures, algorithms, or implementation steps into prose.
- Document important assumptions, lifecycle rules, cleanup responsibilities, and non-obvious boundaries.
- Do not mechanically add comments to self-explanatory local variables, temporary values, or implementation steps.
- Keep documentation aligned when the responsibility or contract changes.

## Testing boundary

- Do not add exports to production code solely for tests.
- Determine public boundaries from production responsibilities and actual production usage.
- If behavior is difficult to test without exposing implementation details, reconsider the test boundary or responsibility decomposition before widening the production API.

## Accessibility

- Prefer semantic HTML and native browser behavior when they satisfy the interaction requirement.
- Do not communicate meaning through color alone.

## Dependencies and generated files

- Add dependencies only for concrete product or development needs.
- Do not edit generated dependencies or build output such as `node_modules/` or `dist/`.

## Validation

Use the applicable commands documented in `../docs/development/testing.md`.

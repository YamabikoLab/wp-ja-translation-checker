# Test guidelines

These guidelines apply when creating or changing automated tests under `src/`.

Tests should be structured so that their purpose and expected behavior can be understood without reading implementation details.

## Test organization

- Group test cases with `describe` by meaningful behavior, scenario, or responsibility.
- Prefer behavior-oriented groups over implementation details such as helper functions or internal processing steps.

## Test case names

- Write each `it` or `test` description as a condition and expected result using `when <condition or action>, should <expected result>`.
- The `when` part should describe the condition or action being tested.
- The `should` part should describe the externally observable expected result.

## Production dependencies

- Use production dependencies directly when they are available in the test environment. Do not replace them with test doubles merely to simplify a test.
- Exercise the behavior under test through its production public boundary so that the test covers the real contract between responsibilities.
- Prefer assertions on return values, rendered UI, public callback results, and other externally observable behavior.
- Do not make calls to mocked production dependencies the primary specification of behavior.

## Test setup and teardown

- Keep test state setup and cleanup separate from the production path whose behavior the test verifies.
- Use test-side setup or teardown only to establish deterministic isolation.
- Do not add test-only production APIs or widen production exports solely to support setup, teardown, or state reset.

## Test double exceptions

- Replace a production dependency with a test double only when using the real dependency is technically impractical or the required condition cannot be reproduced deterministically through a reasonable public production boundary.
- Valid exceptions include failures that cannot reasonably be triggered through a public production boundary; browser or layout behavior absent from the test environment; and environmental boundaries such as time that require deterministic control.
- State why the real dependency cannot be used whenever a production dependency is replaced.
- `vi.fn()` is permitted to record an externally observable contract such as a public callback. The restriction is on replacing available production behavior, not on Vitest mock APIs themselves.

## Production export boundaries

- Do not add or widen an export in production code solely to make an implementation detail directly accessible from tests.
- Decide production exports from architectural responsibility and actual production usage, not from test convenience.
- Verify non-public functions, values, and implementation details through externally observable behavior exposed by the responsibility being tested.
- When behavior is difficult to test without exposing implementation details, reconsider the test boundary, test approach, or responsibility decomposition before widening the production API.

## React Testing Library

- Add React Testing Library or DOM test utilities only when a React integration responsibility actually requires them.
- Prefer React Testing Library for tests that verify React components, custom Hooks, or other React integration boundaries.
- Use `renderHook()` for custom Hooks and `render()` for components when those APIs can express the behavior being verified.
- Test behavior that is observable through the React consumer boundary. Avoid asserting internal React state, private implementation details, CSS class names, or incidental DOM structure unless they are part of the responsibility's public behavior.
- Keep React integration tests scoped to the behavior owned by the React boundary. Do not duplicate the specification of React-independent responsibilities already verified by their own tests.
- Prefer user-observable queries for rendered UI. Use implementation-oriented queries such as test IDs only when no meaningful user-facing query exists.
- Keep test setup focused on the scenario being verified. Do not reproduce production component trees, providers, or DOM structure unrelated to the responsibility under test.

## Test case documentation

Follow [`test-case-documentation.md`](./test-case-documentation.md) for the common test case documentation format.

For Vitest tests:

- Describe conditions and expected results at the responsibility or externally observable behavior boundary being tested.
- Do not document mocks, test doubles, helper calls, or internal state transitions unless they are themselves part of the responsibility contract being verified.

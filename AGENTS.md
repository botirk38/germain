<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project TypeScript And React Rules

- Use Bun for package and script commands in this repository.
- Do not add `eslint-disable`, `@ts-ignore`, or `@ts-expect-error` unless there is no type-safe alternative; include a short justification when one is unavoidable.
- Do not use `any`. Prefer `unknown`, inferred schema types, discriminated unions, type guards, or AI SDK inference helpers.
- Prefer `const` and immutable data transforms. Avoid `let` unless reassignment is the clearest local implementation and a functional transform would be less maintainable.
- Prefer pure functions and immutable state updates over mutation.
- For React, avoid unnecessary `useMemo` and `useCallback`; add them only when they protect an expensive calculation, preserve an API contract, or support a memoized child.
- For Next.js changes, verify the current installed docs first when available and avoid relying on memory of older Next.js versions.
- For AI SDK changes, verify `node_modules/ai/docs/` or `node_modules/ai/src/` first. Use `ToolLoopAgent`, `InferAgentUIMessage`, and current v6 UI message helpers rather than hand-rolled casts.

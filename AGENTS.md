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

## Component Organization

- Keep route `page.tsx` files as composition boundaries. Page-specific UI belongs under `components/pages/<route>/` and should be imported into the route page explicitly.
- If a page component has meaningful subcomponents, put them in a folder named after that component. Do not add grouping folders like `console/` unless there is an actual `Console` component boundary.
- Do not prefix filenames with the page name when the folder already provides that context. Prefer `components/pages/landing/hero.tsx` over `landing-hero.tsx`.
- Shared reusable primitives belong under `components/ui/`. Product-theme primitives shared across multiple Attaché surfaces belong under `components/attache/`. Components used by only one page stay inside that page folder.
- Before creating custom UI markup, check installed shadcn components and registry docs. Add official shadcn components with `bunx --bun shadcn@latest add <component>` and compose them first; reserve custom components for product-specific visuals or behavior that shadcn does not cover.
- Delete unused components rather than preserving compatibility shims. This repository does not keep backward-compatibility layers unless there is a concrete external consumer.

## Hook Organization

- All shared or page-level custom hooks belong under the top-level `hooks/` folder, not inside `app/` or `components/`.
- Organize hooks by the same domain/page structure as components. Example: case-page hooks live in `hooks/case/` while case UI lives in `components/pages/case/`.
- Context hooks such as `useCasePage` should live in `hooks/<domain>/`; provider components may import the context from there, but the hook itself should not be defined beside component markup.

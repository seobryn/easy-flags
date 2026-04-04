---
name: easy_flags_core
description: Development and TDD guidelines for the Easy Flags project.
---

# Easy Flags - Core Development Skill

This skill contains the mandatory guidelines for developing the Easy Flags project. It integrates TDD principles and Hexagonal Architecture.

## 🔴🔴 RED-GREEN-REFACTOR (TDD Cycle)

Every feature or fix **MUST** follow this cycle:

1. **🔴 RED**: Write a failing test in a `.test.ts` or `.test.tsx` file (same directory as the source).
2. **🟢 GREEN**: Write the **minimum** code to make it pass.
3. **🔵 REFACTOR**: Clean up code while keeping tests green.

### Workflow
1. Analyze requirements and edge cases.
2. Identify/Create test file next to the source.
3. Write the failing test FIRST and run it (confirm it fails).
4. Implement source code and run tests (confirm they pass).
5. Refactor for readability/performance.

## 🏗️ HEXAGONAL ARCHITECTURE

Organize code into these layers:

- `src/domain/`: Pure business logic (entities, interfaces). **No framework code.**
- `src/application/`: Use cases and orchestration.
- `src/infrastructure/`: DB (LibSQL), API clients, adapters.
- `src/components/`: React components (Functional + Hooks).
- `src/pages/` & `src/layouts/`: Astro routing and SSR structures.

## 💅 STACK & CONVENTIONS

- **Tooling**: pnpm, Vitest, React Testing Library, Tailwind CSS v4.
- **Naming**: `kebab-case` for files/dirs, `PascalCase` for React components/Types, `camelCase` for vars/fns.
- **Styling**: Tailwind v4 utility-first. Avoid interpolation for class names.
- **Migrations**: Database changes **MUST** use `pnpm migration:create <name>` and `pnpm db:migrate`.
- **SSR & Hydration**: Prefer Astro SSR. Hydrate React with `client:load` or `client:visible` only when needed.

## 🤖 AI ASSISTANT MANDATORY CHECKS

1. **Check layer**: Ensure new files are in the correct directory (domain vs infra vs app).
2. **Prioritize testability**: Code must be easy to mock and unit test.
3. **Database**: Remind user of migrations if changing schema.
4. **Responsive**: UI components must be mobile-first and use Tailwind v4.

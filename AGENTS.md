# Easy Flags - Agent Guidelines

## Essential Commands

```bash
pnpm dev           # Start dev server (http://localhost:3000)
pnpm build         # Production build
pnpm start         # Run production server (node ./dist/server/entry.mjs)
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
pnpm test <file>   # Run single test file
pnpm type-check    # TypeScript validation
pnpm db:init       # Initialize database
pnpm db:migrate    # Run pending migrations
pnpm migration:create <name>  # Create new migration
```

## Architecture (Hexagonal)

- `src/domain/` - Pure business logic (entities, interfaces). No framework code.
- `src/application/` - Use cases and orchestration
- `src/infrastructure/` - DB (LibSQL), API clients, adapters
- `src/components/` - React components
- `src/pages/` & `src/layouts/` - Astro SSR routing

## TDD Workflow (Required)

Follow the cycle in `.agent/workflows/tdd.md`:
1. Write failing test first (`.test.ts` or `.test.tsx` in same dir as source)
2. Run `pnpm vitest run <test_file>` to confirm failure
3. Implement minimum code to pass
4. Refactor while keeping tests green

## Path Aliases

`@/` `, `@components/*`, `@utils/*`, `@api/*`, `@domain/*`, `@application/*`, `@infrastructure/*`, `@lib/*`

## Naming

- Files/dirs: `kebab-case`
- React components/Types: `PascalCase`
- Vars/fns: `camelCase`

## Stack

- Astro 6 (SSR mode, adapter switches between Vercel/prod and Node/dev)
- React 19, Tailwind CSS v4
- LibSQL (database), JWT auth (HTTP-only cookies)
- Vitest + React Testing Library

## Database

Migrations are mandatory for schema changes. Use `pnpm migration:create <name>` then `pnpm db:migrate`.

## SSR & Hydration

Astro SSR with React hydration only where needed (`client:load` or `client:visible`).
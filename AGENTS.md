# Easy Flags - Agent Guidelines

## Essential Commands

```bash
pnpm dev           # Start dev server (http://localhost:3000). DO NOT run this command unless explicitly requested by the user.
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

## Icons

All icons MUST use the centralized `Icon` component from `@/components/react/shared/Icon`. Do NOT use inline SVGs or other icon libraries.

```tsx
import { Icon } from "@/components/react/shared/Icon";

// Available icons: ArrowRight, ChevronRight, ChevronDown, Activity, Layers, 
// AlertCircle, Clock, X, Lock, Eye, EyeOff, Trash, Rocket, Box, Globe, Target,
// Zap, Users, User, HelpCircle, Lightbulb, FileText, AlertTriangle, Info,
// Edit, ExternalLink, Menu, Calendar, Settings, Copy, RefreshCw, Search, Check,
// Key, Hash, Plus, Folder, Trash2, MessageSquare, Database, Table, LogOut,
// MousePointer, Shield, Mail, Flag, CreditCard, Book, Save, PlusCircle, Type, Code, MapPin

<Icon name="X" size={20} className="text-white" />
<Icon name="ChevronDown" size={16} />
<Icon name="Settings" size={24} />
```

If you need an icon that doesn't exist, add it to `Icon.tsx` by importing from `@radix-ui/react-icons`.

## UI Components

Use Radix UI primitives for accessible interactive components:
- `@radix-ui/react-tabs` - For tabbed interfaces
- `@radix-ui/react-dropdown-menu` - For dropdown menus
- `@radix-ui/react-dialog` - For modals/dialogs
- `@radix-ui/react-select` - For select dropdowns
- `@radix-ui/react-tooltip` - For tooltips

Example with tabs:
```tsx
import * as Tabs from "@radix-ui/react-tabs";

<Tabs.Root defaultValue="tab1">
  <Tabs.List>
    <Tabs.Trigger value="tab1" className="...">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2" className="...">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">...</Tabs.Content>
  <Tabs.Content value="tab2">...</Tabs.Content>
</Tabs.Root>
```
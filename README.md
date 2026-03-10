# Easy Flags - Astro Application

A modern, performant feature flag management platform built with Astro, React, and TailwindCSS.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server (http://localhost:3000)
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm run start
```

## Features

- 🚀 **Lightning-fast SSR** - Astro's server-side rendering with islands of interactivity
- ⚛️ **React Components** - Modern React for interactive UI elements
- 🎨 **TailwindCSS Styling** - Utility-first responsive design
- 🔐 **JWT Authentication** - Secure token-based auth with HTTP-only cookies
- 📊 **Multi-tenant Architecture** - Spaces for organization and team management
- 🌙 **Dark Theme** - Beautiful dark-themed UI by default
- 📱 **Responsive Design** - Perfect on desktop, tablet, and mobile

## Pages

### Public Pages

- `/` - Landing page
- `/login` - User login
- `/create-account` - User registration
- `/docs` - Documentation
- `/api-reference` - API documentation
- `/contact` - Contact form
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/billing` - Pricing and billing plans

### Protected Pages

- `/spaces` - Space management dashboard
- `/roles` - Role management
- `/users` - User management
- `/features` - Feature flag management
- `/envs` - Environment management

## Project Structure

```
src/
├── api/                      # API endpoints
│   ├── auth/                # Authentication
│   │   ├── login.ts
│   │   ├── register.ts
│   │   ├── logout.ts
│   │   └── me.ts
│   └── spaces/              # Spaces API
│       └── index.ts
├── components/              # React components
│   ├── Header.tsx          # Navigation header
│   ├── Modals.tsx          # Modal dialogs
│   ├── LoginForm.tsx       # Login form
│   ├── RegisterForm.tsx    # Registration form
│   ├── HeroSection.tsx     # Landing hero
│   ├── QuickStartSection.tsx
│   ├── WhyLoveSection.tsx
│   ├── SpacesDashboard.tsx # Spaces management
│   ├── BillingPanel.tsx    # Billing page
│   └── ContactForm.tsx     # Contact form
├── layouts/                 # Astro layouts
│   └── BaseLayout.astro    # Main layout template
├── pages/                   # Astro pages (auto-routed)
│   ├── index.astro         # / route
│   ├── login.astro         # /login route
│   ├── create-account.astro # /create-account route
│   ├── billing.astro       # /billing route
│   ├── contact.astro       # /contact route
│   ├── docs.astro          # /docs route
│   ├── api-reference.astro # /api-reference route
│   ├── privacy.astro       # /privacy route
│   ├── terms.astro         # /terms route
│   ├── roles.astro         # /roles route
│   ├── users.astro         # /users route
│   ├── features.astro      # /features route
│   ├── envs.astro          # /envs route
│   ├── forbidden.astro     # /forbidden route (403)
│   └── spaces/
│       └── index.astro     # /spaces route
├── styles/
│   └── globals.css         # Global styles & Tailwind setup
└── utils/
    ├── auth.ts             # Authentication helpers
    └── api.ts              # API response helpers
```

## Key Technologies

### Core Framework

- **Astro 4.2** - Ultra-fast static site generation with SSR
- **@astrojs/react** - React integration
- **@astrojs/tailwind** - TailwindCSS integration
- **@astrojs/node** - Node.js adapter for SSR

### Frontend

- **React 18** - UI library
- **React DOM 18** - React rendering

### Styling

- **TailwindCSS 3** - Utility-first CSS framework
- **PostCSS** - CSS transformation
- **Autoprefixer** - Browser compatibility

### Utilities

- **jsonwebtoken** - JWT token generation/verification
- **bcryptjs** - Password hashing
- **cookie** - HTTP cookie handling

## Configuration Files

- **astro.config.mjs** - Astro configuration (SSR, adapters, integrations)
- **tailwind.config.cjs** - TailwindCSS theme and utilities
- **postcss.config.cjs** - PostCSS plugins
- **tsconfig.json** - TypeScript configuration with path aliases

## Environment Variables

Create `.env` file in the root:

```env
# Database
DATABASE_URL=file:./data.db

# JWT Settings
JWT_SECRET=your-super-secret-key-for-jwt

# Server
NODE_ENV=development
PORT=3000
```

## Development

### Adding a New Page

1. Create a new `.astro` file in `src/pages/`
2. Use the `BaseLayout` component
3. Add your content

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
---

<BaseLayout title="My Page">
  <h1>Hello World</h1>
</BaseLayout>
```

### Adding an Interactive Component

1. Create a `.tsx` or `.jsx` file in `src/components/`
2. Export a default React component
3. Use it in pages with `client:load` directive

```astro
---
import MyComponent from "@/components/MyComponent";
---

<MyComponent client:load />
```

### Adding an API Route

1. Create a `.ts` file in `src/api/`
2. Export functions for HTTP methods (GET, POST, etc.)
3. Use path-based routing

```typescript
// src/api/hello.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  return new Response(JSON.stringify({ message: "Hello!" }));
};
```

## Styling with TailwindCSS

The project uses TailwindCSS for all styling. Key custom utilities:

```css
/* Components */
.btn-primary          /* Primary button style */
.btn-secondary        /* Secondary button style */
.card                 /* Card container */
.card-hover          /* Card with hover effect */

/* Text */
.section-title       /* Section heading */
.text-gradient       /* Gradient text */

/* Layout */
.container-custom    /* Centered container */
.hero-pattern        /* Hero background pattern */
```

Example usage:

```tsx
<button className="btn-primary">Click me</button>
<div className="card">
  <h2 className="section-title">Title</h2>
  <p className="text-gradient">Gradient text</p>
</div>
```

## Authentication

### How It Works

1. User logs in/registers via `/login` or `/create-account`
2. Server validates credentials and issues JWT token
3. Token stored in HTTP-only secure cookie
4. Client automatically sends cookie with requests
5. Protected routes check for valid token

### Protected Routes

API endpoints that require authentication use `getUserFromContext()`:

```typescript
import { getUserFromContext } from "@/utils/auth";

export const GET: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  // Your logic here
};
```

## Performance Features

### Static Generation

Pages without `client:*` directives are 100% static HTML served from edge.

### Selective Hydration (Islands)

Only interactive components are hydrated with React:

```astro
<MyComponent client:load />  <!-- Hydrated immediately -->
<MyComponent client:idle />  <!-- Hydrated when browser idle -->
<MyComponent client:visible /> <!-- Hydrated when visible -->
```

### Built-in Optimizations

- Automatic code splitting
- Deferred JavaScript loading
- Asset optimization
- Compression

## Deployment

### Build

```bash
pnpm run build
```

Generates optimized output in `dist/` directory.

### Test Production Build

```bash
pnpm run preview
```

### Deploy to Production

```bash
pnpm run start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

EXPOSE 3000
CMD ["pnpm", "run", "start"]
```

## Related Documentation

- [Main Migration Guide](../ASTRO_MIGRATION.md) - Detailed migration information
- [Astro Docs](https://docs.astro.build) - Official Astro documentation
- [React Docs](https://react.dev) - React documentation
- [TailwindCSS Docs](https://tailwindcss.com) - Tailwind documentation

## License

MIT

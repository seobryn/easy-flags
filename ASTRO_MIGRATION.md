# Easy Flags - Astro Migration Guide

This is the new Astro + React + TailwindCSS version of the Easy Flags feature flag management platform. This migration replaces the Express.js + EJS backend with Astro's modern SSR architecture.

## Architecture Overview

### Previous Stack (Express.js)

- **Backend:** Express.js with TypeScript
- **Frontend:** EJS templates with vanilla JavaScript
- **Styling:** Custom CSS with Tailwind utilities
- **Database:** SQLite
- **Authentication:** JWT tokens in cookies

### New Stack (Astro)

- **Framework:** Astro 4.2 with Server-Side Rendering (SSR)
- **UI Components:** React 18 for interactive components
- **Styling:** TailwindCSS 3 with utility-first approach
- **Backend:** Astro API routes (can proxy to existing Express backend)
- **Database:** Same SQLite (accessible via API routes)
- **Authentication:** JWT tokens via HTTP-only cookies

## Project Structure

```
astro-app/
├── src/
│   ├── api/              # Astro API routes (replaces Express routes)
│   │   ├── auth/         # Authentication endpoints
│   │   └── spaces/       # Spaces API
│   ├── components/       # React components for interactivity
│   ├── layouts/          # Astro layouts for page templates
│   ├── pages/            # Astro pages (auto-routed)
│   ├── styles/           # Global CSS and TailwindCSS
│   └── utils/            # Shared utilities (auth, API helpers)
├── public/               # Static assets (images, fonts, icons)
├── astro.config.mjs      # Astro configuration
├── tailwind.config.cjs   # Tailwind configuration
├── postcss.config.cjs    # PostCSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Key Migration Changes

### 1. **Templates → Pages & Components**

- **Before:** EJS templates in `views/` rendered by Express
- **After:** Astro pages in `src/pages/` + React components

Example:

```
views/index.ejs → src/pages/index.astro
views/layout.ejs → src/layouts/BaseLayout.astro
partials/header.ejs → src/components/Header.tsx
```

### 2. **Styling**

- **Before:** Custom CSS file with Tailwind directives
- **After:** TailwindCSS utility-first classes in components

Example:

```html
<!-- Before: EJS -->
<div class="rounded-xl bg-slate-800/80 border border-cyan-700/30 shadow-lg p-6">
  <!-- After: Astro/React with Tailwind -->
  <div className="card"></div>
</div>
```

### 3. **State Management**

- **Before:** Vanilla JavaScript with DOM manipulation
- **After:** React hooks for stateful components

Example:

```typescript
// React component with state
const [spaces, setSpaces] = useState<Space[]>([]);
const [isLoading, setIsLoading] = useState(true);
```

### 4. **API Endpoints**

- **Before:** Express routes in `src/routes/`
- **After:** Astro API routes in `src/api/`

File routing example:

```
src/api/auth/login.ts     → POST /api/auth/login
src/api/spaces/index.ts   → GET/POST /api/spaces
src/api/spaces/[id].ts    → GET/PUT/DELETE /api/spaces/:id
```

### 5. **Forms & Validation**

- **Before:** Form submission with page reload
- **After:** React forms with client-side state and async submission

## Setup & Installation

### Prerequisites

- Node.js 18+
- pnpm 10.14.0+

### Installation

1. **Navigate to the Astro app directory:**

   ```bash
   cd astro-app
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   Create `.env` file:

   ```env
   # Database
   DATABASE_URL=file:./data.db

   # JWT
   JWT_SECRET=your-secret-key-here

   # Node environment
   NODE_ENV=development
   ```

4. **Run development server:**

   ```bash
   pnpm run dev
   ```

   The application will be available at `http://localhost:3000`

## Development

### Commands

```bash
# Start dev server with hot reload
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Start production server
pnpm run start

# Type checking
pnpm run type-check
```

### Creating New Pages

Astro uses file-based routing. Create files in `src/pages/`:

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import MyComponent from "@/components/MyComponent";
---

<BaseLayout title="My Page">
  <MyComponent client:load />
</BaseLayout>
```

The `client:load` directive tells Astro to hydrate this component with React.

### Creating New API Routes

Create files in `src/api/`:

```typescript
import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { successResponse, unauthorizedResponse } from "@/utils/api";

export const GET: APIRoute = async (context) => {
  const user = getUserFromContext(context);

  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  // Your logic here
  return new Response(
    JSON.stringify(
      successResponse({
        /* data */
      }),
    ),
    { status: 200 },
  );
};
```

### Creating React Components

Components in `src/components/` are regular React files that can use hooks:

```typescript
import React, { useState } from "react";

export default function MyComponent() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 bg-slate-800 rounded-lg">
      <button
        onClick={() => setCount(c => c + 1)}
        className="btn-primary"
      >
        Count: {count}
      </button>
    </div>
  );
}
```

## Integration with Express Backend

The new Astro app can run alongside the existing Express backend. API routes can either:

1. **Implement logic directly** (stateless, suitable for auth/simple operations)
2. **Proxy to Express backend** (for complex business logic)
3. **Access database directly** (using the same repositories)

Example proxy setup:

```typescript
// src/api/spaces/index.ts
export const GET: APIRoute = async () => {
  const response = await fetch("http://localhost:3001/api/spaces");
  const data = await response.json();
  return new Response(JSON.stringify(data));
};
```

## Styling Guide

### Tailwind CSS Utilities

All components use TailwindCSS utility classes:

```typescript
// Common patterns
className = "bg-slate-800/80"; // Semi-transparent background
className = "border border-cyan-700/30"; // Semi-transparent border
className = "text-gradient"; // Gradient text color
className = "btn-primary"; // Custom button component
className = "card"; // Card component
className = "card-hover"; // Hover state for cards
```

### Custom Components (in tailwind.config.cjs)

```css
@layer components {
  .btn-primary {
    /* ... */
  }
  .card {
    /* ... */
  }
  .text-gradient {
    /* ... */
  }
}
```

### Responsive Design

TailwindCSS breakpoints:

```typescript
className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
```

## Authentication Flow

1. User submits login/registration form in React component
2. Form sends POST request to `/api/auth/login` or `/api/auth/register`
3. API route validates credentials and creates JWT token
4. Token stored in HTTP-only cookie via `setAuthCookie()`
5. Authenticated requests use `getUserFromContext()` to retrieve user
6. On logout, `clearAuthCookie()` removes the token

## Performance Optimizations

### 1. **Islands Architecture**

Only interactive components are hydrated with React:

```astro
<MyComponent client:load />
```

### 2. **Static Rendering**

Pages without `client:*` directives are 100% static HTML.

### 3. **Code Splitting**

Astro automatically splits code for each page.

### 4. **Image Optimization**

Use Astro's `<Image>` component for automatic optimization:

```astro
import { Image } from 'astro:assets';
<Image src={heroImage} alt="Hero" />
```

## Deployment

### Build for Production

```bash
pnpm run build
```

Creates optimized output in `dist/` directory.

### Deployment Options

#### 1. **Node.js/Server** (Recommended)

```bash
# Start production server
pnpm run start
```

Suitable for:

- Vercel (with @astrojs/vercel adapter)
- Netlify (with @astrojs/netlify adapter)
- Docker containers
- Traditional Node.js hosting

#### 2. **Docker Deployment**

Create `Dockerfile`:

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

Build and run:

```bash
docker build -t easy-flags .
docker run -p 3000:3000 easy-flags
```

#### 3. **Environment Variables for Production**

```env
NODE_ENV=production
JWT_SECRET=<secure-random-key>
DATABASE_URL=<production-database-url>
ASTRO_SITE=https://yourdomain.com
```

### Vercel Deployment

1. Connect GitHub repository
2. Framework preset: Astro
3. Build command: `pnpm run build`
4. Output directory: `dist`
5. Environment variables configured in Vercel dashboard

## Database Integration

The Astro API routes can access the same SQLite database as the Express backend. To integrate:

1. **Copy database modules** from Express backend:

   ```bash
   cp -r ../src/infrastructure ../src/application ../src/utils/
   ```

2. **Use repositories in API routes:**

   ```typescript
   import { SpaceRepository } from "@/infrastructure/repositories/spaceRepository";

   const spaceRepo = new SpaceRepository();
   const spaces = await spaceRepo.listByUserId(userId);
   ```

## Migration Checklist

- [ ] All EJS templates converted to Astro pages
- [ ] All Express routes converted to Astro API routes
- [ ] CSS converted to TailwindCSS
- [ ] React components created for interactive elements
- [ ] Authentication system integrated
- [ ] Database layer connected
- [ ] Tests updated for new API routes
- [ ] Environment configuration set up
- [ ] Build process tested
- [ ] Production deployment configured
- [ ] Performance optimized
- [ ] Security audit completed (HTTPS, CORS, CSP)

## Troubleshooting

### Pages not rendering

- Check `src/pages/` for correct file naming
- Ensure Astro layout is imported in pages
- Verify component exports default

### API routes returning 404

- Check route file in `src/api/`
- Verify method export (GET, POST, etc.)
- Confirm file path matches URL pattern

### Styling not applying

- Check TailwindCSS configuration
- Verify class names in global CSS
- Run `pnpm run build` and check output

### Database connection issues

- Verify `.env` DATABASE_URL is correct
- Check database file permissions
- Ensure SQLite driver is installed

## Next Steps

1. **Test thoroughly** - Run through all user journeys
2. **Performance audit** - Use Lighthouse and Web Vitals
3. **Security review** - Check CORS, CSP, and authentication
4. **Training** - Document for team on new code structure
5. **Gradual rollout** - Consider canary deployment
6. **Monitor** - Set up logging and observability

## Support & Resources

- [Astro Documentation](https://docs.astro.build)
- [React Documentation](https://react.dev)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Astro API Routes Guide](https://docs.astro.build/en/guides/endpoints/)

## Contact

For questions about this migration, contact the development team or open an issue in the repository.

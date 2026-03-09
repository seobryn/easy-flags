# Easy Flags

Simple Node + Express + TypeScript app with SQLite-backed feature flags per environment and JWT auth.

## Quick start

1. Copy `.env.example` to `.env` and set values.
2. Install dependencies:

```bash
pnpm install
```

3. Run in development:

```bash
pnpm run dev
```

Open http://localhost:3000 for the landing page, then go to http://localhost:3000/login and sign in with `ADMIN_USER` / `ADMIN_PASS` from your `.env`.

## Database

### Development (Local SQLite)

By default, the application uses a local SQLite database (`./data.db`):

```bash
# .env
DATABASE_URL=file:./data.db
```

### Production (Turso Remote Database)

For production deployments (Vercel, AWS Lambda, etc.), use Turso:

```bash
# .env (or Vercel environment variables)
DATABASE_URL=libsql://your-db-name-your-org.turso.io
DATABASE_AUTH_TOKEN=your_authentication_token
```

See [TURSO_SETUP.md](TURSO_SETUP.md) for complete setup instructions.

## Deployment

### Vercel

1. Push code to repository
2. Import project on Vercel
3. Add environment variables in project settings:
   - `DATABASE_URL`: Your Turso database URL
   - `DATABASE_AUTH_TOKEN`: Your Turso authentication token
4. Deploy

The application runs migrations automatically on startup.

### Local/Self-Hosted

```bash
pnpm run build
pnpm start
```

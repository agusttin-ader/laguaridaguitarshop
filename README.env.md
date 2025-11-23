# Environment variables

This project uses environment variables to keep secrets out of source control. Copy `.env.local.example` -> `.env.local` for local development and fill values.

Server vs Client
- Variables prefixed with `NEXT_PUBLIC_` are safe to expose to the client. Only put non-sensitive values here.
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER be prefixed with `NEXT_PUBLIC_` and must only be set in server environments (Vercel/Netlify secrets, Docker env, etc.).

Required variables
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon public key (client)
- `NEXT_PUBLIC_APP_URL` — your app base URL (e.g. `https://app.example.com`)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)

Optional/dev variables
- `ADMIN_PANEL_TOKEN` — temporary admin token for local dev only (remove in prod)
- `ADMIN_ALLOWED_HOST` — optional host used by `lib/adminAuth.validateOrigin` in production

Best practices
- Do not commit `.env.local`. It's listed in `.gitignore`.
- Use your hosting provider's environment variable manager for production secrets.
- Rotate `SUPABASE_SERVICE_ROLE_KEY` if you suspect exposure.

CI notes
- The supplied GitHub Actions workflow runs `npm ci`, `npm run lint`, `npm run build` and `npm audit`.
- The `Optimize Images` workflow is manual (workflow_dispatch) and uploads generated images as an artifact.

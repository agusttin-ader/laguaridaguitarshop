# Settings persistence (Supabase + Storage + FS)

This project uses a three-tier settings persistence strategy:

- Local filesystem (`data/settings.json`) — used in development.
- Supabase `settings` table (preferred for production) — requires `SUPABASE_SERVICE_ROLE_KEY`.
- Supabase Storage fallback: `product-images/site-settings/settings.json` — used when filesystem is read-only and DB isn't available.

What you need to do in Production (Vercel):

1. Add `SUPABASE_SERVICE_ROLE_KEY` to environment variables (Preview & Production).
   - Key name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: paste the Service Role Key from Supabase (Settings -> API)

2. (Optional but recommended) Create the `settings` table in Supabase.
   - Run the SQL file: `db/create_settings.sql` in Supabase SQL editor.

3. Ensure `ENABLE_ENV_OVERRIDES` is *not* set to `true` in Production unless you want deployment env vars to override admin edits.

4. Verify via curl or the admin panel:

- GET current settings and see where they were read from:

```
curl -i https://<YOUR_SITE>/api/admin/settings
```

Look at the response headers — `x-settings-persisted-to` will be `filesystem|database|storage`.

- PATCH to update settings (example using `ADMIN_PANEL_TOKEN`):

```
curl -i -X PATCH https://<YOUR_SITE>/api/admin/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_PANEL_TOKEN" \
  -d '{"heroImage":"/images/new-hero.jpg","featured":["model-a","model-b"]}'
```

The response headers will include `x-settings-persisted-to` showing where the server wrote the settings.

If `x-settings-persisted-to` is `database` then the DB upsert worked. If it's `storage` the app saved to Supabase Storage. If `filesystem` you'll be on a writable host (local).

Troubleshooting
--------------
- If writes return `storage` but you don't see the file in Supabase Storage, ensure `SUPABASE_SERVICE_ROLE_KEY` is set and correct.
- If writes fail with a 500, check Vercel function logs and server console for the error string returned by the API.
- If you prefer not to use the DB, ensure the service role key is present so storage uploads are permitted.

If you'd like, I can attempt a quick `PATCH` request from here (requires the service key or admin token). Otherwise follow the steps above and paste the response headers if something fails and I'll continue debugging.

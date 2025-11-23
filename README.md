# La Guarida Guitarshop — README (versión "fachera")

Bienvenido/a al repositorio de La Guarida Guitarshop 🎸 — versión rápida y con estilo.

---

📌 ¿Qué es esto?

Un frontend minimalista para mostrar guitarras destacadas y fichas de producto, construido con:

- Next.js (App Router)
- Tailwind CSS
- Framer Motion (animaciones suaves)
- `next/image` para imágenes optimizadas

---

🚀 Arranque rápido

```bash
npm install
npm run dev
```

Visitar: `http://localhost:3000/`
---

🏠 Páginas clave

- Home: `/` — sección **Destacados** con layout alternado (imagen + descripción).


- Fondo oscuro y contraste alto para foco en las imágenes.
- Acento dorado `#D4AF37` en hover de botones.
- Hero con imagen grande y CTA claro.
- Galería de producto con transición suave (fade + scale).

---

🛠 Estructura

- `app/data/models.js` — datos de modelos (slug, title, teaser, price, images)
Admin panel (Supabase)
----------------------

This project includes a scaffold for an admin panel using Supabase (Auth + Postgres + Storage).

Quick setup steps:

- Install Supabase client:

```bash
npm install @supabase/supabase-js
```

- Create a Supabase project and enable Email auth (configure SMTP for password recovery).
- Create a table for products: run the SQL in `db/create_products.sql` in the Supabase SQL editor.
- Add environment variables to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # keep this secret, only on server
ADMIN_PANEL_TOKEN=a_random_secret_for_initial_api_protection
```

- Routes added:
	- Admin login: `/admin/login`
	- Admin dashboard scaffold: `/admin/dashboard`
	- Admin products API: `app/api/admin/products` (GET/POST/DELETE). Protected by `x-admin-token` header matching `ADMIN_PANEL_TOKEN`.

Notes:
- The current implementation is an initial scaffold. For production you should:
	- Use Supabase Auth server-side verification (validate JWTs) and/or RLS policies.
	- Store images in Supabase Storage and use presigned URLs for uploads.
	- Harden API protection (replace `ADMIN_PANEL_TOKEN` with proper session-based checks).


---

✍️ Notas rápidas para editar

- Cambiar teasers en `app/data/models.js` (campo `teaser`).
- Ajustar alturas en `app/components/ProductPage.jsx` (min-h en el contenedor principal).
- Reemplazar imágenes en `public/images/` para URLs limpias (sin espacios).

---

© La Guarida Guitarshop

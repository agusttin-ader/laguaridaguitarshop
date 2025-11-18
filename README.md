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
- Modelos: `/modelos` — grilla de cards con "Ver detalles".
- Producto: `/modelos/<slug>` — galería principal grande, navegación prev/next y botón "Me interesa" (abre WhatsApp).

---

🎨 Diseño y UX

- Fondo oscuro y contraste alto para foco en las imágenes.
- Acento dorado `#D4AF37` en hover de botones.
- Hero con imagen grande y CTA claro.
- Galería de producto con transición suave (fade + scale).

---

🛠 Estructura

- `app/components/` — componentes reutilizables
- `app/data/models.js` — datos de modelos (slug, title, teaser, price, images)
- `public/images/` — assets de imagen

---

✍️ Notas rápidas para editar

- Cambiar teasers en `app/data/models.js` (campo `teaser`).
- Ajustar alturas en `app/components/ProductPage.jsx` (min-h en el contenedor principal).
- Reemplazar imágenes en `public/images/` para URLs limpias (sin espacios).

---

© La Guarida Guitarshop

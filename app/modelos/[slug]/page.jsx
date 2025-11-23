import { getProducts } from "../../lib/getProducts";
import ProductPage from "../../components/ProductPage";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://laguaridaguitarshop.com'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const products = await getProducts()
  const model = (products || []).find((m) => m.slug === slug)
  if (!model) return { title: 'Modelo - La Guarida Guitarshop' }

  const title = model.title || model.slug
  const description = (model.description || '').split('\n').join(' ').slice(0,160)
  const images = (model.images || []).slice(0,3)
  const url = `${SITE_URL}/modelos/${encodeURIComponent(model.slug)}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images,
      // Next.js enforces a small set of OG types; 'product' can cause
      // a runtime validation error. Use 'website' for compatibility.
      type: 'website'
    },
    twitter: { card: 'summary_large_image', title, description }
  }
}

export default async function ModelRoute({ params }) {
  const { slug } = await params;
  const products = await getProducts()
  const model = (products || []).find((m) => m.slug === slug)

  if (!model) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Modelo no encontrado</h1>
        <p className="mt-4 text-sm text-white/70">El modelo que buscás no existe.</p>
        <div className="mt-6 text-sm text-white/60">
          <div>Slug solicitado: <strong>{slug}</strong></div>
          <div className="mt-3">Slugs disponibles:</div>
          <ul className="mt-2 list-disc list-inside text-sm text-white/60">
            {(products || []).map((mm) => (
              <li key={mm.slug}>{mm.slug}</li>
            ))}
          </ul>
        </div>
      </main>
    );
  }

  // Build JSON-LD Product structured data
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": model.title,
    "description": (model.description || '').split('\n').join(' '),
    "image": model.images || [],
    "sku": model.id || model.slug,
    "url": `${SITE_URL}/modelos/${encodeURIComponent(model.slug)}`,
    "offers": {
      "@type": "Offer",
      "url": `${SITE_URL}/modelos/${encodeURIComponent(model.slug)}`,
      "price": model.price ? String(model.price).replace(/[^[0-9\.,\-]]/g, '') : undefined,
      "priceCurrency": model.price && String(model.price).includes('U$S') ? 'USD' : 'ARS',
      "availability": "https://schema.org/InStock"
    }
  }

  // ProductPage is a client component that handles the interactive gallery
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(productLd)}</script>
      <ProductPage model={model} />
    </>
  )
}

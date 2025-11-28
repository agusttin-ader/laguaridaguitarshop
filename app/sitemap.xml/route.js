import products from '../data/products.json'

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://laguaridaguitarshop.com'
  const pages = ['','modelos','destacado','admin']
  const today = new Date().toISOString().split('T')[0]

  const urls = []
  for (const p of pages) {
    urls.push(`<url><loc>${base}/${p}</loc><changefreq>weekly</changefreq><priority>0.8</priority><lastmod>${today}</lastmod></url>`)
  }

  // Add products
  for (const prod of (products || [])) {
    const slug = prod.slug || prod.id || ''
    if (!slug) continue
    const loc = `${base}/modelos/${encodeURIComponent(slug)}`
    urls.push(`<url><loc>${loc}</loc><changefreq>monthly</changefreq><priority>0.7</priority><lastmod>${today}</lastmod></url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}\n</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, must-revalidate'
    }
  })
}

import { supabaseAdmin } from '../../lib/supabaseAdmin'
import fs from 'fs'
import path from 'path'

export async function getProducts() {
  // Fetch from DB first
  let dbProducts = []
  try {
    const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false })
    if (!error && Array.isArray(data)) dbProducts = data.map((r) => ({
      // include all DB fields so frontend can access specs/metadata when present
      ...r,
      slug: r.slug || (r.title ? makeSlug(r.title) : r.id),
      price: typeof r.price === 'number' ? `U$S ${r.price}` : r.price,
      images: Array.isArray(r.images) ? normalizeImages(r.images) : [],
    }))
  } catch (err) {
    console.error('getProducts: DB fetch failed', err)
  }

  // Read lightweight products.json to include any items created directly there (fallback)
  let jsonProducts = []
  try {
    const productsJsonPath = path.join(process.cwd(), 'app', 'data', 'products.json')
    const raw = await fs.promises.readFile(productsJsonPath, 'utf8')
    jsonProducts = JSON.parse(raw || '[]')
  } catch {
    // ignore
  }

  // Merge: preferring DB products, then append any json products not already present (by slug or title)
  const merged = [...dbProducts]
  const existingKeys = new Set(merged.map((p) => p.slug || p.id || p.title))
  for (const jp of jsonProducts) {
    const key = jp.slug || jp.id || jp.title
    if (!existingKeys.has(key)) {
      merged.push({
        // keep original JSON fields so specs/marca/modelo are preserved
        ...jp,
        id: jp.id || null,
        slug: jp.slug || (jp.title ? makeSlug(jp.title) : null),
        images: Array.isArray(jp.images) ? normalizeImages(jp.images) : [],
      })
    }
  }

  return merged
}

function normalizeImages(images) {
  // Ensure each image entry is an object with at least a `url` property
  return (images || []).map((img) => {
    if (!img) return null
    if (typeof img === 'string') return { url: String(img) }
    if (typeof img === 'object') {
      // If it's already shaped like { url, variants }, keep it but ensure url exists
      const url = img.url || img.publicUrl || img.path || img.name || null
      const variants = img.variants || {}
      return { ...img, url, variants }
    }
    return null
  }).filter(Boolean)
}

function makeSlug(s) {
  return s
    .toString()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

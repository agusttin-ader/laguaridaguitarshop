import { supabaseAdmin } from '../../lib/supabaseAdmin'
import fs from 'fs'
import path from 'path'

export async function getProducts() {
  // Fetch from DB first
  let dbProducts = []
  try {
    const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false })
    if (!error && Array.isArray(data)) dbProducts = data.map((r) => ({
      id: r.id,
      slug: r.slug || (r.title ? makeSlug(r.title) : r.id),
      title: r.title,
      description: r.description,
      price: typeof r.price === 'number' ? `U$S ${r.price}` : r.price,
      images: Array.isArray(r.images) ? r.images : [],
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
  } catch (err) {
    // ignore
  }

  // Merge: preferring DB products, then append any json products not already present (by slug or title)
  const merged = [...dbProducts]
  const existingKeys = new Set(merged.map((p) => p.slug || p.id || p.title))
  for (const jp of jsonProducts) {
    const key = jp.slug || jp.id || jp.title
    if (!existingKeys.has(key)) {
      merged.push({
        id: jp.id || null,
        slug: jp.slug || (jp.title ? jp.title.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-') : null),
        title: jp.title,
        description: jp.description,
        price: jp.price,
        images: Array.isArray(jp.images) ? jp.images : [],
      })
    }
  }

  return merged
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

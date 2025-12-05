import { supabaseAdmin } from '../../lib/supabaseAdmin'
import fs from 'fs'
import path from 'path'

export async function getProducts() {
  // Fetch from DB first
  let dbProducts = []
  try {
    const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false })
    if (!error && Array.isArray(data)) dbProducts = data.map((r) => {
      // Normalize images: support arrays, objects and JSON-encoded strings
      let imgs = []
      try {
        if (Array.isArray(r.images)) imgs = normalizeImages(r.images)
        else if (typeof r.images === 'string' && r.images.trim() !== '') {
          try {
            const parsed = JSON.parse(r.images)
            if (Array.isArray(parsed)) imgs = normalizeImages(parsed)
          } catch (e) {
            // treat as single URL string
            imgs = normalizeImages([r.images])
          }
        }
      } catch (e) {
        imgs = []
      }

      return {
        id: r.id,
        slug: r.slug || (r.title ? makeSlug(r.title) : r.id),
        title: r.title,
        description: r.description,
        price: typeof r.price === 'number' ? `U$S ${r.price}` : r.price,
        images: imgs,
      }
    })
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

  // Merge: prefer DB products, but fall back to local JSON for missing images or missing products
  const merged = [...dbProducts]
  const existingMap = new Map(merged.map((p) => [(p.slug || p.id || p.title), p]))
  for (const jp of jsonProducts) {
    const key = jp.slug || jp.id || jp.title
    if (!existingMap.has(key)) {
      const entry = {
        id: jp.id || null,
        slug: jp.slug || (jp.title ? jp.title.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-') : null),
        title: jp.title,
        description: jp.description,
        price: jp.price,
        images: Array.isArray(jp.images) ? normalizeImages(jp.images) : [],
      }
      merged.push(entry)
      existingMap.set(key, entry)
    } else {
      // If DB exists but has no usable images, prefer json images
      const existing = existingMap.get(key)
      const hasUsable = Array.isArray(existing.images) && existing.images.length > 0
      if (!hasUsable && Array.isArray(jp.images) && jp.images.length > 0) {
        existing.images = normalizeImages(jp.images)
      } else if (hasUsable) {
        // If DB images are placeholders (homepage), and JSON has real images, replace
        const allPlaceholders = existing.images.every((e) => {
          try {
            const u = (e && (e.url || e)) || ''
            return String(u).includes('/images/homepage.jpeg')
          } catch { return false }
        })
        if (allPlaceholders && Array.isArray(jp.images) && jp.images.length > 0) {
          existing.images = normalizeImages(jp.images)
        }
      }
    }
  }

  return merged
}

function normalizeImages(images) {
  // Ensure each image entry is an object with at least a `url` property
  const homepagePlaceholder = '/images/homepage.jpeg'
  return (images || []).map((img) => {
    if (!img) return null
    if (typeof img === 'string') {
      const u = String(img)
      if (u === homepagePlaceholder) return null
      return { url: u }
    }
    if (typeof img === 'object') {
      // If it's already shaped like { url, variants }, keep it but ensure url exists
      const url = img.url || img.publicUrl || img.path || img.name || null
      const variants = img.variants || {}
      if (url === homepagePlaceholder) return null
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

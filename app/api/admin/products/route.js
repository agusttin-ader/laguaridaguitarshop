import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { parseBearer, getUserFromRequest, isAdmin, isOwner, sanitizeString, rateCheck, validateJsonContentType, validateOrigin } from '../../../../lib/adminAuth'
import fs from 'fs'
import path from 'path'

// Server-side session validation using Supabase access tokens.
// Clients must send `Authorization: Bearer <access_token>`.

async function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
}

// Use centralized helpers from `lib/adminAuth.js` (imported at top)

export async function GET(request) {
  // rate-limit by IP
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || ''
  if (!rateCheck(ip)) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { 'Content-Type': 'application/json' } })

  const { user, error: userErr } = await getUserFromRequest(request)
  if (userErr || !user) return unauthorized()
  const owner = isOwner(user)
  const adminFlag = await isAdmin(user.id)
  if (!owner && !adminFlag) return unauthorized()

  const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false })
  if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(request) {
  // basic origin/content-type checks
  if (!validateOrigin(request)) return unauthorized()
  if (!validateJsonContentType(request)) return new Response(JSON.stringify({ error: 'Invalid content-type' }), { status: 415, headers: { 'Content-Type': 'application/json' } })

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || ''
  if (!rateCheck(ip)) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { 'Content-Type': 'application/json' } })

  const { user, error: userErr } = await getUserFromRequest(request)
  if (userErr || !user) return unauthorized()
  const owner = isOwner(user)
  const adminFlag = await isAdmin(user.id)
  if (!owner && !adminFlag) return unauthorized()

  const body = await request.json().catch(()=>({}))
  const titleRaw = body.title
  const descriptionRaw = body.description
  const specsRaw = body.specs
  const priceRaw = body.price
  const imagesRaw = body.images
  const title = sanitizeString(titleRaw)
  if (!title) return new Response(JSON.stringify({ error: 'title is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  const description = sanitizeString(descriptionRaw)
  const specs = typeof specsRaw === 'object' ? specsRaw : {}
  const price = (typeof priceRaw === 'number') ? priceRaw : (priceRaw ? sanitizeString(priceRaw) : null)
  const images = Array.isArray(imagesRaw) ? imagesRaw : []

  const { data, error } = await supabaseAdmin.from('products').insert([{ title, description, specs: specs ?? {}, price: price ?? null, images: images ?? [] }]).select().maybeSingle()
  if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  // Also persist a lightweight product entry to app/data/products.json so the site "modelos" can show recently added items
  try {
    const dataDir = path.join(process.cwd(), 'app', 'data')
    const productsJsonPath = path.join(dataDir, 'products.json')
    let current = []
    try {
      const raw = await fs.promises.readFile(productsJsonPath, 'utf8')
      current = JSON.parse(raw || '[]')
    } catch (e) {
      current = []
    }

    // Generate a slug from title
    const makeSlug = (s) =>
      s
        .toString()
        .toLowerCase()
        .normalize('NFKD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

    const slug = makeSlug(title || (data && data.title) || Date.now().toString())

    const productForList = {
      id: data?.id || null,
      slug,
      title: title || (data && data.title) || '',
      description: description || (data && data.description) || '',
      price: typeof price === 'number' ? `U$S ${price}` : price || (data && data.price) || '',
      images: (images && images.length) ? images.map((i) => i.url || i.publicUrl || i.path || i.name) : (data && data.images) || [],
    }

    // Prepend newest product so it appears first in modelos
    current.unshift(productForList)
    await fs.promises.writeFile(productsJsonPath, JSON.stringify(current, null, 2), 'utf8')
  } catch (err) {
    console.error('Failed to persist product to products.json', err)
  }

  // Return the created row with explicit 201 status
  return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } })
}

export async function DELETE(request) {
  if (!validateJsonContentType(request)) return new Response(JSON.stringify({ error: 'Invalid content-type' }), { status: 415, headers: { 'Content-Type': 'application/json' } })
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || ''
  if (!rateCheck(ip)) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { 'Content-Type': 'application/json' } })

  const { user, error: userErr } = await getUserFromRequest(request)
  if (userErr || !user) return unauthorized()
  const owner = isOwner(user)
  const adminFlag = await isAdmin(user.id)
  if (!owner && !adminFlag) return unauthorized()

  const body = await request.json().catch(()=>({}))
  const id = body.id
  const slug = body.slug ? sanitizeString(body.slug) : undefined
  const title = body.title ? sanitizeString(body.title) : undefined

  // If an id was provided, attempt DB deletion (best-effort). Otherwise skip DB delete.
  let dbResult = null
  try {
    if (id) {
      const { data, error } = await supabaseAdmin.from('products').delete().match({ id })
      if (error) console.error('DB delete error', error)
      dbResult = data
    }
  } catch (err) {
    console.error('DB delete threw', err)
  }

  // Always attempt to remove matching entries from products.json by id, slug or title
  try {
    const dataDir = path.join(process.cwd(), 'app', 'data')
    const productsJsonPath = path.join(dataDir, 'products.json')
    let current = []
    try {
      const raw = await fs.promises.readFile(productsJsonPath, 'utf8')
      current = JSON.parse(raw || '[]')
    } catch (e) { current = [] }

    const filtered = current.filter((p) => {
      if (!p) return false
      if (id && p.id && p.id === id) return false
      if (slug && p.slug && p.slug === slug) return false
      if (title && p.title && p.title === title) return false
      // also try to match against dbResult if available
      if (dbResult && Array.isArray(dbResult) && dbResult.length > 0) {
        const dbRow = dbResult[0]
        if (p.id && dbRow.id && p.id === dbRow.id) return false
        if (p.slug && dbRow.slug && p.slug === dbRow.slug) return false
        if (p.title && dbRow.title && p.title === dbRow.title) return false
      }
      return true
    })
    if (filtered.length !== current.length) {
      await fs.promises.writeFile(productsJsonPath, JSON.stringify(filtered, null, 2), 'utf8')
    }
  } catch (err) {
    console.error('Failed to remove product from products.json', err)
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export async function PATCH(request) {
  if (!validateOrigin(request)) return unauthorized()
  if (!validateJsonContentType(request)) return new Response(JSON.stringify({ error: 'Invalid content-type' }), { status: 415, headers: { 'Content-Type': 'application/json' } })
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || ''
  if (!rateCheck(ip)) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { 'Content-Type': 'application/json' } })

  const { user, error: userErr } = await getUserFromRequest(request)
  if (userErr || !user) return unauthorized()
  const owner = isOwner(user)
  const adminFlag = await isAdmin(user.id)
  if (!owner && !adminFlag) return unauthorized()

  const body = await request.json().catch(()=>({}))
  const id = body.id
  if (!id) return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  const title = body.title !== undefined ? sanitizeString(body.title) : undefined
  const description = body.description !== undefined ? sanitizeString(body.description) : undefined
  const specs = body.specs !== undefined ? body.specs : undefined
  const price = body.price !== undefined ? (typeof body.price === 'number' ? body.price : sanitizeString(body.price)) : undefined
  const images = body.images !== undefined ? (Array.isArray(body.images) ? body.images : undefined) : undefined

  const updates = {}
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (specs !== undefined) updates.specs = specs
  if (price !== undefined) updates.price = price
  if (images !== undefined) updates.images = images

  const { data, error } = await supabaseAdmin.from('products').update(updates).eq('id', id).select().maybeSingle()
  if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: { 'Content-Type': 'application/json' } })

  // Sync lightweight products.json
  try {
    const dataDir = path.join(process.cwd(), 'app', 'data')
    const productsJsonPath = path.join(dataDir, 'products.json')
    let current = []
    try {
      const raw = await fs.promises.readFile(productsJsonPath, 'utf8')
      current = JSON.parse(raw || '[]')
    } catch (e) { current = [] }

    const updated = current.map((p) => {
      if (!p) return p
      if ((p.id && p.id === id) || (p.slug && p.slug === (data && data.slug)) || (p.title && p.title === (data && data.title))) {
        return {
          ...(p || {}),
          id: data.id,
          slug: p.slug || (data.slug || ''),
          title: data.title || p.title,
          description: data.description || p.description,
          price: typeof data.price === 'number' ? `U$S ${data.price}` : data.price || p.price,
          images: (data.images && data.images.length) ? data.images.map((i) => i.url || i.publicUrl || i.path || i.name || i) : p.images || [],
        }
      }
      return p
    })
    await fs.promises.writeFile(productsJsonPath, JSON.stringify(updated, null, 2), 'utf8')
  } catch (err) { console.error('Failed to sync products.json on PATCH', err) }

  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

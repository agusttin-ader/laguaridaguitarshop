import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { isOwner, sanitizeString, rateCheck, validateJsonContentType, validateOrigin } from '../../../../lib/adminAuth'

const SETTINGS_PATH = path.resolve(process.cwd(), 'data', 'settings.json')
let lastReadSource = 'filesystem'
let lastWriteSource = 'filesystem'

async function readSettings(){
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    lastReadSource = 'filesystem'
    return JSON.parse(raw)
  } catch (e) {
    // If filesystem is not writable/readable (serverless like Vercel),
    // attempt to load settings from Supabase Storage as a fallback.
    try {
      // Use existing `product-images` bucket as a place to store settings.json
      const { data, error } = await supabaseAdmin.storage.from('product-images').download('site-settings/settings.json')
      if (error || !data) return { featured: [], heroImage: '/images/homepage.jpeg' }
      const text = await data.text()
      lastReadSource = 'storage'
      return JSON.parse(text)
    } catch (_) {
      return { featured: [], heroImage: '/images/homepage.jpeg' }
    }
  }
}

// Merge environment overrides so deployments can control some settings
// without editing `data/settings.json`. Supported env vars:
// - HERO_IMAGE: URL string to override hero image
// - FEATURED_ORDER: comma-separated list of product ids/slugs for featured order
// - FEATURED_MAIN_JSON: JSON string mapping productId->imageUrl for featured main images
function applyEnvOverrides(settings){
  // Only apply environment overrides when explicitly enabled. This lets the
  // admin panel remain authoritative by default and avoids surprising
  // behavior where env vars silently hide admin edits. To enable, set
  // `ENABLE_ENV_OVERRIDES=true` in the deployment environment.
  try {
    const enabled = String(process.env.ENABLE_ENV_OVERRIDES || 'false').toLowerCase() === 'true'
    if (!enabled) return settings
  } catch (e) {
    return settings
  }
  try {
    if (process.env.HERO_IMAGE && String(process.env.HERO_IMAGE).trim() !== '') {
      settings.heroImage = String(process.env.HERO_IMAGE)
    }
    if (process.env.FEATURED_ORDER && String(process.env.FEATURED_ORDER).trim() !== '') {
      const list = String(process.env.FEATURED_ORDER).split(',').map(s=>s.trim()).filter(Boolean)
      if (list.length) settings.featured = list
    }
    if (process.env.FEATURED_MAIN_JSON && String(process.env.FEATURED_MAIN_JSON).trim() !== '') {
      try {
        const obj = JSON.parse(process.env.FEATURED_MAIN_JSON)
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
          settings.featuredMain = settings.featuredMain || {}
          Object.entries(obj).forEach(([k,v])=>{ settings.featuredMain[String(k)] = String(v) })
        }
      } catch (e) {
        // ignore malformed JSON
      }
    }
  } catch (e) {}
  return settings
}

async function writeSettings(obj){
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(obj, null, 2), 'utf-8')
    lastWriteSource = 'filesystem'
    return
  } catch (e) {
    // If writing to local filesystem fails (e.g., Vercel read-only),
    // persist settings to Supabase Storage as a fallback so admin edits
    // still work in production. Use `product-images/site-settings/settings.json`.
    try {
      const buf = Buffer.from(JSON.stringify(obj, null, 2), 'utf-8')
      // upload with upsert=true to overwrite existing
      const { data, error } = await supabaseAdmin.storage.from('product-images').upload('site-settings/settings.json', buf, { upsert: true })
      if (error) throw error
      lastWriteSource = 'storage'
      return
    } catch (err) {
      // rethrow original fs error if storage fallback also fails
      throw e
    }
  }
}

function unauthorized(){
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
}

export async function GET(){
  let settings = await readSettings()
  const envEnabled = String(process.env.ENABLE_ENV_OVERRIDES || 'false').toLowerCase() === 'true'
  settings = applyEnvOverrides(settings)
  const headers = { 'Content-Type': 'application/json', 'x-settings-persisted-to': lastReadSource }
  if (envEnabled) headers['x-settings-env-overrides'] = 'true'
  return new Response(JSON.stringify(settings), { status: 200, headers })
}

export async function PATCH(req){
  // Authorization: allow either the static ADMIN_PANEL_TOKEN or a valid Supabase
  // access token belonging to an admin user. This keeps backward compatibility
  // while allowing the admin UI to call with the Supabase session token.
  const adminToken = process.env.ADMIN_PANEL_TOKEN
  const authHeader = req.headers.get('authorization') || req.headers.get('x-admin-token') || ''
  const providedToken = authHeader.replace(/^Bearer\s*/i, '')

  async function getUserFromRequest(request) {
    const auth = request.headers.get('authorization') || ''
    const match = auth.match(/^Bearer (.+)$/i)
    if (!match) return { user: null, error: 'Missing Authorization header' }
    const accessToken = match[1]
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(accessToken)
      if (error) return { user: null, error }
      return { user: data.user, error: null }
    } catch (err) {
      return { user: null, error: err }
    }
  }

  async function isAdmin(userId) {
    if (!userId) return false
    const { data, error } = await supabaseAdmin.from('admins').select('id').eq('id', userId).limit(1).maybeSingle()
    if (error) return false
    return !!data
  }

  // If ADMIN_PANEL_TOKEN is configured and matches, allow. Otherwise try Supabase auth.
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.ip || ''
  if (!rateCheck(ip)) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { 'Content-Type': 'application/json' } })

  if (adminToken && providedToken && providedToken === adminToken) {
    // ok
  } else {
    if (!validateOrigin(req)) return unauthorized()
    const { user, error: userErr } = await getUserFromRequest(req)
    if (userErr || !user) return unauthorized()
    const ok = await isAdmin(user.id) || isOwner(user)
    if (!ok) return unauthorized()
  }

  try {
    if (!validateJsonContentType(req)) return new Response(JSON.stringify({ error: 'Invalid content-type' }), { status: 415, headers: { 'Content-Type': 'application/json' } })
    const body = await req.json().catch(()=>({}))
    let settings = await readSettings()
    // allow updating featured (array) and/or heroImage (string)
    if (body.featured) {
      if (!Array.isArray(body.featured)) return new Response(JSON.stringify({ error: 'featured must be array' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      if (body.featured.length > 3) return new Response(JSON.stringify({ error: 'Maximum 3 featured allowed' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      settings.featured = body.featured.map(sanitizeString)
    }
    // allow updating featuredMain: an object mapping productId->imageUrl
    if (body.featuredMain) {
      if (typeof body.featuredMain !== 'object' || Array.isArray(body.featuredMain)) return new Response(JSON.stringify({ error: 'featuredMain must be an object mapping id->image' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      const obj = {}
      Object.entries(body.featuredMain || {}).forEach(([k,v]) => { obj[sanitizeString(k)] = sanitizeString(v) })
      settings.featuredMain = obj
    }
    if (body.heroImage) {
      settings.heroImage = sanitizeString(body.heroImage)
    }
    // Always persist to file. Env overrides still take precedence at GET-time.
    await writeSettings(settings)
    const envEnabled = String(process.env.ENABLE_ENV_OVERRIDES || 'false').toLowerCase() === 'true'
    settings = applyEnvOverrides(settings)
    const headers = { 'Content-Type': 'application/json', 'x-settings-persisted-to': lastWriteSource }
    if (envEnabled) headers['x-settings-env-overrides'] = 'true'
    return new Response(JSON.stringify(settings), { status: 200, headers })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

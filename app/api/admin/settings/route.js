import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { isOwner, sanitizeString, rateCheck, validateJsonContentType, validateOrigin } from '../../../../lib/adminAuth'

const SETTINGS_PATH = path.resolve(process.cwd(), 'data', 'settings.json')

function readSettings(){
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { featured: [], heroImage: '/images/homepage.jpeg' }
  }
}

function writeSettings(obj){
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(obj, null, 2), 'utf-8')
}

function unauthorized(){
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
}

export async function GET(){
  const settings = readSettings()
  return new Response(JSON.stringify(settings), { status: 200, headers: { 'Content-Type': 'application/json' } })
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
    const settings = readSettings()
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
    writeSettings(settings)
    return new Response(JSON.stringify(settings), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

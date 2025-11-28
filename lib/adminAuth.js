import { supabaseAdmin } from './supabaseAdmin'

const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'agusttin.ader@gmail.com'

// Very small in-memory rate limiter (per IP) — process-local only
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = parseInt(process.env.ADMIN_RATE_LIMIT_MAX || '60', 10)
const rateMap = new Map()

function rateCheck(ip) {
  if (!ip) return true
  const now = Date.now()
  const rec = rateMap.get(ip) || { t: now, c: 0 }
  if (now - rec.t > RATE_LIMIT_WINDOW) {
    rec.t = now
    rec.c = 1
    rateMap.set(ip, rec)
    return true
  }
  rec.c += 1
  rateMap.set(ip, rec)
  if (rec.c > RATE_LIMIT_MAX) return false
  return true
}

function parseBearer(authHeader) {
  if (!authHeader) return null
  const m = String(authHeader).match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : null
}

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = parseBearer(authHeader)
  if (!token) return { user: null, error: 'missing token' }
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error) return { user: null, error }
    return { user: data.user, error: null }
  } catch (err) { return { user: null, error: err } }
}

async function isAdmin(userId) {
  if (!userId) return false
  try {
    const { data, error } = await supabaseAdmin.from('admins').select('id').eq('id', userId).limit(1).maybeSingle()
    if (error) return false
    return !!data
  } catch (err) { return false }
}

function isOwner(user) {
  if (!user) return false
  return (user.email === OWNER_EMAIL)
}

function sanitizeString(s) {
  if (s == null) return s
  try {
    return String(s).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '').trim()
  } catch (e) { return s }
}

function validateJsonContentType(request) {
  const ct = request.headers.get('content-type') || ''
  if (!ct.toLowerCase().includes('application/json')) return false
  return true
}

function validateOrigin(request) {
  // In production, require same-origin or matching origin header to mitigate CSRF
  if (process.env.NODE_ENV !== 'production') return true
  const origin = request.headers.get('origin') || request.headers.get('referer') || ''
  if (!origin) return false
  try {
    const url = new URL(origin)
    const host = url.host
    // Accept localhost for development if configured
    // Normalize configured allowed host by trimming any trailing slash
    const rawAllowed = process.env.ADMIN_ALLOWED_HOST || host
    const allowedHost = String(rawAllowed).replace(/\/$/, '')
    return host === allowedHost || host.endsWith('.' + allowedHost)
  } catch (e) { return false }
}

export { rateCheck, parseBearer, getUserFromRequest, isAdmin, isOwner, sanitizeString, validateJsonContentType, validateOrigin }

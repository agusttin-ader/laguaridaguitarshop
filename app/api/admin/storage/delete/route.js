import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'
import { getUserFromRequest, isOwner, rateCheck, validateJsonContentType, validateOrigin } from '../../../../../lib/adminAuth'

async function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
}


function extractPathFromPublicUrl(publicUrl, bucket) {
  try {
    if (!publicUrl || typeof publicUrl !== 'string') return null
    // Supabase public url usually contains "/storage/v1/object/public/{bucket}/<path>"
    const marker = `/storage/v1/object/public/${bucket}/`
    const idx = publicUrl.indexOf(marker)
    if (idx !== -1) {
      return publicUrl.slice(idx + marker.length)
    }
    // If it's already a path (starts with bucket/...), try to strip leading /
    if (publicUrl.startsWith('/')) {
      const parts = publicUrl.split('/')
      const bIndex = parts.indexOf(bucket)
      if (bIndex !== -1 && parts.length > bIndex + 1) return parts.slice(bIndex + 1).join('/')
    }
    // If it's just the filename (no path), return as-is
    const u = new URL(publicUrl)
    // fallback: try to take last segment
    const seg = u.pathname.split('/').pop()
    return seg || null
  } catch {
    return null
  }
}

export async function POST(request) {
  if (!validateOrigin(request)) return unauthorized()
  if (!validateJsonContentType(request)) return new Response(JSON.stringify({ error: 'Invalid content-type' }), { status: 415, headers: { 'Content-Type': 'application/json' } })
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || ''
  if (!rateCheck(ip)) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { 'Content-Type': 'application/json' } })

  const { user, error: userErr } = await getUserFromRequest(request)
  if (userErr || !user) return unauthorized()

  // Only owner may perform storage deletes via this endpoint
  const owner = isOwner(user)
  if (!owner) return unauthorized()

  const body = await request.json().catch(() => ({}))
  const { publicUrl, bucket = 'product-images' } = body
  if (!publicUrl) return new Response(JSON.stringify({ error: 'publicUrl is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  const path = extractPathFromPublicUrl(publicUrl, bucket)
  if (!path) return new Response(JSON.stringify({ ok: false, message: 'Could not determine path to delete; skipping' }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  try {
    const { data, error } = await supabaseAdmin.storage.from(bucket).remove([path])
    if (error) return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

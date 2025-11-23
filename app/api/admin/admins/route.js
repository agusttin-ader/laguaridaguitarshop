import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { getUserFromRequest, isAdmin, isOwner, sanitizeString, rateCheck, validateJsonContentType, validateOrigin } from '../../../../lib/adminAuth'

async function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
}

// Use centralized helpers from `lib/adminAuth.js` (imported at top)

export async function GET(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || ''
  if (!rateCheck(ip)) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { 'Content-Type': 'application/json' } })

  const { user, error: userErr } = await getUserFromRequest(request)
  if (userErr || !user) return unauthorized()
  const owner = isOwner(user)
  const adminFlag = await isAdmin(user.id)
  if (!owner && !adminFlag) return unauthorized()

  const { data, error } = await supabaseAdmin.from('admins').select('*')
  if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(request) {
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
  const id = sanitizeString(body.id)
  if (!id) return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  const { data, error } = await supabaseAdmin.from('admins').insert([{ id }]).select().maybeSingle()
  if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } })
}

export async function DELETE(request) {
  if (!validateOrigin(request)) return unauthorized()
  if (!validateJsonContentType(request)) return new Response(JSON.stringify({ error: 'Invalid content-type' }), { status: 415, headers: { 'Content-Type': 'application/json' } })
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || ''
  if (!rateCheck(ip)) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { 'Content-Type': 'application/json' } })

  const { user, error: userErr } = await getUserFromRequest(request)
  if (userErr || !user) return unauthorized()
  const owner = isOwner(user)
  const adminFlag = await isAdmin(user.id)
  if (!owner && !adminFlag) return unauthorized()

  const { id } = await request.json().catch(()=>({}))
  if (!id) return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  const { data, error } = await supabaseAdmin.from('admins').delete().match({ id })
  if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

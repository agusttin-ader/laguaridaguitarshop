import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { getUserFromRequest, isOwner, sanitizeString, rateCheck, validateJsonContentType, validateOrigin } from '../../../../lib/adminAuth'

async function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
}

// Use centralized helpers from `lib/adminAuth.js` (imported at top)

export async function GET(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || ''
  if (!rateCheck(ip)) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { 'Content-Type': 'application/json' } })

  const { user, error: userErr } = await getUserFromRequest(request)
  if (userErr || !user) return unauthorized()
  // Allow owner to list all admins. Allow regular admins to verify their own admin status.
  const owner = isOwner(user)
  if (owner) {
    const { data, error } = await supabaseAdmin.from('admins').select('*')
    if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  // Not owner: check whether the requesting user is in the admins table
  const { data: row, error: rowErr } = await supabaseAdmin.from('admins').select('*').eq('id', user.id).maybeSingle()
  if (rowErr) return new Response(JSON.stringify({ error: rowErr }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  if (!row) return unauthorized()
  // return the matched admin record so client can detect ok
  return new Response(JSON.stringify([row]), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(request) {
  if (!validateOrigin(request)) return unauthorized()
  if (!validateJsonContentType(request)) return new Response(JSON.stringify({ error: 'Invalid content-type' }), { status: 415, headers: { 'Content-Type': 'application/json' } })
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || ''
  if (!rateCheck(ip)) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { 'Content-Type': 'application/json' } })

  const { user, error: userErr } = await getUserFromRequest(request)
  if (userErr || !user) return unauthorized()
  // Only the owner may add admins
  const owner = isOwner(user)
  if (!owner) return unauthorized()

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
  // Only the owner may remove admins
  const owner = isOwner(user)
  if (!owner) return unauthorized()

  const { id } = await request.json().catch(()=>({}))
  if (!id) return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  const { data, error } = await supabaseAdmin.from('admins').delete().match({ id })
  if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

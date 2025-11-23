import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'
import { getUserFromRequest, isAdmin, rateCheck, validateOrigin } from '../../../../../lib/adminAuth'

export async function GET(request) {
  if (!validateOrigin(request)) return new Response(JSON.stringify({ error: 'Unauthorized origin' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || ''
  if (!rateCheck(ip)) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { 'Content-Type': 'application/json' } })

  const { user, error: userErr } = await getUserFromRequest(request)
  if (userErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

  const admin = await isAdmin(user.id)
  if (!admin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })

  try {
    const { data, error } = await supabaseAdmin.storage.listBuckets()
    if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

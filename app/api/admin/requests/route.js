import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

async function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
}

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization') || ''
  const match = authHeader.match(/^Bearer (.+)$/i)
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

async function isOwnerOrAdmin(user) {
  if (!user) return false
  const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'agusttin.ader@gmail.com'
  if (user.email === OWNER_EMAIL) return true
  const { data, error } = await supabaseAdmin.from('admins').select('id').eq('id', user.id).limit(1).maybeSingle()
  if (error) return false
  return !!data
}

export async function POST(request) {
  // Create a new admin request (public) — called after user signs up
  const body = await request.json().catch(()=>({}))
  const { user_id, email, message } = body
  if (!email) return new Response(JSON.stringify({ error: 'email required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  try {
    // prevent duplicates: same email pending
    const { data: exists } = await supabaseAdmin.from('admin_requests').select('id').eq('email', email).eq('status', 'pending').limit(1).maybeSingle()
    if (exists) return new Response(JSON.stringify({ ok: true, message: 'request already pending' }), { status: 200, headers: { 'Content-Type': 'application/json' } })

    const { data, error } = await supabaseAdmin.from('admin_requests').insert([{ user_id: user_id ?? null, email, message: message ?? null }]).select().maybeSingle()
    if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export async function GET(request) {
  // List requests — owner or admin only
  const { user, error } = await getUserFromRequest(request)
  if (error || !user) return unauthorized()
  const allowed = await isOwnerOrAdmin(user)
  if (!allowed) return unauthorized()

  const { data, error: e } = await supabaseAdmin.from('admin_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false })
  if (e) return new Response(JSON.stringify({ error: e }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export async function PATCH(request) {
  // Update request status — owner/admin only (approve/reject)
  const { user, error } = await getUserFromRequest(request)
  if (error || !user) return unauthorized()
  const allowed = await isOwnerOrAdmin(user)
  if (!allowed) return unauthorized()

  const body = await request.json().catch(()=>({}))
  const { id, status } = body
  if (!id || !status) return new Response(JSON.stringify({ error: 'id and status required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  try {
    const { data, error } = await supabaseAdmin.from('admin_requests').update({ status }).eq('id', id).select().maybeSingle()
    if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: { 'Content-Type': 'application/json' } })

    // If approved, also add to admins table
    if (status === 'approved') {
      const user_id = data.user_id
      if (user_id) {
        await supabaseAdmin.from('admins').insert([{ id: user_id }]).maybeSingle()
      }
    }

    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

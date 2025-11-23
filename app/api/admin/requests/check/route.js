import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

// Public endpoint to check if an email has a pending admin request.
export async function POST(request) {
  try {
    const body = await request.json().catch(()=>({}))
    const email = (body.email || '').trim()
    if (!email) return new Response(JSON.stringify({ error: 'email required' }), { status: 400, headers: { 'Content-Type':'application/json' } })

    const { data, error } = await supabaseAdmin.from('admin_requests').select('id,status').eq('email', email).eq('status', 'pending').limit(1).maybeSingle()
    if (error) return new Response(JSON.stringify({ error }), { status: 500, headers: { 'Content-Type':'application/json' } })
    const pending = !!data
    return new Response(JSON.stringify({ pending }), { status: 200, headers: { 'Content-Type':'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type':'application/json' } })
  }
}

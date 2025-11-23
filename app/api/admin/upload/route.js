import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { getUserFromRequest, isAdmin, rateCheck, validateOrigin } from '../../../../lib/adminAuth'

async function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
}


export async function POST(request) {
  if (!validateOrigin(request)) return unauthorized()
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || ''
  if (!rateCheck(ip)) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { 'Content-Type': 'application/json' } })

  const { user, error: userErr } = await getUserFromRequest(request)
  if (userErr || !user) return unauthorized()

  const admin = await isAdmin(user.id)
  if (!admin) return unauthorized()

  try {
    const form = await request.formData()
    const file = form.get('file')
    const bucket = form.get('bucket') || 'product-images'
    if (!file || typeof file === 'string') return new Response(JSON.stringify({ error: 'file is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    const safeName = (file.name || '').replace(/[^a-zA-Z0-9._-]/g, '-')
    const filename = `${Date.now()}_${safeName}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage.from(bucket).upload(filename, buffer, { contentType: file.type })
    if (uploadErr) return new Response(JSON.stringify({ error: String(uploadErr) }), { status: 500, headers: { 'Content-Type': 'application/json' } })

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filename)
    return new Response(JSON.stringify({ publicUrl: data.publicUrl }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

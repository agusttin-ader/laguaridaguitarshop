import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { getUserFromRequest, isAdmin, rateCheck, validateOrigin } from '../../../../lib/adminAuth'
import sharp from 'sharp'

async function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
}


export async function POST(request) {
  // Fail fast with a clear error if Supabase admin credentials are not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Supabase admin not configured. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

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

    // Normalize orientation using EXIF and output in same-ish format (prefer jpeg/png)
    let normalizedBuffer = buffer
    try {
      const img = sharp(buffer)
      // rotate() uses EXIF Orientation to rotate the image to upright
      if ((file.type || '').includes('png')) {
        normalizedBuffer = await img.rotate().png({ quality: 90 }).toBuffer()
      } else {
        normalizedBuffer = await img.rotate().jpeg({ quality: 90 }).toBuffer()
      }
    } catch (err) {
      console.warn('image normalization failed, proceeding with original buffer', err)
      normalizedBuffer = buffer
    }

    // Upload normalized original
    const { error: uploadErr } = await supabaseAdmin.storage.from(bucket).upload(filename, normalizedBuffer, { contentType: file.type })
    if (uploadErr) return new Response(JSON.stringify({ error: String(uploadErr) }), { status: 500, headers: { 'Content-Type': 'application/json' } })

    // Generate optimized variants (webp) at multiple widths
    const SIZES = [320, 640, 1024]
    const variants = {}
    for (const w of SIZES) {
      try {
        // create portrait-cropped variants (3:4) so thumbnails are vertical
        const h = Math.round(w * 4 / 3)
        const outBuffer = await sharp(normalizedBuffer).resize({ width: w, height: h, fit: 'cover' }).webp({ quality: 80 }).toBuffer()
        const outName = `${Date.now()}_${safeName}-w${w}.webp`
        const { error: upErr } = await supabaseAdmin.storage.from(bucket).upload(outName, outBuffer, { contentType: 'image/webp' })
        if (!upErr) {
          const { data: publicData } = supabaseAdmin.storage.from(bucket).getPublicUrl(outName)
          variants[`w${w}`] = publicData.publicUrl
        }
      } catch (err) {
        // continue on individual variant failures
        console.error('variant error', err)
      }
    }

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filename)
    return new Response(JSON.stringify({ publicUrl: data.publicUrl, variants }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

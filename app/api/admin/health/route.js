import { validateOrigin } from '../../../../lib/adminAuth'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function GET(request) {
  try {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      ADMIN_ALLOWED_HOST: process.env.ADMIN_ALLOWED_HOST || null,
      NODE_ENV: process.env.NODE_ENV || null,
    }

    const originValid = validateOrigin(request)

    // In production do not leak env diagnostics to arbitrary origins —
    // require the request to originate from an allowed host.
    if (process.env.NODE_ENV === 'production' && !originValid) {
      return new Response(JSON.stringify({ ok: false, error: 'origin not allowed' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }

    // Try a lightweight Supabase admin call to verify admin client connectivity
    let supabasePing = { ok: false, error: null }
    if (env.SUPABASE_SERVICE_ROLE_KEY && env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const res = await supabaseAdmin.storage.listBuckets()
        // res may be { data, error } or throw — handle both
        if (res && !res.error) supabasePing.ok = true
        else supabasePing.error = res && res.error ? String(res.error) : 'unknown error'
      } catch (err) {
        supabasePing.error = String(err)
      }
    } else {
      supabasePing.error = 'Supabase admin env vars missing'
    }

    const result = { ok: true, env, originValid, supabasePing }
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

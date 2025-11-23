import { createClient } from '@supabase/supabase-js'

// Guard to ensure this module is only used server-side. If imported in
// client-side code the build or runtime should fail fast to avoid leaking
// the service-role key into browser bundles.
if (typeof window !== 'undefined') {
  throw new Error('lib/supabaseAdmin is server-only and must not be imported in client-side code')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabaseAdmin

if (!supabaseUrl || !supabaseServiceRole) {
  console.warn('Missing Supabase admin env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')

  const stubChainable = () => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      limit: () => chain,
      maybeSingle: async () => ({ data: null, error: new Error('Supabase not configured') }),
    }
    return chain
  }

  const supabaseStub = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
    },
    from: (/* table */) => ({
      select: () => stubChainable().select(),
      insert: async () => ({ data: null, error: new Error('Supabase not configured') }),
      update: async () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: async () => ({ data: null, error: new Error('Supabase not configured') }),
      eq: () => stubChainable(),
      limit: () => stubChainable(),
      maybeSingle: async () => ({ data: null, error: new Error('Supabase not configured') }),
    }),
    storage: {
      listBuckets: async () => ({ data: null, error: new Error('Supabase not configured') }),
      from: () => ({ createSignedUrl: async () => ({ data: null, error: new Error('Supabase not configured') }) }),
    },
  }

  supabaseAdmin = supabaseStub
} else {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false },
  })
}

export { supabaseAdmin }
export default supabaseAdmin

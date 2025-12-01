import HeroRender from './HeroRender'

export const dynamic = 'force-dynamic'

export default async function Hero() {
  // Centralize settings reading by calling our API route which already
  // applies env overrides and indicates where settings were read from
  // via headers. This keeps the home in sync with admin changes in
  // deployments (DB/storage/env overrides).
  let heroImage = '/images/homepage.jpeg'
  let persistedSource = 'unknown'
  try {
    // Use a server-side fetch to the internal API. `no-store` ensures we
    // always read the latest settings and avoid caching at the server.
    const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || ''
    const url = base ? new URL('/api/admin/settings', base).toString() : '/api/admin/settings'
    const res = await fetch(url, { cache: 'no-store' })
    if (res && res.ok) {
      const json = await res.json().catch(()=>({}))
      heroImage = (json && json.heroImage) ? json.heroImage : heroImage
      persistedSource = res.headers.get('x-settings-persisted-to') || 'unknown'
    }
  } catch (e) {
    // fallback to default
  }

  // Optionally expose debug info in production when the env var is set.
  // This helps diagnose issues without reading server logs.
  const showDebug = String(process.env.NEXT_PUBLIC_SHOW_SETTINGS_DEBUG || '').toLowerCase() === 'true'
  return <HeroRender heroImage={heroImage} debug={showDebug ? { heroImage, persistedSource } : null} />
}

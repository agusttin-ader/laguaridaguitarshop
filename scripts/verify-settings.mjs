#!/usr/bin/env node
// Usage:
// 1) Install node >=18 (macOS has node if you've set it up). Run:
//    ADMIN_PANEL_TOKEN=xxx DOMAIN=https://tu-dominio node scripts/verify-settings.mjs
// 2) To also attempt a test PATCH (will change heroImage), add --patch
//    ADMIN_PANEL_TOKEN=xxx DOMAIN=https://tu-dominio node scripts/verify-settings.mjs --patch

const domain = process.env.DOMAIN
const token = process.env.ADMIN_PANEL_TOKEN
const args = process.argv.slice(2)
const doPatch = args.includes('--patch')

if (!domain) {
  console.error('ERROR: set DOMAIN env var, e.g. https://mi-sitio.vercel.app')
  process.exit(2)
}

async function doGet() {
  const url = new URL('/api/admin/settings', domain).toString()
  console.log('\nGET', url)
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  try {
    const res = await fetch(url, { headers })
    console.log('Status:', res.status)
    console.log('x-settings-persisted-to:', res.headers.get('x-settings-persisted-to'))
    console.log('x-settings-env-overrides:', res.headers.get('x-settings-env-overrides'))
    const txt = await res.text()
    try { console.log('Body JSON:\n', JSON.stringify(JSON.parse(txt), null, 2)) } catch { console.log('Body (raw):\n', txt) }
  } catch (err) {
    console.error('GET failed:', String(err))
  }
}

async function doPatchTest() {
  if (!token) {
    console.error('PATCH requires ADMIN_PANEL_TOKEN env var to be set')
    return
  }
  const url = new URL('/api/admin/settings', domain).toString()
  console.log('\nPATCH', url)
  // test heroImage with a harmless unique value (timestamp) so you can verify change
  const testUrl = `https://example.com/test-hero-${Date.now()}.jpg`
  const body = { heroImage: testUrl }
  try {
    const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
    console.log('Status:', res.status)
    console.log('x-settings-persisted-to:', res.headers.get('x-settings-persisted-to'))
    console.log('x-settings-env-overrides:', res.headers.get('x-settings-env-overrides'))
    const txt = await res.text()
    try { console.log('Body JSON:\n', JSON.stringify(JSON.parse(txt), null, 2)) } catch { console.log('Body (raw):\n', txt) }
    console.log('\nNow run GET again to confirm the value persisted.')
  } catch (err) {
    console.error('PATCH failed:', String(err))
  }
}

(async ()=>{
  console.log('Verify settings script')
  await doGet()
  if (doPatch) {
    await doPatchTest()
    await doGet()
  }
  console.log('\nDone')
})()

import fs from 'fs'
import path from 'path'
import HeroRender from './HeroRender'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export default async function Hero() {
  // Determine whether runtime env overrides are enabled. By default this is
  // disabled so the admin panel remains authoritative. To enable, set
  // `ENABLE_ENV_OVERRIDES=true` in your Vercel env vars.
  let heroImage = '/images/homepage.jpeg'
  try {
    const enabled = String(process.env.ENABLE_ENV_OVERRIDES || 'false').toLowerCase() === 'true'
    if (enabled && process.env.HERO_IMAGE && String(process.env.HERO_IMAGE).trim() !== '') {
      heroImage = String(process.env.HERO_IMAGE).trim()
    } else {
      try {
        const SETTINGS_PATH = path.resolve(process.cwd(), 'data', 'settings.json')
        const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
        const json = JSON.parse(raw)
        if (json && json.heroImage) heroImage = json.heroImage
      } catch {
        // filesystem read failed — attempt to read from Supabase Storage as fallback
        try {
          if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const { data, error } = await supabaseAdmin.storage.from('product-images').download('site-settings/settings.json')
            if (!error && data) {
              const txt = await data.text()
              const json = JSON.parse(txt)
              if (json && json.heroImage) heroImage = json.heroImage
            }
          }
        } catch (_) {
          // ignore
        }
      }
    }
  } catch (e) {
    // final fallback: do nothing, keep default
  }

  return <HeroRender heroImage={heroImage} />
}

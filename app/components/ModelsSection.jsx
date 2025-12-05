import Image from "next/image";
import Link from "next/link";
import { getProducts } from "../lib/getProducts";
import FeaturedCard from './cards/FeaturedCard'
import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

// Ensure this component reads runtime environment variables on the server
export const dynamic = 'force-dynamic'

export default async function ModelsSection() {
  const products = await getProducts()
  // Try to read settings to determine featured list and main images
  let settings = { featured: [], featuredMain: {} }
  try {
    // Prefer reading from DB when running in a server environment with the
    // Supabase service role key configured. This ensures the home page will
    // reflect settings persisted by the admin panel (which upserts into DB).
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data, error } = await supabaseAdmin.from('settings').select('payload').eq('id', 'site').maybeSingle()
        if (!error && data && data.payload) {
          settings = data.payload
        } else {
          // fallthrough to filesystem/storage below
        }
      } catch (e) {
        // ignore DB errors and fallthrough
      }
    }
    // If settings still empty, try reading local filesystem (development)
    if (!settings || Object.keys(settings).length === 0) {
      const settingsPath = path.join(process.cwd(), 'data', 'settings.json')
      const raw = fs.readFileSync(settingsPath, 'utf8')
      settings = JSON.parse(raw || '{}')
    }
  } catch {
    // filesystem read failed — attempt to read from Supabase Storage
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data, error } = await supabaseAdmin.storage.from('product-images').download('site-settings/settings.json')
        if (!error && data) {
          const txt = await data.text()
          settings = JSON.parse(txt || '{}')
        }
      }
    } catch (e) {
      // ignore and use defaults
    }
  }

  // Apply runtime environment overrides only when explicitly enabled via
  // ENABLE_ENV_OVERRIDES=true. This ensures admin panel edits (persisted to
  // `data/settings.json`) remain authoritative by default.
  try {
    const enabled = String(process.env.ENABLE_ENV_OVERRIDES || 'false').toLowerCase() === 'true'
    if (enabled) {
      if (process.env.FEATURED_ORDER && String(process.env.FEATURED_ORDER).trim() !== '') {
        const list = String(process.env.FEATURED_ORDER).split(',').map(s => s.trim()).filter(Boolean)
        if (list.length) settings.featured = list
      }
      if (process.env.FEATURED_MAIN_JSON && String(process.env.FEATURED_MAIN_JSON).trim() !== '') {
        try {
          const obj = JSON.parse(process.env.FEATURED_MAIN_JSON)
          if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
            settings.featuredMain = settings.featuredMain || {}
            Object.entries(obj).forEach(([k, v]) => { settings.featuredMain[String(k)] = String(v) })
          }
        } catch (e) {
          // ignore malformed JSON
        }
      }
    }
  } catch (e) {
    // ignore env read errors
  }

  // If featured is defined, build the list preserving order in settings.featured
  let displayList = products || []
  if (settings.featured && Array.isArray(settings.featured) && settings.featured.length > 0) {
    const map = new Map((products || []).map(p => [p.id || p.slug || p.title, p]))
    displayList = settings.featured.map(key => map.get(key)).filter(Boolean)
  }

  function getTeaser(m) {
    if (m.teaser) return m.teaser;
    if (!m.description) return "Guitarra única, sonido impecable.";
    const firstSentence = m.description.split(".").find((s) => s && s.trim().length > 0);
    if (firstSentence && firstSentence.trim().length <= 140) return firstSentence.trim() + ".";
    const short = m.description.slice(0, 120).trim();
    return short.replace(/\s+\S*$/, "") + "...";
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-3xl font-semibold text-[#EDEDED]">Destacados</h2>

      <div className="flex flex-col gap-12">
        {(displayList || []).map((m, idx) => (
          <FeaturedCard key={m.slug} m={m} idx={idx} total={(displayList || []).length} settings={settings} />
        ))}
      </div>
    </section>
  );
}

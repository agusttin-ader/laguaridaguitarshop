import Image from "next/image";
import Link from "next/link";
import { getProducts } from "../lib/getProducts";
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
        {(displayList || []).map((m, idx) => {
          const middleIndex = Math.floor((displayList || []).length / 2)
          let reversed = idx % 2 === 1;
          // Force invert for the middle card (computed) so text is left, image right
          if (idx === middleIndex) reversed = true;
          // Ensure Gibson LPJ 2014 has image on the right
          if (m.slug === "gibson-lpj-2014") reversed = true;
          return (
            <article
              key={m.slug}
              className={`group w-full rounded-2xl bg-[#0d0d0d] p-6 shadow-sm overflow-hidden flex flex-col items-stretch ${
                reversed ? "md:flex-row-reverse" : "md:flex-row"
              }`}
            >
              <div className="relative w-full md:w-1/2 h-64 md:h-[520px] lg:h-[640px] overflow-hidden rounded-lg" style={{position:'relative'}}>
                {(() => {
                  // Prefer the featuredMain selection if available in settings
                  const id = m.id || m.slug || m.title
                  const mainFromSettings = settings.featuredMain && settings.featuredMain[id]
                  const imgEntry = mainFromSettings || (m.images && m.images[0])
                  let src = '/images/homepage.jpeg'
                  if (imgEntry) {
                    if (typeof imgEntry === 'string' && imgEntry.trim() !== '') src = imgEntry
                    else if (typeof imgEntry === 'object' && imgEntry !== null) {
                      // prefer larger optimized variant for the hero/featured section
                      try {
                        if (imgEntry.variants && typeof imgEntry.variants === 'object') {
                          if (imgEntry.variants.w2048) { src = imgEntry.variants.w2048 }
                          else if (imgEntry.variants.w1024) { src = imgEntry.variants.w1024 }
                          else if (imgEntry.variants.w640) { src = imgEntry.variants.w640 }
                          else if (imgEntry.variants.w320) { src = imgEntry.variants.w320 }
                        }
                      } catch {}
                      if (!src || src === '/images/homepage.jpeg') {
                        if (typeof imgEntry.url === 'string' && imgEntry.url.trim() !== '') src = imgEntry.url
                        else if (typeof imgEntry.path === 'string' && imgEntry.path.trim() !== '') src = imgEntry.path
                      }
                    }
                  }

                  const isExternal = typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))

                  if (isExternal) {
                    return (
                      <Image
                        src={encodeURI(src)}
                        alt={m.title}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        quality={80}
                        className="object-cover object-center transition-transform duration-500 transform-gpu"
                        loading="eager"
                      />
                    )
                  }

                    return (
                    <Image
                      src={typeof src === 'string' && src.trim() !== '' ? encodeURI(src) : '/images/homepage.jpeg'}
                      alt={m.title}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      quality={90}
                      className="object-cover object-center transition-transform duration-500 transform-gpu"
                      loading="eager"
                    />
                    )
                })()}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              <div className="w-full md:w-1/2 flex flex-col justify-center px-0 md:px-8 py-6">
                <h3 className="text-3xl font-semibold text-[#EDEDED]">{m.title}</h3>
                <p className="mt-4 text-lg font-medium text-white/90">{getTeaser(m)}</p>

                {(() => {
                  const map = {}
                  if (m.specs && typeof m.specs === 'object') Object.entries(m.specs).forEach(([k, v]) => (map[k.toLowerCase()] = v))
                  // also accept top-level keys
                  for (const k of ['marca','modelo','anio','año']) {
                    if (k in m && m[k] != null && String(m[k]).trim() !== '') map[k] = m[k]
                  }
                  const order = ["marca", "modelo", "anio", "año"]
                  const labels = { marca: 'Marca', modelo: 'Modelo', anio: 'Año', 'año': 'Año' }
                  const visible = []
                  for (const k of order) {
                    if (k in map && map[k] != null && String(map[k]).trim() !== '') visible.push({ key: k, label: labels[k] || k, value: map[k] })
                  }
                  if (visible.length === 0) return null
                  return (
                    <div className="mt-4">
                      <ul className="list-disc list-inside text-sm text-white/75">
                        {visible.map(({ key, label, value }) => (
                          <li key={key} className="truncate">
                            <strong className="text-white">{label}:</strong> <span className="text-white/90">{String(value)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })()}

                <div className="mt-6 flex items-center gap-4">
                  <a
                    href={`https://wa.me/541168696491?text=${encodeURIComponent(
                      `Hola me interesa esta guitarra: ${m.title}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2 text-sm font-medium text-[#0D0D0D] shadow-sm transition-transform duration-150 hover:scale-105 cta-gold-hover"
                  >
                    Me interesa
                  </a>

                  <Link
                    href={`/modelos/${encodeURIComponent(m.slug)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/90 transition-colors duration-150 hover:border-[#D4AF37] hover:text-[#D4AF37] cta-gold-hover"
                  >
                    Ver guitarra
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

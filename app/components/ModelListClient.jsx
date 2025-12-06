"use client"
import { useState, useMemo, useEffect, memo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import FilterModal from './FilterModal'

function pickImage(m) {
  const imgEntry = (m.images && m.images[0]) || null
  let src = '/images/homepage.jpeg'
  if (imgEntry) {
    if (typeof imgEntry === 'string' && imgEntry.trim() !== '') src = imgEntry
    else if (typeof imgEntry === 'object' && imgEntry !== null) {
      // Prefer higher-resolution variants first to avoid pixelated previews.
      try {
        if (imgEntry.variants && typeof imgEntry.variants === 'object') {
          if (imgEntry.variants.w1024) { src = imgEntry.variants.w1024 }
          else if (imgEntry.variants.w640) { src = imgEntry.variants.w640 }
          else if (imgEntry.variants.w320) { src = imgEntry.variants.w320 }
        }
      } catch { }
      if (!src || src === '/images/homepage.jpeg') {
        if (typeof imgEntry.url === 'string' && imgEntry.url.trim() !== '') src = imgEntry.url
        else if (typeof imgEntry.path === 'string' && imgEntry.path.trim() !== '') src = imgEntry.path
      }
    }
  }
  return src
}

// React import not required for JSX in modern Next.js setups

function ModelCard({ m, isFirst }) {
  const src = pickImage(m)
  return (
    <article className="rounded-2xl overflow-hidden bg-[#0D0D0D] shadow-sm transition-shadow hover:shadow-lg">
      <Link href={`/modelos/${encodeURIComponent(m.slug)}`} className="block">
        <div className="relative aspect-[4/3] w-full" style={{position:'relative'}}>
          <Image
            src={typeof src === 'string' && src.trim() !== '' ? encodeURI(src) : '/images/homepage.jpeg'}
            alt={m.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            quality={75}
            className="object-cover"
            loading={isFirst ? 'eager' : 'lazy'}
            decoding="async"
          />
        </div>

        <div className="p-4">
          <h2 className="text-lg font-semibold text-[#EDEDED]">{m.title}</h2>
          <p className="mt-2 text-sm text-white/70 line-clamp-3">{m.description}</p>
            <div className="mt-4 flex items-center justify-between">
            <div className="text-base font-semibold text-[#EDEDED]">{(() => {
              const n = Number(String(m.price || m.priceRaw || '').replace(/[^0-9.]/g, ''))
              if (!isNaN(n)) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
              return m.price || '$0'
            })()}</div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#EDEDED] px-3 py-1 text-sm font-medium text-[#0D0D0D] transition duration-200 ease-out group-hover:scale-105 hover:bg-[#D4AF37] hover:text-[#081017] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40 cta-gold-hover">Ver detalles</span>
          </div>
        </div>
      </Link>
    </article>
  )
}

const MemoModelCard = memo(ModelCard)

export default function ModelListClient({ products = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Read filters from URL on mount and whenever search params change
  useEffect(() => {
    if (!searchParams) return
    const q = Object.fromEntries(searchParams.entries())
    const parsed = {}
    if (q.marca) parsed.marca = q.marca
    if (q.modelo) parsed.modelo = q.modelo
    if (q.year) parsed.year = q.year
    if (q.color) parsed.color = q.color
    if (q.pickups) parsed.pickups = q.pickups
    if (q.priceFrom) parsed.priceFrom = Number(q.priceFrom)
    if (q.priceTo) parsed.priceTo = Number(q.priceTo)
    // Only set if we have any keys — defer to next animation frame to avoid
    // calling setState synchronously inside the effect body (react lint rule).
    if (Object.keys(parsed).length > 0) {
      requestAnimationFrame(() => setFilters(prev => ({ ...(prev || {}), ...parsed })))
    }
  }, [searchParams])

  const cleaned = useMemo(() => products || [], [products])

  const filtered = useMemo(() => {
    if (!filters) return cleaned
    return cleaned.filter(p => {
      // marca (match against several possible fields: top-level marca, specs, title, slug)
      if (filters.marca) {
        const needle = String(filters.marca).trim().toLowerCase()
        const haystack = [
          p.marca,
          p.specs?.marca,
          p.specs?.brand,
          p.title,
          p.modelo,
          p.slug
        ].filter(Boolean).map(v => String(v).toLowerCase()).join(' ')
        if (haystack.indexOf(needle) === -1) return false
      }
      if (filters.modelo && String((p.modelo || p.specs?.modelo || p.title || '')).toLowerCase().indexOf(String(filters.modelo).toLowerCase()) === -1) return false

      const year = (p.anio || p.año || p.specs?.anio || p.specs?.year || '')
      if (filters.year && String(filters.year).trim() !== '') {
        const fy = parseInt(String(filters.year).replace(/[^0-9-]/g, ''), 10)
        if (!isNaN(fy) && Number(year) && Number(year) !== fy) return false
      }

      if (filters.color && String((p.specs?.color || p.color || '')).toLowerCase().indexOf(String(filters.color).toLowerCase()) === -1) return false
      if (filters.pickups && String((p.specs?.pickups || p.microfonos || '')).toLowerCase().indexOf(String(filters.pickups).toLowerCase()) === -1) return false

      const priceNum = Number(String(p.price || p.priceRaw || '').replace(/[^0-9.]/g, '')) || 0
      if (typeof filters.priceFrom !== 'undefined' && filters.priceFrom !== null && Number(filters.priceFrom) && priceNum < Number(filters.priceFrom)) return false
      if (typeof filters.priceTo !== 'undefined' && filters.priceTo !== null && Number(filters.priceTo) && priceNum > Number(filters.priceTo)) return false

      return true
    })
  }, [cleaned, filters])

  // Sort filtered products by numeric price descending (highest first)
  const sorted = useMemo(() => {
    const parsePrice = (p) => {
      try {
        return Number(String(p?.price || p?.priceRaw || '').replace(/[^0-9.]/g, '')) || 0
      } catch (e) { return 0 }
    }
    return (filtered || []).slice().sort((a, b) => parsePrice(b) - parsePrice(a))
  }, [filtered])

  function handleApply(f) {
    // Normalize numeric fields
    const next = { ...f }
    if (typeof next.priceFrom === 'string') next.priceFrom = Number(next.priceFrom) || 0
    if (typeof next.priceTo === 'string') next.priceTo = Number(next.priceTo) || 0
    // set state
    setFilters(next)

    // build query string
    const params = new URLSearchParams()
    if (next.marca) params.set('marca', String(next.marca))
    if (next.modelo) params.set('modelo', String(next.modelo))
    if (next.year) params.set('year', String(next.year))
    if (next.color) params.set('color', String(next.color))
    if (next.pickups) params.set('pickups', String(next.pickups))
    if (typeof next.priceFrom !== 'undefined' && next.priceFrom !== null) params.set('priceFrom', String(Math.round(Number(next.priceFrom) || 0)))
    if (typeof next.priceTo !== 'undefined' && next.priceTo !== null) params.set('priceTo', String(Math.round(Number(next.priceTo) || 0)))

    const qs = params.toString()
    const dest = qs ? `${pathname}?${qs}` : pathname
    // update URL without reload
    router.push(dest)
  }

  function clearFilters() {
    setFilters(null)
    // remove query params
    router.push(pathname)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 revamp-section">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="revamp-section-title text-2xl sm:text-3xl">Modelos</h1>

        <div className="flex items-center gap-3">
          {filters ? (
            <button onClick={clearFilters} className="text-sm text-white/80 hover:text-white">Limpiar</button>
          ) : null}

          <button
            aria-label="Filtrar modelos"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 revamp-nav-link"
            title="Filtrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01.293.707l-6.586 6.586A2 2 0 0013 14v6l-2-1v-5a2 2 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span className="text-sm text-white/90">Filtrar</span>
          </button>
        </div>
      </div>

      <div className="revamp-product-grid">
            {sorted.map((m, idx) => (
              <div key={m.slug} className="">
                <MemoModelCard key={m.slug} m={m} isFirst={idx === 0} />
              </div>
            ))}
          </div>

      <FilterModal isOpen={isOpen} onClose={() => setIsOpen(false)} onApply={handleApply} initial={filters || {}} />
    </main>
  )
}

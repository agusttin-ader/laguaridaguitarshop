"use client"
import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import ProductCard from './cards/ProductCard'
import FilterModal from './FilterModal'


// React import not required for JSX in modern Next.js setups

// Public product card now delegated to `ProductCard` for consistency and reuse

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
        const py = parseInt(String(year).replace(/[^0-9-]/g, ''), 10)
        if (!isNaN(fy)) {
          // If product year is parseable and doesn't match, filter out
          if (!isNaN(py) && py !== fy) return false
          // If product year is not parseable (missing) and user filtered by year, exclude
          if (isNaN(py)) return false
        }
      }

      if (filters.color && String((p.specs?.color || p.color || '')).toLowerCase().indexOf(String(filters.color).toLowerCase()) === -1) return false

      // pickups / micrófonos: consider multiple possible fields used across the dataset
      const pickupsHaystack = [p.specs?.pickups, p.specs?.microfonos, p.microfonos].filter(Boolean).join(' ')
      if (filters.pickups && String(pickupsHaystack).toLowerCase().indexOf(String(filters.pickups).toLowerCase()) === -1) return false

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
                <ProductCard product={m} href={`/modelos/${encodeURIComponent(m.slug)}`} isFirst={idx === 0} />
              </div>
            ))}
          </div>

      <FilterModal isOpen={isOpen} onClose={() => setIsOpen(false)} onApply={handleApply} initial={filters || {}} />
    </main>
  )
}

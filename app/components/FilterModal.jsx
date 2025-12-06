"use client"
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Small animated modal entrance to feel more premium

export default function FilterModal({ isOpen, onClose, onApply, initial = {} }) {
  // `entered` state removed; AnimatePresence handles enter/exit
  const [filters, setFilters] = useState({
    marca: '',
    modelo: '',
    year: '',
    color: '',
    pickups: '',
    ...initial,
  })

  useEffect(() => {
    if (isOpen) {
      // avoid synchronous setState in effect body — defer to next frame
      requestAnimationFrame(() => {
        const sanitized = Object.fromEntries(Object.entries(initial || {}).filter(([, v]) => v !== undefined && v !== null))
        setFilters(f => ({ ...f, ...sanitized }))
      })
    }
  }, [isOpen, initial])

    // keep input masks in sync when filters change externally

  function update(k, v) {
    setFilters(prev => ({ ...prev, [k]: v }))
  }

  function handleApply() {
     // ensure numbers
     const payload = { ...filters }
     onApply && onApply(payload)
    onClose && onClose()
  }

  function handleCancel() {
    const sanitized = Object.fromEntries(Object.entries(initial || {}).filter(([, v]) => v !== undefined && v !== null))
    setFilters(prev => ({ ...prev, ...sanitized }))
    onClose && onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={handleCancel} />

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#0b0b0b] to-[#0d0d0d] p-6 text-white shadow-2xl mx-4"
            style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
          >
            <header className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Filtrar modelos</h3>
                <p className="mt-1 text-sm text-white/60">Encuentra la guitarra perfecta por marca, modelo, año y precio</p>
              </div>
              <button aria-label="Cerrar filtros" onClick={handleCancel} className="rounded-full p-2 text-white/60 hover:bg-white/5 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              </button>
            </header>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-white/60">Marca</label>
            <input value={filters.marca ?? ''} onChange={e => update('marca', e.target.value)} className="mt-1 w-full rounded-xl bg-[#0f0f0f] border border-white/6 px-3 py-2 text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#D4AF37]/25" placeholder="Ej: Fender" />
          </div>

          <div>
            <label className="text-sm text-white/60">Modelo</label>
            <input value={filters.modelo ?? ''} onChange={e => update('modelo', e.target.value)} className="mt-1 w-full rounded-xl bg-[#0f0f0f] border border-white/6 px-3 py-2 text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#D4AF37]/25" placeholder="Ej: Stratocaster" />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm text-white/60">Año</label>
            <input value={filters.year ?? ''} onChange={e => update('year', e.target.value)} type="text" inputMode="numeric" className="mt-1 w-full rounded-xl bg-[#0f0f0f] border border-white/6 px-3 py-2 text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#D4AF37]/25" placeholder="Ej: 2014" />
          </div>

          <div>
            <label className="text-sm text-white/60">Color</label>
            <input value={filters.color ?? ''} onChange={e => update('color', e.target.value)} className="mt-1 w-full rounded-xl bg-[#0f0f0f] border border-white/6 px-3 py-2 text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#D4AF37]/25" placeholder="Ej: Sunburst" />
          </div>

          <div>
            <label className="text-sm text-white/60">Micrófonos</label>
            <input value={filters.pickups ?? ''} onChange={e => update('pickups', e.target.value)} className="mt-1 w-full rounded-xl bg-[#0f0f0f] border border-white/6 px-3 py-2 text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#D4AF37]/25" placeholder="Ej: HH, SS" />
          </div>

            {/* Precio removido del modal según petición */}
        </div>

        <footer className="mt-6 flex items-center justify-end gap-3">
          <button onClick={handleCancel} className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/3">Cancelar</button>
          <button onClick={handleApply} className="rounded-md bg-gradient-to-b from-[#E0C36A] to-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#0D0D0D] shadow-lg hover:brightness-95 transition">Aplicar</button>
        </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp } from 'react-icons/fa'
import Image from "next/image";

export default function ProductPage({ model }) {
  const [selected, setSelected] = useState(0);
  function handleSelect(i) {
    setSelected(i);
  }

  const images = Array.isArray(model.images) ? model.images : []
  function prevThumb() {
    if (images.length === 0) return
    const next = (selected - 1 + images.length) % images.length
    handleSelect(next)
  }

  function nextThumb() {
    if (images.length === 0) return
    const next = (selected + 1) % images.length
    handleSelect(next)
  }

  if (!model) return null;

  function prettyKey(k) {
    if (!k) return ''
    return k.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  function getVisibleSpecs(specs) {
    const map = {}
    // prefer model.specs object
    if (specs && typeof specs === 'object') {
      Object.entries(specs).forEach(([k, v]) => (map[k.toLowerCase()] = v))
    }
    // also allow top-level keys on model (marca, modelo, anio, año)
    if (model && typeof model === 'object') {
      for (const k of ['marca', 'modelo', 'anio', 'año']) {
        if (k in model && model[k] != null && String(model[k]).trim() !== '') map[k] = model[k]
      }
    }
    const order = ["marca", "modelo", "anio", "año"]
    const labels = { marca: 'Marca', modelo: 'Modelo', anio: 'Año', 'año': 'Año' }
    const out = []
    for (const k of order) {
      if (k in map && map[k] != null && String(map[k]).trim() !== '') {
        out.push({ key: k, label: labels[k] || prettyKey(k), value: map[k] })
      }
    }
    return out
  }

  const phone = "541168696491"; // +54 11 68696491 formatted for wa.me
  const whatsappHref = `https://wa.me/${phone}?text=${encodeURIComponent(
    `Hola me interesa esta guitarra: ${model.title}`
  )}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left: gallery */}
        <div className="flex flex-col h-full">
          <div className="relative w-full flex-1 min-h-[420px] md:min-h-[560px] lg:min-h-[720px] overflow-hidden rounded-lg shadow-lg bg-black/5">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="absolute inset-0"
              >
                {(() => {
                  const imgEntry = images[selected]
                  // prefer variants for the main gallery image (large)
                  function pickBest(entry) {
                    if (!entry) return null
                    try {
                      if (typeof entry === 'string') return entry
                      if (typeof entry === 'object') {
                        if (entry.variants && typeof entry.variants === 'object') {
                          if (entry.variants.w1024) return String(entry.variants.w1024)
                          if (entry.variants.w640) return String(entry.variants.w640)
                          if (entry.variants.w320) return String(entry.variants.w320)
                        }
                        if (entry.url && typeof entry.url === 'string') return entry.url
                        if (entry.path && typeof entry.path === 'string') return entry.path
                      }
                    } catch (err) {}
                    return null
                  }

                  const src = pickBest(imgEntry) || '/images/homepage.jpeg'
                  const isExternal = typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))

                  if (isExternal) {
                    // external images rendered as plain <img> — allow intentionally
                    return (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`${model.title} imagen principal`}
                          className="absolute inset-0 h-full w-full object-contain bg-black"
                          loading="eager"
                        />
                      </>
                    )
                  }

                  return (
                    <Image
                      src={typeof src === 'string' && src.trim() !== '' ? encodeURI(src) : '/images/homepage.jpeg'}
                      alt={`${model.title} imagen principal`}
                      fill
                      sizes="(min-width: 1024px) 50vw, (min-width: 768px) 50vw, 100vw"
                      className="object-contain object-center bg-black"
                    />
                  )
                })()}
              </motion.div>
            </AnimatePresence>

            {/* Prev/Next buttons over main image for mobile */}
            <button
              onClick={prevThumb}
              aria-label="Anterior imagen"
              className="absolute left-4 top-1/2 z-20 h-12 w-12 md:h-14 md:w-14 -translate-y-1/2 flex items-center justify-center rounded-full bg-[#D4AF37] text-[#0D0D0D] transition-transform duration-200 opacity-95 hover:opacity-100 shadow-md hover:shadow-lg ring-2 ring-transparent hover:ring-[#D4AF37]/40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 md:h-7 md:w-7">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={nextThumb}
              aria-label="Siguiente imagen"
              className="absolute right-4 top-1/2 z-20 h-12 w-12 md:h-14 md:w-14 -translate-y-1/2 flex items-center justify-center rounded-full bg-[#D4AF37] text-[#0D0D0D] transition-transform duration-200 opacity-95 hover:opacity-100 shadow-md hover:shadow-lg ring-2 ring-transparent hover:ring-[#D4AF37]/40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 md:h-7 md:w-7">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Thumbnails removed per request (desktop and mobile) */}
        </div>

        {/* Right: details */}
        <div className="flex flex-col justify-start">
          <h1 className="text-3xl md:text-4xl font-semibold text-[#EDEDED]">{model.title}</h1>

          <p className="mt-4 text-base text-white/75">{model.description}</p>

          <div className="mt-6 flex items-center gap-4">
            <span className="text-2xl font-semibold text-[#EDEDED]">{model.price}</span>
          </div>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-max items-center justify-center gap-3 rounded-full bg-[#EDEDED] px-6 py-3 text-sm font-medium text-[#0D0D0D] shadow-md transition-transform duration-200 ease-out hover:-translate-y-1 hover:bg-[#D4AF37] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
          >
            <FaWhatsapp className="h-4 w-4 text-[#0D0D0D]" aria-hidden />
            Me interesa
          </a>
        </div>
      </div>
    </div>
  );
}

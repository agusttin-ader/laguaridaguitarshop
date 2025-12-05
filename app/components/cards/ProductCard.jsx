"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function ProductCard({ m, isFirst }) {
  function pickImage(imgEntry) {
    let src = '/images/homepage.jpeg'
    if (!imgEntry) return src
    try {
      if (typeof imgEntry === 'string') return imgEntry
      if (imgEntry.variants && typeof imgEntry.variants === 'object') {
        return imgEntry.variants.w1024 || imgEntry.variants.w640 || imgEntry.variants.w320 || src
      }
      if (imgEntry.url) return imgEntry.url
      if (imgEntry.path) return imgEntry.path
    } catch (e) {}
    return src
  }

  const src = pickImage((m.images && m.images[0]) || null)
  const phone = '541168696491'
  const whatsappHref = `https://wa.me/${phone}?text=${encodeURIComponent(`Hola me interesa esta guitarra: ${m.title}`)}`

  return (
    <article className="revamp-card">
      <Link href={`/modelos/${encodeURIComponent(m.slug)}`} className="block">
        <div className="relative aspect-[4/3] w-full" style={{position:'relative'}}>
          <Image src={typeof src === 'string' && src.trim() !== '' ? encodeURI(src) : '/images/homepage.jpeg'} alt={m.title} fill sizes="(min-width: 1024px) 33vw, 100vw" quality={75} className="object-cover" loading={isFirst ? 'eager' : 'lazy'} decoding="async"/>
        </div>

        <div className="p-4">
          <h2 className="text-lg font-semibold text-[#EDEDED]">{m.title}</h2>
          <p className="mt-2 text-sm text-white/70 line-clamp-3">{m.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <div className="revamp-price">{m.price || '$0'}</div>
            <button
              type="button"
              className="revamp-cta"
              aria-label={`Consultar ${m.title} via WhatsApp`}
              onClick={() => window.open(whatsappHref, '_blank', 'noopener,noreferrer')}
            >
              Consultar
            </button>
          </div>
          {/* debug: show short image identifier to help verify unique images per card */}
          <div className="mt-2">
            <small className="debug-src">{(src && String(src).split('/').slice(-1)[0]) || ''}</small>
          </div>
        </div>
      </Link>
    </article>
  )
}

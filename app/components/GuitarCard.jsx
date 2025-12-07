"use client";

import React from 'react'
import Image from "next/image";
import Link from "next/link";
import Button from './common/Button'

function GuitarCard({ title, description, price, image }) {
  function normalizeImageEntry(img) {
    if (!img) return '/images/homepage.jpeg'
    try {
      if (typeof img === 'string') return img
      if (img.variants && typeof img.variants === 'object') {
        if (img.variants.w320) return String(img.variants.w320)
        if (img.variants.w640) return String(img.variants.w640)
        if (img.variants.w1024) return String(img.variants.w1024)
      }
      if (img.url) return String(img.url)
      if (img.path) return String(img.path)
    } catch { }
    return '/images/homepage.jpeg'
  }
  const phone = "541168696491"; // +54 11 68696491
  const whatsappHref = `https://wa.me/${phone}?text=${encodeURIComponent(
    `Hola me interesa esta guitarra: ${title}`
  )}`;
  return (
    <article className="group bg-[var(--revamp-bg)] border border-white/6 rounded-xl overflow-hidden shadow-sm hover:shadow-md transform-gpu hover:-translate-y-1 transition duration-180 ease-[cubic-bezier(.2,.9,.3,1)]">
      {/* Image area */}
      <div className="relative w-full aspect-[4/3] bg-[rgba(255,255,255,0.02)] overflow-hidden">
        {image ? (
          <Image
            src={encodeURI(normalizeImageEntry(image))}
            alt={title || "Guitarra"}
            fill
            sizes="(min-width:768px) 33vw, 100vw"
            quality={80}
            className="object-cover"
            style={{ objectPosition: 'center' }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs tracking-wide text-white/40">
            SIN IMAGEN
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-[var(--revamp-foreground)] leading-tight line-clamp-1">{title}</h3>
          <div className="mt-1">
            <span className="text-sm text-white/60 line-clamp-2">{description}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 whitespace-nowrap">
            <span className="text-lg md:text-xl font-extrabold text-[var(--revamp-foreground)] whitespace-nowrap">{price}</span>
            <span className="text-sm text-white/60 whitespace-nowrap">USD</span>
          </div>

          <Button href={whatsappHref} className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-[#081017] bg-[var(--revamp-gold)] cta-gold-hover">Ver detalles</Button>
        </div>
      </div>
    </article>
  );
}
GuitarCard.displayName = 'GuitarCard'
export default React.memo(GuitarCard)

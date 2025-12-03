"use client";

import React from 'react'
import Image from "next/image";
import Link from "next/link";

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
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111111] transition-colors">
      <div className="relative aspect-[4/3] w-full bg-black/30" style={{position:'relative'}}>
        {image ? (
          <Image
            src={encodeURI(normalizeImageEntry(image))}
            alt={title || "Guitarra"}
            fill
            sizes="(min-width:768px) 33vw, 100vw"
            quality={80}
            className="object-cover"
            priority={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs tracking-wide text-white/40">
            SIN IMAGEN
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0)_60%)]" />
      </div>
      <div className="flex flex-1 flex-col gap-3 px-5 py-5">
        <h3 className="text-lg font-medium tracking-tight text-[#EDEDED] line-clamp-1">{title}</h3>
        <p className="text-sm leading-relaxed text-white/60 line-clamp-3">{description}</p>
        <div className="mt-auto flex items-center justify-between gap-4 pt-2">
          <span className="text-base font-semibold text-[#EDEDED]">{price}</span>
          <Link
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full md:w-auto rounded-lg md:rounded-full border border-white/20 px-4 py-2 text-sm md:text-xs font-medium text-[#EDEDED] backdrop-blur-sm transition-transform transition-colors duration-200 ease-out hover:scale-[1.02] hover:bg-[#D4AF37] hover:shadow-lg hover:shadow-[#D4AF37]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
            aria-label={`Consultar sobre ${title}`}
          >
            Consultar
          </Link>
        </div>
      </div>
    </div>
  );
}
GuitarCard.displayName = 'GuitarCard'
export default React.memo(GuitarCard)

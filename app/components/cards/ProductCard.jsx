"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Card from '../common/Card'
import { getSrcFromEntry, ensureEncoded } from '../../../lib/imageHelpers'

export default function ProductCard({ product, href = null, isFirst = false }){
  const router = useRouter()
  const title = product?.title || 'Sin título'
  const price = product?.price || ''
  const rawImg = (product?.images && product.images[0]) ? product.images[0] : null
  const src = ensureEncoded(getSrcFromEntry(rawImg))
  const whatsappHref = `https://wa.me/541168696491?text=${encodeURIComponent(`Hola me interesa esta guitarra: ${title}`)}`
  const sourceDescription = product?.description || product?.short || ''
  const shortSnippet = sourceDescription ? (sourceDescription.length > 120 ? sourceDescription.slice(0,117).trim() + '...' : sourceDescription) : null
  const inner = (
    <>
      <div className="relative w-full aspect-[4/3] bg-[rgba(255,255,255,0.02)] overflow-hidden">
        {src ? (
          <Image src={src} alt={title} fill className="object-cover" sizes="(min-width:768px) 33vw, 100vw" quality={80} loading={isFirst ? 'eager' : 'lazy'} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs tracking-wide text-white/40">SIN IMAGEN</div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-[var(--revamp-foreground)] leading-tight line-clamp-1">{title}</h3>
          {shortSnippet && <p className="text-sm text-white/60 mt-1 line-clamp-2">{shortSnippet}</p>}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <span className="text-lg md:text-xl font-extrabold text-[var(--revamp-foreground)]">{price}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (href) {
                  e.preventDefault()
                  router.push(href)
                } else {
                  window.open(whatsappHref, '_blank', 'noopener')
                }
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#EDEDED] px-3 py-1 text-sm font-medium text-[#0D0D0D] transition duration-200 ease-out group-hover:scale-105 hover:bg-[#D4AF37] hover:text-[#081017] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40 cta-gold-hover"
            >
              Consultar
            </button>
          </div>
      </div>
    </>
  )

  return (
    <Card className="group">
      {href ? (
        <Link href={href} className="block no-underline text-inherit">{inner}</Link>
      ) : inner}
    </Card>
  )
}

"use client"

import Image from 'next/image'
import Button from '../common/Button'
import Card from '../common/Card'
import { getSrcFromEntry, ensureEncoded } from '../../../lib/imageHelpers'

export default function ProductCard({ product }){
  const title = product?.title || 'Sin título'
  const price = product?.price || ''
  const rawImg = (product?.images && product.images[0]) ? product.images[0] : null
  const src = ensureEncoded(getSrcFromEntry(rawImg))
  const whatsappHref = `https://wa.me/541168696491?text=${encodeURIComponent(`Hola me interesa esta guitarra: ${title}`)}`

  return (
    <Card className="group">
      <div className="relative w-full aspect-[4/3] bg-[rgba(255,255,255,0.02)] overflow-hidden">
        {src ? (
          <Image src={src} alt={title} fill className="object-cover" sizes="(min-width:768px) 33vw, 100vw" quality={80} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs tracking-wide text-white/40">SIN IMAGEN</div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-[var(--revamp-foreground)] leading-tight line-clamp-1">{title}</h3>
          {product?.short && <p className="text-sm text-white/60 mt-1 line-clamp-2">{product.short}</p>}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className="text-lg md:text-xl font-extrabold text-[var(--revamp-foreground)]">{price}</span>
          </div>
          <Button href={whatsappHref} className="text-[#081017] bg-[var(--revamp-gold)]">Consultar</Button>
        </div>
      </div>
    </Card>
  )
}

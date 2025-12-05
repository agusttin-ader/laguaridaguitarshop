import Image from 'next/image'
import Link from 'next/link'

// Server component: featured card for ModelsSection
export default function FeaturedCard({ m, idx, total, settings }) {
  const middleIndex = Math.floor((total || 0) / 2)
  let reversed = idx % 2 === 1
  if (idx === middleIndex) reversed = true
  if (m.slug === 'gibson-lpj-2014') reversed = true

  function getTeaser(mm) {
    if (mm.teaser) return mm.teaser
    if (!mm.description) return 'Guitarra única, sonido impecable.'
    const firstSentence = mm.description.split('.').find(s => s && s.trim().length > 0)
    if (firstSentence && firstSentence.trim().length <= 140) return firstSentence.trim() + '.'
    const short = mm.description.slice(0, 120).trim()
    return short.replace(/\s+\S*$/, '') + '...'
  }

  // pick image (prefer featuredMain override)
  const id = m.id || m.slug || m.title
  const mainFromSettings = settings?.featuredMain && settings.featuredMain[id]
  const imgEntry = mainFromSettings || (m.images && m.images[0])
  let src = '/images/homepage.jpeg'
  if (imgEntry) {
    try {
      if (typeof imgEntry === 'string' && imgEntry.trim() !== '') src = imgEntry
      else if (typeof imgEntry === 'object' && imgEntry !== null) {
        if (imgEntry.variants && typeof imgEntry.variants === 'object') {
          src = imgEntry.variants.w2048 || imgEntry.variants.w1024 || imgEntry.variants.w640 || imgEntry.variants.w320 || src
        }
        if ((!src || src === '/images/homepage.jpeg') && typeof imgEntry.url === 'string') src = imgEntry.url
      }
    } catch (e) {}
  }

  const isExternal = typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))

  return (
    <article className={`group w-full revamp-featured ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} md:flex`}>
      <div className="relative w-full md:w-1/2 h-64 md:h-[520px] lg:h-[640px] overflow-hidden rounded-lg" style={{position:'relative'}}>
        {isExternal ? (
          <Image src={encodeURI(src)} alt={m.title} fill sizes="(min-width: 1024px) 50vw, 100vw" quality={85} className="object-cover object-center transition-transform duration-500" loading="eager"/>
        ) : (
          <Image src={typeof src === 'string' && src.trim() !== '' ? encodeURI(src) : '/images/homepage.jpeg'} alt={m.title} fill sizes="(min-width: 1024px) 50vw, 100vw" quality={90} className="object-cover object-center transition-transform duration-500" loading="eager"/>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="w-full md:w-1/2 flex flex-col justify-center px-0 md:px-8 py-6">
        <h3 className="text-3xl font-semibold text-[#EDEDED]">{m.title}</h3>
        <p className="mt-4 text-lg font-medium text-white/90">{getTeaser(m)}</p>

        <div className="mt-4">
          {/* key specs list kept minimal */}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <a href={`https://wa.me/541168696491?text=${encodeURIComponent(`Hola me interesa esta guitarra: ${m.title}`)}`} target="_blank" rel="noopener noreferrer" className="revamp-cta inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-[#0D0D0D]">Me interesa</a>
          <Link href={`/modelos/${encodeURIComponent(m.slug)}`} className="revamp-cta inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/90">Ver guitarra</Link>
        </div>
      </div>
    </article>
  )
}

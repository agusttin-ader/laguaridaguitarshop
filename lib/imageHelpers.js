export function getSrcFromEntry(entry, prefer = ['w1024','w640','w320']){
  if (!entry) return '/images/homepage.jpeg'
  try{
    if (typeof entry === 'string') return entry
    if (typeof entry === 'object'){
      if (entry.variants && typeof entry.variants === 'object'){
        for (const k of prefer){ if (entry.variants[k]) return String(entry.variants[k]) }
      }
      if (entry.url && typeof entry.url === 'string') return entry.url
      if (entry.publicUrl && typeof entry.publicUrl === 'string') return entry.publicUrl
      if (entry.path && typeof entry.path === 'string') return entry.path
    }
  }catch(e){}
  return '/images/homepage.jpeg'
}

export function getSrcSet(entry){
  if (!entry || typeof entry !== 'object' || !entry.variants) return null
  const parts = []
  if (entry.variants.w320) parts.push(`${entry.variants.w320} 320w`)
  if (entry.variants.w640) parts.push(`${entry.variants.w640} 640w`)
  if (entry.variants.w1024) parts.push(`${entry.variants.w1024} 1024w`)
  if (entry.variants.w2048) parts.push(`${entry.variants.w2048} 2048w`)
  return parts.length ? parts.join(', ') : null
}

export function ensureEncoded(src){
  try{ if (typeof src === 'string') return encodeURI(src) }catch(e){}
  return src
}

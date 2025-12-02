"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp } from 'react-icons/fa'
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import Image from "next/image";

export default function ProductPage({ model }) {
  const [selected, setSelected] = useState(0);
  function handleSelect(i) {
    setSelected(i);
  }

  const images = useMemo(() => (Array.isArray(model?.images) ? model.images : []), [model])
  // helper to pick best src from an image entry
  function pickBestSrc(entry) {
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
    } catch {}
    return null
  }
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [isPointerFine, setIsPointerFine] = useState(() => {
    try {
      if (typeof window === 'undefined') return true
      return !!(window.matchMedia && window.matchMedia('(pointer:fine)').matches)
    } catch (e) {
      return true
    }
  })
  const imgWrapRef = useRef(null)
  const innerImgRef = useRef(null)
  const zoomOverlayRef = useRef(null)
  const domRafRef = useRef(null)
  const zoomStateRef = useRef({ x: 0.5, y: 0.5, active: false, scale: 2 })
  const pinchRef = useRef({ active: false, startDist: 0, startScale: 1 })
  const prevThumb = useCallback(() => {
    if (images.length === 0) return
    const next = (selected - 1 + images.length) % images.length
    setSelected(next)
  }, [images.length, selected])

  const nextThumb = useCallback(() => {
    if (images.length === 0) return
    const next = (selected + 1) % images.length
    setSelected(next)
  }, [images.length, selected])

  function openLightbox(i = selected){
    handleSelect(i)
    setLightboxOpen(true)
  }

  function closeLightbox(){
    setLightboxOpen(false)
  }

  useEffect(()=>{
    if (!lightboxOpen) return
    function onKey(e){
      if (e.key === 'Escape') return closeLightbox()
      if (e.key === 'ArrowLeft') return prevThumb()
      if (e.key === 'ArrowRight') return nextThumb()
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, selected, prevThumb, nextThumb])

  // cleanup rAF
  useEffect(()=>{
    return ()=>{
      if (domRafRef.current) cancelAnimationFrame(domRafRef.current)
    }
  }, [])

  // Lock body scroll while the lightbox is open to avoid background scroll on mobile
  useEffect(() => {
    if (typeof document === 'undefined') return
    const prev = document.body.style.overflow
    if (lightboxOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = prev || ''
    return () => { document.body.style.overflow = prev || '' }
  }, [lightboxOpen])

  const handleZoomMove = useCallback((ev, rect, requestedScale)=>{
    if (!innerImgRef.current) return
    const clientX = ev.clientX ?? (ev.touches && ev.touches[0]?.clientX)
    const clientY = ev.clientY ?? (ev.touches && ev.touches[0]?.clientY)
    if (clientX == null || clientY == null) return
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
    zoomStateRef.current.x = x
    zoomStateRef.current.y = y

    // compute max allowed scale based on natural image size to avoid pixelation
    let allowedScale = requestedScale
    try {
      const img = innerImgRef.current
      const naturalW = img.naturalWidth || 0
      const naturalH = img.naturalHeight || 0
      const dispW = rect.width
      const dispH = rect.height
      if (naturalW > 0 && dispW > 0) {
        const maxScaleW = naturalW / dispW
        const maxScaleH = naturalH > 0 ? (naturalH / dispH) : maxScaleW
        const maxScale = Math.max(1, Math.min(maxScaleW, maxScaleH))
        allowedScale = Math.min(requestedScale, maxScale)
      }
    } catch (e) {
      allowedScale = requestedScale
    }

    zoomStateRef.current.scale = allowedScale
    if (domRafRef.current) cancelAnimationFrame(domRafRef.current)
    domRafRef.current = requestAnimationFrame(()=>{
      try {
        const s = zoomStateRef.current.scale
        const ox = zoomStateRef.current.x
        const oy = zoomStateRef.current.y
        // update overlay background (if present) instead of transforming the <img>
        const overlay = zoomOverlayRef.current
        if (overlay) {
          // background-size in percent (s * 100%)
          overlay.style.backgroundSize = `${s * 100}% ${s * 100}%`
          // center the background so that the point (ox,oy) appears under cursor
          // background-position uses percent where 0% is left/top; compute position so that
          // the focal point maps correctly: use (ox*100)% (but account for scaling)
          const posX = Math.min(100, Math.max(0, ox * 100))
          const posY = Math.min(100, Math.max(0, oy * 100))
          overlay.style.backgroundPosition = `${posX}% ${posY}%`
        }
      } catch (e) {}
      domRafRef.current = null
    })
  }, [])

  const handleZoomEnter = useCallback((ev, rect, requestedScale=2) => {
    zoomStateRef.current.active = true
    // determine allowed scale based on natural size to avoid pixelation
    try {
      const img = innerImgRef.current
      if (img) {
        const naturalW = img.naturalWidth || 0
        const naturalH = img.naturalHeight || 0
        const dispW = rect.width
        const dispH = rect.height
        if (naturalW > 0 && dispW > 0) {
          const maxScaleW = naturalW / dispW
          const maxScaleH = naturalH > 0 ? (naturalH / dispH) : maxScaleW
          const maxScale = Math.max(1, Math.min(maxScaleW, maxScaleH))
          zoomStateRef.current.scale = Math.min(requestedScale, maxScale)
        } else {
          zoomStateRef.current.scale = requestedScale
        }
      }
    } catch (e) {
      zoomStateRef.current.scale = requestedScale
    }

    // compute high-res src for overlay from current selected image
    let magSrc = null
    try {
      const entry = images[selected]
      if (entry && entry.variants && typeof entry.variants === 'object') {
        magSrc = entry.variants.w2048 || entry.variants.w1024 || pickBestSrc(entry)
      } else {
        magSrc = pickBestSrc(entry)
      }
    } catch (e) {
      magSrc = pickBestSrc(images[selected])
    }

    if (innerImgRef.current) {
      // ensure overlay shows high-res background
      const overlay = zoomOverlayRef.current
      if (overlay) {
        overlay.style.backgroundImage = magSrc ? `url(${magSrc})` : ''
        overlay.style.opacity = '1'
        overlay.style.backgroundRepeat = 'no-repeat'
        overlay.style.backgroundPosition = '50% 50%'
        overlay.style.backgroundSize = `${zoomStateRef.current.scale * 100}% ${zoomStateRef.current.scale * 100}%`
      }
    }
    handleZoomMove(ev, rect, zoomStateRef.current.scale)
  }, [handleZoomMove, selected, images])

  // If the user navigates images (prev/next) while the zoom overlay is active,
  // update the overlay background to match the newly selected image so the
  // hover-zoom always targets the current image.
  useEffect(() => {
    if (!lightboxOpen) return
    if (!zoomStateRef.current.active) return
    const overlay = zoomOverlayRef.current
    if (!overlay) return
    // compute magSrc from current selected image
    let magSrc = null
    try {
      const entry = images[selected]
      if (entry && entry.variants && typeof entry.variants === 'object') {
        magSrc = entry.variants.w2048 || entry.variants.w1024 || pickBestSrc(entry)
      } else {
        magSrc = pickBestSrc(entry)
      }
    } catch (e) {
      magSrc = pickBestSrc(images[selected])
    }

    try {
      overlay.style.backgroundImage = magSrc ? `url(${magSrc})` : ''
      overlay.style.backgroundRepeat = 'no-repeat'
      overlay.style.backgroundSize = `${zoomStateRef.current.scale * 100}% ${zoomStateRef.current.scale * 100}%`
      const posX = Math.min(100, Math.max(0, zoomStateRef.current.x * 100))
      const posY = Math.min(100, Math.max(0, zoomStateRef.current.y * 100))
      overlay.style.backgroundPosition = `${posX}% ${posY}%`
    } catch (e) {}
  }, [selected, lightboxOpen, images])

  const handleZoomLeave = useCallback(()=>{
    zoomStateRef.current.active = false
    if (domRafRef.current) cancelAnimationFrame(domRafRef.current)
    domRafRef.current = null
    if (innerImgRef.current) {
      // hide overlay smoothly
      const overlay = zoomOverlayRef.current
      if (overlay) {
        overlay.style.opacity = '0'
        // optional: clear background after fade
        setTimeout(()=>{ try{ overlay.style.backgroundImage = ''; }catch(e){} }, 260)
      }
    }
    // minimap removed: no viewport cleanup
  }, [])

  // Preload adjacent images when the lightbox is open for smoother navigation
  useEffect(()=>{
    if (!lightboxOpen || images.length === 0) return
    const nextIdx = (selected + 1) % images.length
    const prevIdx = (selected - 1 + images.length) % images.length
    const nextEntry = images[nextIdx]
    const prevEntry = images[prevIdx]
    try {
      const nsrc = pickBestSrc(nextEntry)
      const psrc = pickBestSrc(prevEntry)
      if (nsrc) new window.Image().src = nsrc
      if (psrc) new window.Image().src = psrc
    } catch (e) {}
  }, [lightboxOpen, selected, images])

  // Preload high-res variant of the current image to avoid flicker when zooming
  useEffect(()=>{
    if (!lightboxOpen || images.length === 0) return
    try {
      const entry = images[selected]
      const high = (entry && entry.variants && typeof entry.variants === 'object') ? (entry.variants.w2048 || entry.variants.w1024) : null
      const src = high || pickBestSrc(entry)
      if (src) {
        const img = new window.Image()
        img.src = src
      }
    } catch (e) {}
  }, [lightboxOpen, selected, images])

  

  // pointer detection is done during initial state setup to avoid
  // calling setState synchronously inside an effect (which triggers eslint
  // react-hooks/set-state-in-effect).

  if (!model) return null;

  


  const phone = "541168696491"; // +54 11 68696491 formatted for wa.me
  const whatsappHref = `https://wa.me/${phone}?text=${encodeURIComponent(
    `Hola me interesa esta guitarra: ${model.title}`
  )}`;

  const currentSrc = pickBestSrc(images[selected]) || '/images/homepage.jpeg'

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left: gallery */}
        <div className="flex flex-col h-full">
          <div className="relative w-full flex-1 product-main-image min-h-[420px] md:min-h-[560px] lg:min-h-[720px] overflow-hidden rounded-lg shadow-lg bg-black/5">
            <AnimatePresence mode="wait">
              <motion.div
                  key={selected}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.36, ease: "easeOut" }}
                  className="absolute inset-0 will-change-transform will-change-opacity"
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
                    } catch {}
                    return null
                  }

                  const src = pickBest(imgEntry) || '/images/homepage.jpeg'
                  const isExternal = typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))

                  if (isExternal) {
                    // external images rendered as plain <img>
                    // Use object-cover so the main gallery image fills the area consistently
                    return (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt={`${model.title} imagen principal`}
                              className="absolute inset-0 h-full w-full object-contain object-center bg-black cursor-zoom-in"
                              loading="eager"
                              onClick={()=>openLightbox(selected)}
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
                        className="object-contain object-center bg-black cursor-zoom-in"
                        onClick={()=>openLightbox(selected)}
                    />
                  )
                })()}
              </motion.div>
            </AnimatePresence>

            {/* Prev/Next buttons over main image for mobile */}
            <button
              onClick={prevThumb}
              aria-label="Anterior imagen"
              className="btn-nav btn-gold-hover btn-keep-white absolute left-3 top-1/2 z-40 h-14 w-14 md:h-16 md:w-16 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-7 w-7 md:h-8 md:w-8" aria-hidden>
                <path className="nav-path" d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={nextThumb}
              aria-label="Siguiente imagen"
              className="btn-nav btn-gold-hover btn-keep-white absolute right-3 top-1/2 z-40 h-14 w-14 md:h-16 md:w-16 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-7 w-7 md:h-8 md:w-8" aria-hidden>
                <path className="nav-path" d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Lightbox / fullscreen viewer */}
          <AnimatePresence>
            {lightboxOpen && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.18 } }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                role="dialog"
                aria-modal="true"
                onClick={(e)=>{ if (e.target === e.currentTarget) closeLightbox() }}
              >
                <div className="absolute inset-0 bg-black/85" />

                <motion.div className="relative z-50 max-w-[95vw] max-h-[95vh] overflow-hidden will-change-transform will-change-opacity" initial={{ scale: 0.98 }} animate={{ scale: 1, transition: { duration: 0.22, ease: 'easeOut' } }} exit={{ scale: 0.98, transition: { duration: 0.16 } }}>
                  {/* Close button (larger, visible) */}
                  <button aria-label="Cerrar" onClick={closeLightbox} className="btn-red-hover absolute right-3 top-3 z-60 rounded-full bg-black/40 p-3 text-white hover:bg-black/60 text-2xl md:text-3xl transition-transform duration-150 hover:scale-105 hover:shadow-lg">
                    <FiX />
                  </button>

                  {/* Prev / Next inside lightbox (larger icons) */}
                  <button onClick={(e)=>{ e.stopPropagation(); prevThumb() }} aria-label="Anterior" className="btn-gold-hover btn-keep-white absolute left-3 top-1/2 z-60 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white hover:bg-black/60 text-2xl md:text-3xl transition-transform duration-150 hover:scale-105 hover:shadow-lg"><FiChevronLeft /></button>
                  <button onClick={(e)=>{ e.stopPropagation(); nextThumb() }} aria-label="Siguiente" className="btn-gold-hover btn-keep-white absolute right-3 top-1/2 z-60 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white hover:bg-black/60 text-2xl md:text-3xl transition-transform duration-150 hover:scale-105 hover:shadow-lg"><FiChevronRight /></button>

                  {/* minimap removed per request */}

                  {/* Draggable/swipable image container */}
                  <motion.div ref={imgWrapRef} className="flex items-center justify-center w-[95vw] h-[95vh] touch-pan-y" onClick={(e)=>e.stopPropagation()}>
                    <motion.div
                      drag="x"
                      dragElastic={0.14}
                      dragConstraints={{ left: -1000, right: 1000 }}
                      onDrag={(e, info)=> setDragX(info.offset.x)}
                      onDragEnd={(e, info)=>{
                        const vx = info.velocity.x || 0
                        const ox = info.offset.x || 0
                        const threshold = 280
                        // use velocity + offset thresholds for intuitive swipe
                        if (vx > 500 || ox > threshold){ prevThumb() }
                        else if (vx < -500 || ox < -threshold){ nextThumb() }
                        // reset drag position via animation
                        setDragX(0)
                      }}
                      animate={{ x: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                      className="max-w-[95vw] max-h-[95vh] flex items-center justify-center will-change-transform will-change-opacity"
                    >
                      {(() => {
                        const imgEntry = images[selected]
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
                          } catch {}
                          return null
                        }

                        const src = pickBest(imgEntry) || '/images/homepage.jpeg'
                        const isExternal = typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))

                        // prefer a higher-res source for zooming when available
                        const magSrc = (() => {
                          try {
                            if (imgEntry && imgEntry.variants && typeof imgEntry.variants === 'object') {
                              if (imgEntry.variants.w2048) return String(imgEntry.variants.w2048)
                              if (imgEntry.variants.w1024) return String(imgEntry.variants.w1024)
                            }
                          } catch {}
                          return src
                        })()

                        // Render the interactive zoomable image (uses CSS transform for performance)
                        return (
                          <div className="relative w-full h-full flex items-center justify-center">
                            {/* image container: keeps fixed size and hides overflow so scale doesn't affect layout */}
                            <div className="overflow-hidden max-w-[95vw] max-h-[95vh]" style={{display:'inline-block'}}>
                              {/* zoom overlay (absolute on top of image) */}
                              <div ref={zoomOverlayRef} aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0, transition: 'opacity 160ms ease-out', pointerEvents: 'none', backgroundRepeat: 'no-repeat', backgroundPosition: '50% 50%', backgroundSize: '200% 200%' }} />
                              {/* main image (uses plain <img> so we can control transform directly) */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                ref={innerImgRef}
                                src={typeof magSrc === 'string' && magSrc.trim() !== '' ? encodeURI(magSrc) : '/images/homepage.jpeg'}
                                alt={`${model.title} imagen`}
                                className="w-auto h-auto max-w-[95vw] max-h-[95vh] object-contain select-none cursor-zoom-in block"
                                draggable={false}
                                loading="eager"
                                style={{ transformOrigin: '50% 50%' }}
                                onMouseMove={(e)=>{
                                  if (!isPointerFine) return
                                  const rect = innerImgRef.current?.getBoundingClientRect()
                                  if (!rect) return
                                  handleZoomMove(e, rect, 2.2)
                                }}
                                onMouseEnter={(e)=>{
                                  if (!isPointerFine) return
                                  const rect = innerImgRef.current?.getBoundingClientRect()
                                  if (!rect) return
                                  // compute initial state and enter
                                  handleZoomEnter(e, rect, 2.2)
                                  // minimap removed: skip initial view rect setup
                                }}
                                onMouseLeave={()=>{
                                  if (!isPointerFine) return
                                  handleZoomLeave()
                                }}
                                onTouchStart={(e)=>{
                                  if (!e.touches || e.touches.length < 2) return
                                  // begin pinch
                                  const t1 = e.touches[0]
                                  const t2 = e.touches[1]
                                  const dx = t2.clientX - t1.clientX
                                  const dy = t2.clientY - t1.clientY
                                  pinchRef.current.active = true
                                  pinchRef.current.startDist = Math.hypot(dx, dy)
                                  pinchRef.current.startScale = zoomStateRef.current.scale || 1
                                }}
                                onTouchMove={(e)=>{
                                  if (!pinchRef.current.active) return
                                  if (!e.touches || e.touches.length < 2) return
                                  const t1 = e.touches[0]
                                  const t2 = e.touches[1]
                                  const dx = t2.clientX - t1.clientX
                                  const dy = t2.clientY - t1.clientY
                                  const dist = Math.hypot(dx, dy)
                                  const ratio = pinchRef.current.startDist > 0 ? (dist / pinchRef.current.startDist) : 1
                                  let newScale = pinchRef.current.startScale * ratio
                                  newScale = Math.max(1, Math.min(newScale, 6))
                                  zoomStateRef.current.scale = newScale
                                  // compute center point between touches and call handleZoomMove
                                  const cx = (t1.clientX + t2.clientX) / 2
                                  const cy = (t1.clientY + t2.clientY) / 2
                                  const rect = innerImgRef.current?.getBoundingClientRect()
                                  if (!rect) return
                                  // synthesize an event-like object with clientX/Y
                                  const fakeEvent = { clientX: cx, clientY: cy }
                                  handleZoomMove(fakeEvent, rect, newScale)
                                }}
                                onTouchEnd={(e)=>{
                                  if (!pinchRef.current.active) return
                                  if (e.touches && e.touches.length >= 2) return
                                  pinchRef.current.active = false
                                }}
                              />
                            </div>

                            {/* minimap thumbnail with viewport rectangle (bottom-right) */}
                            {/* minimap removed */}
                          </div>
                        )
                      })()}
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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
            aria-label={`Contactar por WhatsApp: Me interesa ${model.title}`}
            className="mt-6 inline-flex w-max items-center justify-center gap-3 rounded-full px-6 py-3 text-sm font-medium btn btn-gold focus-visible:outline-none focus-visible:ring-2"
          >
            <FaWhatsapp className="h-4 w-4 text-white" aria-hidden />
            Me interesa
          </a>
        </div>
      </div>
    </div>
  );
}

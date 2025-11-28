"use client"
import { useEffect } from 'react'

function normalizeImg(img) {
  try {
    const w = img.naturalWidth || img.width || 0
    const h = img.naturalHeight || img.height || 0
    const containerSelectors = ['.product-thumb', '.thumb', '.image-thumb', '.product-main-image', '.edit-image-card .image-thumb', '.featured-panel .product-list .product-row .product-thumb']
    let container = null
    for (const sel of containerSelectors) {
      const c = img.closest(sel)
      if (c) { container = c; break }
    }
    if (!container) container = img.parentElement || img

    container.classList.remove('is-portrait', 'is-landscape')
    if (h >= w) container.classList.add('is-portrait')
    else container.classList.add('is-landscape')
  } catch (e) { /* ignore */ }
}

export default function ImageOrientationNormalizer() {
  useEffect(() => {
    const selectors = ['.product-main-image img', '.thumb img', '.product-thumb img', '.image-thumb img', '.edit-image-card .image-thumb img', '.featured-panel .product-list .product-row .product-thumb img']

    const handleImg = (img) => {
      if (!img) return
      if (img.complete && img.naturalWidth) {
        normalizeImg(img)
      } else {
        img.addEventListener('load', () => normalizeImg(img), { once: true })
      }
    }

    const scan = () => {
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(handleImg)
      })
    }

    scan()

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length) scan()
        if (m.type === 'attributes' && m.target && m.target.tagName === 'IMG') handleImg(m.target)
      }
    })

    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] })

    return () => mo.disconnect()
  }, [])

  return null
}

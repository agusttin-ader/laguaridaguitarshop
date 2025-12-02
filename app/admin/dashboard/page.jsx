"use client"

import React, { useEffect, useState, useRef, memo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../../lib/supabaseClient'
import { FiTrash2, FiStar, FiCopy, FiCheck } from 'react-icons/fi'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminDashboard(){
  const [user, setUser] = useState(null)
  const [token, setToken] = useState('')
  const [products, setProducts] = useState([])
  const [, setLoadingProducts] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', onConfirm: null })
  const [buckets, setBuckets] = useState(null)
  const [signedUrl, setSignedUrl] = useState(null)
  const [settings, setSettings] = useState({ featured: [], featuredMain: {}, heroImage: '' })
  const [savingSettings, setSavingSettings] = useState(false)
  const uploadingHero = false
  const [heroPreview, setHeroPreview] = useState('')
  const [heroFileName, setHeroFileName] = useState('')
  const [pendingHeroFile, setPendingHeroFile] = useState(null)
  const [debugErr, setDebugErr] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [requests, setRequests] = useState([])
  const [requestsModalOpen, setRequestsModalOpen] = useState(false)
  const [imagePickerOpen, setImagePickerOpen] = useState(false)
  const [imagePickerProduct, setImagePickerProduct] = useState(null)
  const [imagePickerImages, setImagePickerImages] = useState([])
  const [imagePickerSelected, setImagePickerSelected] = useState(null)
  const [adminsModalOpen, setAdminsModalOpen] = useState(false)
  const [adminsList, setAdminsList] = useState([])
  const [expandedProducts, setExpandedProducts] = useState({})
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [featuredPanelOpen, setFeaturedPanelOpen] = useState(false)
  const [productsPanelOpen, setProductsPanelOpen] = useState(false)
  const saveFeaturedTimeout = useRef(null)
  const dragIndexRef = useRef(null)
  const editDragIndexRef = useRef(null)
  const router = useRouter()

  

  // Motion variants for featured panel and thumbnails (smoother, premium feel)
  const panelVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.997 },
    show: { opacity: 1, y: 0, scale: 1, transition: { staggerChildren: 0.04, when: 'beforeChildren', duration: 0.42, ease: 'easeOut' } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.22 } }
  }

  

  function openImagePicker(product){
    const id = product.id || product.slug || product.title
    setImagePickerImages(product.images || [])
    setImagePickerProduct(id)
    // initialize selected to current featuredMain for this product if present, else first image
    const currentMain = (settings.featuredMain && settings.featuredMain[id]) || (product.images && product.images[0]) || null
    setImagePickerSelected(currentMain)
    setImagePickerOpen(true)
  }

  const safeSrc = (u) => {
    if (!u) return null
    if (typeof u === 'object') {
      if (!u) return null
      // Prefer optimized variants when available (for mobile use smaller width)
      const tryVariantKeys = ['w320', 'w640', 'w1024']
      if (u.variants && typeof u.variants === 'object') {
        for (const vk of tryVariantKeys) {
          if (u.variants[vk]) {
            try { const s = String(u.variants[vk]).trim(); if (s && s !== '[object Object]') return s } catch {}
          }
        }
      }
      const tryKeys = ['publicUrl', 'url', 'src', 'path']
      for (const k of tryKeys) {
        if (u[k]) {
          try { const s = String(u[k]).trim(); if (s && s !== '[object Object]') return s } catch { /* continue */ }
        }
      }
      return null
    }
    try { const s = String(u).trim(); if (!s || s === '[object Object]') return null; return s } catch { return null }
  }

// Small presentational components memoized to avoid re-renders when parent state changes

const FeaturedThumb = memo(function FeaturedThumb({ prod, fid, idx, isSelected, handlers, selectedCount = 0, maxReached = false }) {
  const thumb = prod ? (prod.images && prod.images[0] ? prod.images[0] : null) : null
  const src = normalizeSrc(thumb)
  return prod ? (
    <motion.div
      key={fid}
      data-fid={fid}
      className={`featured-thumb ${isSelected ? 'selected' : ''}`}
      variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
      initial="hidden"
      animate="show"
      layout
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      draggable
      onDragStart={(e) => handlers.handleFeaturedDragStart(e, idx)}
      onDragOver={handlers.handleFeaturedDragOver}
      onDrop={(e) => handlers.handleFeaturedDrop(e, idx)}
      onTouchStart={(e) => handlers.handleFeaturedTouchStart(e, idx)}
      onTouchEnd={(e) => handlers.handleFeaturedTouchEnd(e)}
      onClick={() => { try { handlers.handleFeaturedThumbTap && handlers.handleFeaturedThumbTap(fid) } catch(_){} }}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); try { handlers.handleFeaturedThumbTap && handlers.handleFeaturedThumbTap(fid) } catch(_){} } }}
      style={{minWidth:140,display:'flex',flexDirection:'column',gap:6,padding:8,borderRadius:8,background:'#0b0b0b',border:'1px solid #222',cursor:'pointer',position:'relative',opacity: (!isSelected && maxReached) ? 0.56 : 1}}
    >
      <div style={{width:140,height:84,overflow:'hidden',borderRadius:8,background:'#111',flex:'0 0 auto'}}>
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={src} alt={prod.title} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
        ) : <div className="muted" style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>No foto</div>}
      </div>
      <div style={{fontSize:13,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:140}} title={prod.title}>{prod.title}</div>
      {isSelected ? (
        <div aria-hidden style={{position:'absolute',top:8,right:8,minWidth:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:999,background:'#D4AF37',color:'#0D0D0D',fontWeight:700,fontSize:12,boxShadow:'0 2px 6px rgba(0,0,0,0.35)'}}> {String(idx+1)} </div>
      ) : null}
    </motion.div>
  ) : null
})
  const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'agusttin.ader@gmail.com'
  const isOwner = user?.email === OWNER_EMAIL

  async function handleSignOut(){
    try {
      await supabase.auth.signOut()
    } catch (_) { }
    setUser(null)
    // Redirect to admin login after signing out
    try {
      router.replace('/admin/login')
    } catch (_) {
      if (typeof window !== 'undefined') window.location.href = '/admin/login'
    }
  }

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try {
        const { data } = await supabase.auth.getSession()
        const sessionUser = data?.session?.user ?? null
        const accessToken = data?.session?.access_token ?? ''
        if (!mounted) return
        setUser(sessionUser)
        setToken(accessToken)

          // if no user, mark access denied (show friendly notice)
          if (!sessionUser) {
            setAuthChecked(true)
            setAccessDenied(true)
            return
          }

        // if owner by email, authorized
        if (sessionUser.email === OWNER_EMAIL) {
          setAuthChecked(true)
          return
        }

        // otherwise check admins table via API (requires token)
        try {
          const res = await fetch('/api/admin/admins', { headers: { Authorization: `Bearer ${accessToken}` } })
          if (!mounted) return
          if (!res.ok) {
            // not admin: check if the user has a pending admin request
            try {
              const chk = await fetch('/api/admin/requests/check', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email: sessionUser.email }) })
              if (!mounted) return
              if (chk.ok) {
                const body = await chk.json()
                if (body.pending) {
                  // mark pending approval and sign the user out automatically
                                  setPendingApproval(true)
                                  try { if (typeof window !== 'undefined') sessionStorage.setItem('la_pending_approval','1') } catch(_) {}
                                  try { await supabase.auth.signOut() } catch (_) {}
                                  setUser(null)
                                  setToken('')
                                  setAuthChecked(true)
                                  return
                }
              }
            } catch (e) { /* ignore */ }

            // not admin and no pending request -> show access denied
            setAuthChecked(true)
            setAccessDenied(true)
            return
          }
          // authorized (is admin)
          setAuthChecked(true)
        } catch (err) {
          setAuthChecked(true)
          setAccessDenied(true)
        }
      } catch (err) {
        setAuthChecked(true)
        setAccessDenied(true)
      }
    })()
    return ()=>{ mounted = false }
  }, [OWNER_EMAIL, router])

  const normalizeSrc = (u) => {
    const s = safeSrc(u)
    if (!s) return null
    try {
      let candidate = s
      if (candidate.startsWith('//')) candidate = window.location.protocol + candidate
      if (candidate.startsWith('/')) return candidate
      if (/^[a-zA-Z0-9+.-]+:\/\//.test(candidate)) return candidate
      if (candidate.includes('supabase.co') && !candidate.startsWith('http')) candidate = 'https://' + candidate
      const url = new URL(candidate, window.location.origin)
      const ok = ['http:', 'https:', 'data:', 'blob:'].includes(url.protocol)
      return ok ? url.href : null
    } catch (err) { return null }
  }

  // Resolve a valid image URL for a product, preferring settings.featuredMain[fid]
  
  async function fetchProducts(){
    setLoadingProducts(true)
    try {
      const res = await fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (!res.ok) throw json
      // Keep API order (avoid bundling large JSON into client by dynamic import)
      setProducts(json)
    } catch (err) {
      console.error('Failed to fetch products', err)
    } finally { setLoadingProducts(false) }
  }

  async function fetchSettings(){
    try {
      const res = await fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (!res.ok) throw json
      setSettings(json)
      setHeroPreview(json?.heroImage || '')
    } catch (err) { console.error('Failed to fetch settings', err) }
  }

  async function saveFeaturedToServer(nextSettings){
    try {
      const body = { featured: nextSettings.featured, featuredMain: nextSettings.featuredMain }
      const res = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
      const persistedTo = res.headers.get('x-settings-persisted-to') || 'unknown'
      const envOverrides = res.headers.get('x-settings-env-overrides') === 'true'
      const json = await res.json()
      if (!res.ok) throw json
      setSettings(json)
      if (envOverrides) toast.warning('ATENCIÓN: Las variables de entorno (Vercel) están activas y pueden estar sobreescribiendo estos cambios')
      toast.success(`Destacados guardados (persisted: ${persistedTo})`)
      // broadcast settings change
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('la-guarida-settings')
          bc.postMessage({ type: 'featured-updated', featured: json.featured })
          bc.close()
        }
      } catch (_) {}
    } catch (err) { console.error('Error saving featured', err); toast.error('Error guardando destacados') }
  }

  function scheduleSaveFeatured(nextSettings){
    if (saveFeaturedTimeout.current) clearTimeout(saveFeaturedTimeout.current)
    // debounce 800ms
    saveFeaturedTimeout.current = setTimeout(()=>{
      saveFeaturedToServer(nextSettings)
    }, 800)
  }

  

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(()=>{
    if (!token) return
    // token available — proceed to fetch data
    fetchProducts()
    fetchSettings()
    if (isOwner) fetchRequests()
  },[token])
  /* eslint-enable react-hooks/exhaustive-deps */

  // Listen to product creation broadcasts from other tabs (or the new product page)
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(()=>{
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return
    const bc = new BroadcastChannel('la-guarida-products')
    const handler = (ev) => {
      try {
        const msg = ev.data || {}
        if (msg && msg.type === 'product-created') {
          toast.success('Nuevo producto creado — actualizando lista')
          fetchProducts()
          // optionally fetch settings if product impacts featured
          fetchSettings()
        }
      } catch (e) { console.error('Broadcast handler error', e) }
    }
    bc.addEventListener('message', handler)
    return () => {
      try { bc.removeEventListener('message', handler); bc.close() } catch(_){}
    }
  }, [token])
  /* eslint-enable react-hooks/exhaustive-deps */

  async function fetchRequests(){
    try {
      const res = await fetch('/api/admin/requests', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (!res.ok) throw json
      setRequests(json)
    } catch (err) { console.error('Failed to fetch requests', err) }
  }

  async function approveRequest(id){
    try {
      const res = await fetch('/api/admin/requests', { method: 'PATCH', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id, status: 'approved' }) })
      const json = await res.json()
      if (!res.ok) throw json
      toast.success('Solicitud aprobada')
      await fetchRequests()
    } catch (err) { console.error(err); toast.error('Error aprobando') }
  }

  async function rejectRequest(id){
    try {
      const res = await fetch('/api/admin/requests', { method: 'PATCH', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id, status: 'rejected' }) })
      const json = await res.json()
      if (!res.ok) throw json
      toast.success('Solicitud rechazada')
      await fetchRequests()
    } catch (err) { console.error(err); toast.error('Error rechazando') }
  }

  async function fetchAdmins(){
    setLoadingAdmins(true)
    try {
      const res = await fetch('/api/admin/admins', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (!res.ok) throw json
      setAdminsList(Array.isArray(json) ? json : [])
    } catch (err) {
      console.error('Failed to fetch admins', err)
      toast.error('Error cargando administradores')
      setAdminsList([])
    } finally { setLoadingAdmins(false) }
  }

  async function revokeAdmin(id){
    setConfirmState({
      open: true,
      title: 'Revocar administrador',
      message: `Revocar el acceso del admin con id ${id}? Esta acción puede revertirse agregando el id nuevamente.`,
      onConfirm: async () => {
        setConfirmState(s => ({ ...s, open: false }))
        try {
          const res = await fetch('/api/admin/admins', { method: 'DELETE', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id }) })
          const json = await res.json().catch(()=>null)
          if (!res.ok) throw json || 'error'
          toast.success('Administrador revocado')
          // refresh list
          await fetchAdmins()
        } catch (err) { console.error(err); toast.error('Error revocando administrador') }
      }
    })
  }

  function openAdminsModal(){
    setAdminsModalOpen(true)
    fetchAdmins()
  }

  function handleFeaturedDragStart(e, idx) {
    dragIndexRef.current = idx
    try { e.dataTransfer?.setData('text/plain', String(idx)) } catch (_) {}
    try {
      if (typeof window !== 'undefined' && typeof window.Image === 'function') {
        e.dataTransfer?.setDragImage?.(new window.Image(), 0, 0)
      }
    } catch (_) {}
  }

  function findFidFromPoint(x, y) {
    if (typeof document === 'undefined') return null
    try {
      const el = document.elementFromPoint(x, y)
      if (!el) return null
      const card = el.closest('[data-fid]')
      return card ? card.getAttribute('data-fid') : null
    } catch (e) { return null }
  }

  function handleFeaturedTouchStart(e, idx) {
    // mark drag start index for potential reorder on touch.
    // Do not prevent default here so simple taps still trigger click events
    // which improves tactile selection on mobile.
    dragIndexRef.current = idx
  }

  function handleFeaturedTouchEnd(e) {
    try {
      const touch = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0])
      if (!touch) return
      const fid = findFidFromPoint(touch.clientX, touch.clientY)
      if (!fid) return
      const list = Array.isArray(settings.featured) ? settings.featured.slice() : []
      const fromIdx = dragIndexRef.current ?? -1
      const toIdx = list.indexOf(fid)
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return
      const [item] = list.splice(fromIdx, 1)
      list.splice(toIdx, 0, item)
      const next = { ...settings, featured: list }
      setSettings(next)
      scheduleSaveFeatured(next)
    } catch (err) { console.warn('touch reorder failed', err) }
  }

  // Handlers for editingProduct images drag/drop
  function handleDragStart(e, idx) {
    editDragIndexRef.current = idx
    try { e.dataTransfer?.setData('text/plain', String(idx)) } catch (_) {}
    try {
      if (typeof window !== 'undefined' && typeof window.Image === 'function') {
        e.dataTransfer?.setDragImage?.(new window.Image(), 0, 0)
      }
    } catch (_) {}
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  function handleDrop(e, targetIdx) {
    e.preventDefault()
    const fromIdx = editDragIndexRef.current ?? parseInt(e.dataTransfer?.getData('text/plain') || '-1', 10)
    if (fromIdx === -1 || fromIdx === targetIdx) return
    const arr = (editingProduct.images || []).slice()
    if (fromIdx < 0 || fromIdx >= arr.length || targetIdx < 0 || targetIdx >= arr.length) return
    const [item] = arr.splice(fromIdx, 1)
    arr.splice(targetIdx, 0, item)
    setEditingProduct({ ...editingProduct, images: arr })
    editDragIndexRef.current = null
  }

  function handleDragLeave() {
    // no-op placeholder for future styling
  }

  function handleDragEnd() {
    editDragIndexRef.current = null
  }

  function handleFeaturedDragOver(e) {
    e.preventDefault()
  }

  function handleFeaturedDrop(e, targetIdx) {
    e.preventDefault()
    const fromIdx = dragIndexRef.current ?? parseInt(e.dataTransfer?.getData('text/plain') || '-1', 10)
    if (fromIdx === -1 || fromIdx === targetIdx) return
    const list = Array.isArray(settings.featured) ? settings.featured.slice() : []
    if (fromIdx < 0 || fromIdx >= list.length || targetIdx < 0 || targetIdx >= list.length) return
    const [item] = list.splice(fromIdx, 1)
    list.splice(targetIdx, 0, item)
    const next = { ...settings, featured: list }
    setSettings(next)
    scheduleSaveFeatured(next)
  }
    if (authChecked && pendingApproval) {
      return (
        <div className="admin-container admin-dashboard">
          <div style={{padding:40,display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/pending-approval.svg" alt="Pendiente de aprobación" loading="lazy" decoding="async" style={{width:220,maxWidth:'80%'}} />
            <h2>Solicitud pendiente</h2>
            <div className="muted" style={{textAlign:'center'}}>Tu cuenta fue creada, pero necesitas que el administrador (agusttin.ader@gmail.com) te otorgue permisos para acceder al panel. Por favor, espera a que el propietario apruebe tu solicitud.</div>
            <div style={{display:'flex',gap:12,marginTop:12}}>
              <button className="btn btn-primary" onClick={() => { try { router.replace('/admin/login') } catch (_) { window.location.href = '/admin/login' } }}>Volver a Login</button>
              <button className="btn btn-ghost" onClick={() => { try { sessionStorage.removeItem('la_pending_approval') } catch(_){}; setPendingApproval(false); try { router.replace('/') } catch(_) { window.location.href='/' } }}>Cerrar</button>
            </div>
          </div>
        </div>
      )
    }

  function handleFeaturedThumbTap(fid) {
    try {
      const id = fid
      const nextSet = new Set(settings.featured || [])
      if (nextSet.has(id)) nextSet.delete(id)
      else {
        if ((settings.featured || []).length >= 3) { toast.error('Máximo 3 destacados'); return }
        nextSet.add(id)
      }
      const nextSettings = { ...settings, featured: Array.from(nextSet) }
      setSettings(nextSettings)
      try { scheduleSaveFeatured(nextSettings) } catch (_) {}
    } catch (err) { console.warn('toggle featured failed', err) }
  }

  

    if (authChecked && accessDenied) {
      return (
        <div className="admin-container admin-dashboard">
          <div style={{padding:40,display:'flex',flexDirection:'column',alignItems:'center',gap:18}}>
            <div style={{width:120,height:120,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:999,background:'#1f1f1f',border:'1px solid #2b2b2b'}}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/lock-closed.svg" alt="Acceso denegado" style={{width:64,height:64}} />
            </div>
            <h2>Acceso restringido</h2>
            <div className="muted" style={{textAlign:'center',maxWidth:560}}>No tienes permisos para ver esta sección. Por favor, inicia sesión con una cuenta de administrador para acceder al panel de administración.</div>
            <div style={{display:'flex',gap:12,marginTop:12}}>
              <button className="btn btn-primary" onClick={() => { try { router.replace('/admin/login') } catch (_) { window.location.href = '/admin/login' } }}>Iniciar sesión</button>
              <button className="btn btn-ghost" onClick={() => { try { router.replace('/') } catch (_) { window.location.href = '/' } }}>Volver al sitio</button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="admin-container admin-dashboard">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Panel de Administración</h1>
            <div className="muted">Gestión de productos, imágenes y configuración</div>
          </div>
          <div>
            {user ? (
              <div className="admin-user header-user">
                <div className="muted">{user.email}</div>
                <button className="btn btn-ghost" onClick={handleSignOut}>Cerrar sesión</button>
              </div>
            ) : (
              <p className="header-user">No estás logueado. Ve a <a href="/admin/login">Login</a></p>
            )}
          </div>
        </div>

        <div className="admin-grid">
          <div>

          <div className="card" style={{marginTop:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <h3 style={{margin:0}}>Productos</h3>
                <div className="muted" style={{fontSize:13}}>Listado de productos activos con acciones de editar y eliminar.</div>
              </div>
              <div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <motion.button
                    className="hamburger-button btn btn-ghost"
                    aria-expanded={productsPanelOpen}
                    onClick={() => setProductsPanelOpen(s => !s)}
                    aria-label="Toggle panel productos"
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ scale: 1.03 }}
                    animate={{ rotate: productsPanelOpen ? 90 : 0 }}
                    transition={{ type: 'spring', stiffness: 160, damping: 26 }}
                  >☰</motion.button>
                </div>
              </div>
            </div>
            <div style={{marginTop:12}}>
              <div style={{marginBottom:12}}>
                <button className="btn btn-primary btn-wide btn-full-mobile" onClick={() => router.push('/admin/products/new')}>Cargar producto</button>
              </div>
              {products.length === 0 ? <div className="muted">No hay productos</div> : (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {/* Compact view when products panel closed */}
                  {!productsPanelOpen ? (
                    <div style={{display:'flex',flexDirection:'column',gap:8}} aria-hidden="true">
                      <div className="muted" style={{fontSize:13}}>Productos: {products.length}</div>
                    </div>
                  ) : (
                    <AnimatePresence>
                      <motion.div variants={panelVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.36 }} style={{display:'flex',flexDirection:'column',gap:8}}>
                        {products.map(p => {
                          const id = p.id || p.slug || p.title
                          const expanded = !!expandedProducts[id]
                          return (
                            <div key={id} style={{padding:8,borderRadius:8,background: expanded ? 'rgba(255,255,255,0.02)' : 'transparent'}}>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                <div style={{display:'flex',alignItems:'center',gap:12}}>
                                  <div style={{width:92,height:60,overflow:'hidden',borderRadius:6,background:'#111'}}>
                                    { (p.images && p.images[0]) ? (
                                      /* eslint-disable-next-line @next/next/no-img-element */
                                      <img src={normalizeSrc(p.images[0])} alt={p.title} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                                    ) : <div className="muted" style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>No foto</div> }
                                  </div>
                                  <div>
                                    <div style={{fontWeight:700}}>{p.title}</div>
                                    <div className="muted" style={{fontSize:12}}>{p.price}</div>
                                  </div>
                                </div>
                                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                                  <button className="btn btn-ghost" onClick={() => setExpandedProducts(s => ({ ...s, [id]: !s[id] }))} aria-label="Toggle detalles">☰</button>
                                </div>
                              </div>
                              {expanded && (
                                <div style={{marginTop:8,display:'flex',gap:8,alignItems:'center',justifyContent:'flex-end'}}>
                                  <button className="btn btn-ghost" onClick={() => setEditingProduct(p)}>Editar</button>
                                  <button onClick={() => {
                                    setConfirmState({
                                      open: true,
                                      title: 'Eliminar producto',
                                      message: `Eliminar \"${p.title}\"? Esta acción no se puede deshacer.`,
                                      onConfirm: async () => {
                                        setConfirmState(s => ({ ...s, open: false }))
                                        try {
                                          const res = await fetch('/api/admin/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: p.id }) })
                                          const json = await res.json().catch(()=>null)
                                          if (!res.ok) throw json || 'error'
                                          toast.success('Producto eliminado')
                                          fetchProducts()
                                          fetchSettings()
                                        } catch (err) { console.error(err); toast.error('Error eliminando producto') }
                                      }
                                    })
                                  }} aria-label="Eliminar producto" title="Eliminar producto" style={{padding:6,width:36,height:36,display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'1px solid transparent',background:'transparent'}}><FiTrash2 size={16} color="#ff4d4f" /></button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              )}
            </div>
          </div>

            <div className="section-divider" />

          <div className="card" style={{marginTop:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <h2 style={{margin:0}}>Destacados</h2>
                <div className="muted">Seleccioná hasta 3 productos que se mostrarán como destacados.</div>
              </div>
              <div>
                <motion.button
                  className="hamburger-button btn btn-ghost"
                  aria-expanded={featuredPanelOpen}
                  onClick={() => { setFeaturedPanelOpen(s => !s); }}
                  aria-label="Toggle panel destacados"
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.03 }}
                  animate={{ rotate: featuredPanelOpen ? 90 : 0 }}
                  transition={{ type: 'spring', stiffness: 160, damping: 26 }}
                >☰</motion.button>
              </div>
            </div>
            <div style={{marginTop:12}}>
              {products.length === 0 ? <div className="muted">No hay productos</div> : (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {/* When closed, hide the full products list and show a compact summary + thumbnails */}
                  {!featuredPanelOpen ? (
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      <div className="muted">Pulse el botón ☰ para editar los Destacados</div>
                      <div style={{display:'flex',gap:8,alignItems:'center',overflowX:'auto',paddingTop:6}}>
                        {(settings.featured || []).map((fid, idx) => {
                          const prod = products.find(pp => (pp.id || pp.slug || pp.title) === fid) || null
                          const isSelected = (settings.featured || []).includes(fid)
                          const selectedCount = (settings.featured || []).length
                          const maxReached = selectedCount >= 3
                          return (
                            <FeaturedThumb
                              key={fid}
                              prod={prod}
                              fid={fid}
                              idx={idx}
                              isSelected={isSelected}
                              selectedCount={selectedCount}
                              maxReached={maxReached}
                              handlers={{ handleFeaturedDragStart, handleFeaturedDragOver, handleFeaturedDrop, handleFeaturedTouchStart, handleFeaturedTouchEnd, handleFeaturedThumbTap }}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence>
                      <motion.div variants={panelVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.36 }} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                        <div style={{flex:1,maxHeight:420,overflowY:'auto',paddingRight:8}}>
                          <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Productos (marcá hasta 3)</div>
                          {products.map(p => {
                            const id = p.id || p.slug || p.title
                            const selected = (settings.featured || []).includes(id)
                            return (
                              <div key={id} style={{padding:8,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,borderRadius:8,background:selected? 'rgba(255,255,255,0.01)':'transparent'}}>
                                <div style={{display:'flex',alignItems:'center',gap:10}}>
                                  <div style={{width:64,height:44,overflow:'hidden',borderRadius:6,background:'#111'}}>
                                    { (p.images && p.images[0]) ? (
                                      /* eslint-disable-next-line @next/next/no-img-element */
                                      <img src={normalizeSrc(p.images[0])} alt={p.title} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                                    ) : <div className="muted" style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>No foto</div> }
                                  </div>
                                  <div>
                                    <div style={{fontWeight:700}}>{p.title}</div>
                                    <div className="muted" style={{fontSize:12}}>{p.price}</div>
                                  </div>
                                </div>
                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                  <input type="checkbox" checked={selected} onChange={(e)=>{
                                    const nextSet = new Set(settings.featured || [])
                                    if (e.target.checked) {
                                      if ((settings.featured || []).length >= 3) { toast.error('Máximo 3 destacados'); return }
                                      nextSet.add(id)
                                    } else { nextSet.delete(id) }
                                    const nextSettings = { ...settings, featured: Array.from(nextSet) }
                                    setSettings(nextSettings)
                                    try { scheduleSaveFeatured(nextSettings) } catch (_) {}
                                  }} />
                                  {p.images && p.images.length > 0 && <button className="btn btn-ghost" onClick={() => openImagePicker(p)}>Elegir foto</button>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              )}
              <div style={{marginTop:12,display:'flex',gap:8}}>
                <button className="btn btn-primary" onClick={async ()=>{
                  setSavingSettings(true)
                  try {
                    const body = { featured: settings.featured, featuredMain: settings.featuredMain }
                    const res = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
                    const json = await res.json()
                    if (!res.ok) throw json
                    setSettings(json)
                    toast.success('Destacados guardados')
                  } catch (err) { console.error(err); toast.error('Error guardando destacados') }
                  finally { setSavingSettings(false) }
                }}>{savingSettings ? 'Guardando...' : 'Guardar destacados'}</button>
                <button className="btn btn-ghost" onClick={()=> fetchSettings()}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
        
        

          <div>
          {isOwner && (
            <div className="card">
              <h3>Herramientas</h3>
              <p className="muted">Utilidades de depuración y acceso a Storage.</p>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:10}}>
                <button className="btn btn-ghost" onClick={async ()=>{
                  setDebugErr(null)
                  setBuckets(null)
                  try {
                    const res = await fetch('/api/admin/storage/buckets', { headers: { Authorization: `Bearer ${token}` } })
                    const json = await res.json()
                    if (!res.ok) throw json
                    setBuckets(json)
                  } catch (err) { setDebugErr(String(err)); console.error(err) }
                }}>Listar buckets</button>

                <button className="btn btn-ghost" onClick={async ()=>{
                  setDebugErr(null)
                  setSignedUrl(null)
                  const examplePath = prompt('Path del objeto (ej: 1763829090_file.jpg)')
                  if (!examplePath) return
                  try {
                    const res = await fetch('/api/admin/storage/signed-url', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ path: examplePath }) })
                    const json = await res.json()
                    if (!res.ok) throw json
                    setSignedUrl(json)
                  } catch (err) { setDebugErr(String(err)); console.error(err) }
                }}>Generar signed URL</button>
              </div>
              {debugErr && <p style={{color:'red',marginTop:8}}>Error: {debugErr}</p>}
              {buckets && (
                <pre style={{marginTop:8,fontSize:12,whiteSpace:'pre-wrap'}}>{JSON.stringify(buckets,null,2)}</pre>
              )}
              {signedUrl && (
                <div style={{marginTop:8}}>
                  <pre style={{fontSize:12}}>{JSON.stringify(signedUrl,null,2)}</pre>
                  {signedUrl.signedUrl && <div style={{marginTop:8}}><a className="btn btn-primary" href={signedUrl.signedUrl} target="_blank" rel="noreferrer">Abrir signed URL</a></div>}
                </div>
              )}
              <div style={{marginTop:14,borderTop:'1px dashed #eee',paddingTop:12}}>
                <h4 style={{margin:0}}>Administradores (solo propietario)</h4>
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <input id="newAdminId" placeholder="User ID (uuid)" style={{flex:1,padding:8,borderRadius:8,border:'1px solid #ddd'}} />
                  <button className="btn btn-primary" onClick={async ()=>{
                    const id = document.getElementById('newAdminId').value.trim()
                    if (!id) { toast.error('User ID requerido'); return }
                    try {
                      const res = await fetch('/api/admin/admins', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id }) })
                      const json = await res.json()
                      if (!res.ok) throw json
                      toast.success('Administrador agregado')
                    } catch (err) { toast.error('Error: ' + JSON.stringify(err)) }
                  }}>Grant admin</button>
                </div>
                <div style={{marginTop:10,display:'flex',gap:8}}>
                  <button className="btn btn-ghost" onClick={async ()=>{
                    try {
                      const res = await fetch('/api/admin/admins', { headers: { Authorization: `Bearer ${token}` } })
                      const json = await res.json()
                      if (!res.ok) throw json
                      const list = json
                      const html = list.map(a=>`id: ${a.id}`).join('\n')
                      toast.success(`Admins:\n${html}`)
                    } catch (err) { toast.error('Error: ' + JSON.stringify(err)) }
                  }}>List admins</button>
                  <button className="btn btn-ghost" onClick={() => { fetchRequests(); setRequestsModalOpen(true) }}>Ver solicitudes</button>
                  <button className="btn btn-ghost" onClick={() => openAdminsModal()}>Revoke admin</button>
                </div>
            
                {/* requests are shown in a modal — use the "Ver solicitudes" button above */}
              </div>
            </div>
          )}

          <div className="section-divider" />

          <div className="card" style={{marginTop:16}}>
            <h3>Hero</h3>
            <p className="muted">Editar la imagen del Hero. Podés pegar una URL o subir un archivo.</p>
            <div style={{marginTop:10}}>
              <div className="form-row">
                <label>Imagen actual</label>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  {(() => {
                    // Preferir la preview local (pending file) y si no existe usar settings.heroImage
                    const src = normalizeSrc(heroPreview || settings.heroImage)
                    return src ? (
                      <div style={{width:160,height:96,overflow:'hidden',borderRadius:8}}>
                        <Image src={src} alt="miniatura portada" width={320} height={192} style={{objectFit:'cover',width:'100%',height:'100%'}} />
                      </div>
                    ) : (
                      <div className="muted">Sin imagen</div>
                    )
                  })()}
                </div>
              </div>
              <div className="form-row">
                <label>Ingresar URL / path</label>
                <input value={settings.heroImage || ''} onChange={(e)=> { setSettings({...settings, heroImage: e.target.value}); setHeroPreview(e.target.value) }} />
              </div>

              <div className="form-row">
                <label>O subir archivo</label>
                <input className="file-input-hidden" type="file" accept="image/*" id="heroFileInput" onChange={(e)=>{
                  const file = e.target.files?.[0]
                  if (!file) return
                  // show filename immediately and create a local preview (before upload)
                  setHeroFileName(file.name || '')
                  setPendingHeroFile(file)
                  try {
                    const url = URL.createObjectURL(file)
                    setHeroPreview(url)
                  } catch (_) {
                    setHeroPreview('')
                  }
                  // don't upload yet; wait until user clicks Guardar imagen
                }}/>
                <label htmlFor="heroFileInput" className="btn-file">Subir imagen</label>
                {heroFileName ? <span className="file-name" title={heroFileName}>{heroFileName}</span> : null}
                {uploadingHero && <div className="muted">Subiendo...</div>}
              </div>

              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-primary" onClick={async ()=>{
                  setSavingSettings(true)
                  const previousHero = settings.heroImage || ''
                  try {
                    // If the user selected a local file, upload it first to the server
                    if (pendingHeroFile) {
                      try {
                        const form = new FormData()
                        // ensure filename is safe — NewProductForm uses a timestamped name server-side; we keep original name here
                        form.append('file', pendingHeroFile, pendingHeroFile.name)
                        form.append('bucket', 'product-images')
                        const upRes = await fetch('/api/admin/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
                        if (!upRes.ok) {
                          const txt = await upRes.text().catch(()=>null)
                          throw new Error('Upload failed: ' + (txt || upRes.statusText))
                        }
                        const upJson = await upRes.json().catch(()=>null)
                        const publicUrl = upJson?.publicUrl || null
                        if (publicUrl) {
                          // set the hero image to the uploaded public URL before persisting settings
                          settings.heroImage = publicUrl
                          setHeroPreview(publicUrl)
                          setHeroFileName('')
                          setPendingHeroFile(null)
                        }
                      } catch (uploadErr) {
                        console.error('Hero upload failed', uploadErr)
                        toast.error('Error subiendo la imagen de portada')
                        setSavingSettings(false)
                        return
                      }
                    }

                    const res = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ heroImage: settings.heroImage }) })
                    const persistedTo = res.headers.get('x-settings-persisted-to') || 'unknown'
                    const envOverrides = res.headers.get('x-settings-env-overrides') === 'true'
                    const json = await res.json()
                    if (!res.ok) throw json
                    setSettings(json)
                    setHeroPreview(json.heroImage)
                    if (envOverrides) toast.warning('ATENCIÓN: Las variables de entorno (Vercel) están activas y pueden estar sobreescribiendo estos cambios')
                    toast.success(`Portada actualizada (persisted: ${persistedTo})`)

                    // If there was a previous hero and it's different from the new one,
                    // attempt to delete the old file from storage (best-effort).
                    try {
                      if (previousHero && previousHero !== json.heroImage) {
                        await fetch('/api/admin/storage/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ publicUrl: previousHero, bucket: 'product-images' }) })
                        // ignore response; it's best-effort
                      }
                    } catch (delErr) {
                      console.warn('Failed to delete previous hero image', delErr)
                    }

                    // Broadcast update to other tabs
                    try {
                      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
                        const bc = new BroadcastChannel('la-guarida-settings')
                        bc.postMessage({ type: 'hero-updated', url: json.heroImage })
                        bc.close()
                      }
                    } catch (bcErr) { /* ignore */ }

                    toast.success('Portada actualizada')
                  } catch (err) { console.error(err); toast.error('Error actualizando portada') }
                  finally { setSavingSettings(false) }
                }}>{savingSettings ? 'Guardando...' : 'Guardar imagen'}</button>
                <button className="btn btn-ghost" onClick={()=> fetchSettings()}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Edit panel modal */}
      <AnimatePresence>
        {editingProduct && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="edit-modal modal-content compact-edit-modal" initial={{ opacity: 0, scale: 0.98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }} transition={{ duration: 0.16 }} style={{maxHeight: '80vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch'}}>
              <h3 style={{marginTop:0}}>Editar producto</h3>
              <div className="compact-modal-body" style={{display:'flex',flexDirection:'column',gap:12}}>
                <div>
                  <label style={{display:'block',fontWeight:700}}>Título</label>
                  <input value={editingProduct.title || ''} onChange={(e)=> setEditingProduct({...editingProduct, title: e.target.value})} style={{width:'100%',padding:8,borderRadius:8,border:'1px solid #333',marginBottom:8}} />
                  <label style={{display:'block',fontWeight:700}}>Precio</label>
                  <input value={editingProduct.price || ''} onChange={(e)=> setEditingProduct({...editingProduct, price: e.target.value})} style={{width:'100%',padding:8,borderRadius:8,border:'1px solid #333',marginBottom:8}} />
                  <label style={{display:'block',fontWeight:700}}>Descripción</label>
                  <textarea value={editingProduct.description || ''} onChange={(e)=> setEditingProduct({...editingProduct, description: e.target.value})} style={{width:'100%',padding:8,borderRadius:8,border:'1px solid #333',minHeight:80}} />
                  <div style={{marginTop:10,display:'flex',gap:8}}>
                    <button className="btn btn-primary" onClick={async ()=>{
                      // save changes via PATCH
                      try {
                        const body = { id: editingProduct.id, title: editingProduct.title, description: editingProduct.description, price: editingProduct.price, images: editingProduct.images }
                        const res = await fetch('/api/admin/products', { method: 'PATCH', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
                        const json = await res.json()
                        if (!res.ok) throw json
                        // update local list
                        setProducts((prev)=> prev.map(p => p.id === json.id ? json : p))
                        setEditingProduct(null)
                        toast.success('Producto guardado')
                      } catch (err) { console.error(err); toast.error('Error guardando') }
                    }}>Guardar</button>
                    <button className="btn btn-ghost" onClick={()=> setEditingProduct(null)}>Cancelar</button>
                  </div>
                </div>

                <div className="edit-modal-specs">
                  <label style={{display:'block',fontWeight:700}}>Especificaciones</label>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
                    <div>
                      <label style={{display:'block',fontSize:12}}>Marca</label>
                      <input value={(editingProduct.specs && editingProduct.specs.marca) || editingProduct.marca || ''} onChange={(e)=>{
                        const specs = Object.assign({}, editingProduct.specs || {})
                        specs.marca = e.target.value
                        setEditingProduct({...editingProduct, specs})
                      }} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #333'}} />
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:12}}>Modelo</label>
                      <input value={(editingProduct.specs && editingProduct.specs.modelo) || editingProduct.modelo || ''} onChange={(e)=>{
                        const specs = Object.assign({}, editingProduct.specs || {})
                        specs.modelo = e.target.value
                        setEditingProduct({...editingProduct, specs})
                      }} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #333'}} />
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:12}}>Microfonos</label>
                      <input value={(editingProduct.specs && editingProduct.specs.microfonos) || ''} onChange={(e)=>{
                        const specs = Object.assign({}, editingProduct.specs || {})
                        specs.microfonos = e.target.value
                        setEditingProduct({...editingProduct, specs})
                      }} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #333'}} />
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:12}}>Puente</label>
                      <input value={(editingProduct.specs && editingProduct.specs.puente) || ''} onChange={(e)=>{
                        const specs = Object.assign({}, editingProduct.specs || {})
                        specs.puente = e.target.value
                        setEditingProduct({...editingProduct, specs})
                      }} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #333'}} />
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:12}}>Color</label>
                      <input value={(editingProduct.specs && editingProduct.specs.color) || ''} onChange={(e)=>{
                        const specs = Object.assign({}, editingProduct.specs || {})
                        specs.color = e.target.value
                        setEditingProduct({...editingProduct, specs})
                      }} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #333'}} />
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:12}}>Año</label>
                      <input value={(editingProduct.specs && editingProduct.specs.year) || (editingProduct.specs && editingProduct.specs.anio) || ''} onChange={(e)=>{
                        const specs = Object.assign({}, editingProduct.specs || {})
                        specs.year = e.target.value
                        setEditingProduct({...editingProduct, specs})
                      }} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #333'}} />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{display:'block',fontWeight:700}}>Imágenes</label>
                  <div className="edit-images-grid">
                    {(editingProduct.images || []).map((img, i) => {
                      const src = normalizeSrc(img?.url || img || '')
                      const isMain = i === 0
                      return (
                        <div
                          key={i}
                          className="edit-image-card"
                          draggable
                          onDragStart={(e) => handleDragStart(e, i)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, i)}
                          onDragLeave={handleDragLeave}
                          onDragEnd={handleDragEnd}
                          style={isMain ? { border: '2px solid #D4AF37' } : {}}
                        >
                          <div className="image-thumb">
                            {src ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={src} alt={`img-${i}`} loading="lazy" decoding="async" />
                            ) : (
                              <div className="muted" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No preview</div>
                            )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {isMain ? <FiStar size={14} style={{ color: '#D4AF37' }} aria-hidden /> : <div style={{ fontSize: 13, color: '#EDEDED', fontWeight: 600 }}>{i + 1}</div>}
                            </div>

                            <div className="image-controls" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button type="button" className="btn btn-ghost" aria-label="Arrastrar imagen" onMouseDown={() => { editDragIndexRef.current = i }} onTouchStart={(e) => { editDragIndexRef.current = i; try { e.preventDefault() } catch (_) {} }} style={{width:30,height:30,display:'inline-flex',alignItems:'center',justifyContent:'center',cursor:'grab'}}>☰</button>

                              <button type="button" onClick={() => {
                                const next = (editingProduct.images || []).slice()
                                const removed = next.splice(i, 1)
                                setEditingProduct({ ...editingProduct, images: next })
                                try {
                                  const candidate = removed[0]
                                  const publicUrl = candidate?.url || candidate?.publicUrl || candidate
                                  if (publicUrl) {
                                    setConfirmState({
                                      open: true,
                                      title: 'Eliminar archivo de storage',
                                      message: '¿Eliminar también el archivo en storage?',
                                      onConfirm: async () => {
                                        setConfirmState(s => ({ ...s, open: false }))
                                        try {
                                          await fetch('/api/admin/storage/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ publicUrl, bucket: 'product-images' }) })
                                        } catch (e) { console.warn('Delete storage failed', e) }
                                      }
                                    })
                                  }
                                } catch (e) { console.warn('Delete storage failed', e) }
                              }} className="btn btn-danger" aria-label="Eliminar imagen" title="Eliminar imagen"><FiTrash2 size={14} /></button>
                            </div>
                          </div>

                          <div style={{ fontSize: 12, color: '#AAA', marginTop: 8 }}>{(img && (img.originalName || img.name)) || ''}</div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{marginTop:12}}>
                    <input id="editImagesInput" className="file-input-hidden" type="file" accept="image/*" multiple onChange={async (e)=>{
                      const files = Array.from(e.target.files || [])
                      if (files.length === 0) return
                      try {
                        const uploaded = []
                        for (const f of files) {
                          const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '-')
                          const filename = `${Date.now()}_${safeName}`
                          const { data, error } = await supabase.storage.from('product-images').upload(filename, f, { cacheControl: '3600' })
                          if (error) { toast.error('Error subiendo ' + f.name); continue }
                          const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(data.path)
                          const publicUrl = publicData?.publicUrl ? encodeURI(publicData.publicUrl) : null
                          uploaded.push({ url: publicUrl, path: data.path, name: data.path.split('/').pop(), originalName: f.name })
                        }
                        const next = [...(editingProduct.images || []), ...uploaded]
                        setEditingProduct({...editingProduct, images: next})
                        toast.success('Imágenes subidas')
                      } catch (err) { console.error(err); toast.error('Error subiendo imágenes') }
                      try { e.target.value = '' } catch (_) {}
                    }} />
                    <label htmlFor="editImagesInput" className="btn btn-primary">Subir imágenes</label>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {requestsModalOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} style={{maxWidth:720,margin:'40px auto',padding:18, maxHeight: '70vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                <h4 style={{margin:0}}>Solicitudes pendientes</h4>
                <div style={{display:'flex',gap:8}}>
                  <button className="btn btn-ghost" onClick={() => { setRequestsModalOpen(false); setRequests([]) }}>Cerrar</button>
                </div>
              </div>
              <div style={{marginTop:12}}>
                <div style={{fontSize:13,color:'#888',marginBottom:8}}>Listado de solicitudes de acceso. Revisá el correo y el mensaje.</div>
                {(!requests || requests.length === 0) ? (
                  <div className="muted">No hay solicitudes pendientes</div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {requests.map(r => (
                      <div key={r.id} style={{padding:10,background:'rgba(0,0,0,0.03)',borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div>
                          <div style={{fontWeight:700}}>{r.email}</div>
                          <div className="muted" style={{fontSize:12}}>{r.message || ''}</div>
                        </div>
                        <div style={{display:'flex',gap:8}}>
                          <button className="btn" title="Aprobar" onClick={() => approveRequest(r.id)}><FiCheck size={16} /></button>
                          <button className="btn" title="Rechazar" onClick={() => rejectRequest(r.id)} style={{background:'#fff',border:'1px solid #ff4d4f',color:'#ff4d4f'}}><FiTrash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => { if (confirmState.onConfirm) confirmState.onConfirm() }}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
      />
      <AnimatePresence>
        {imagePickerOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} style={{maxWidth:800,margin:'40px auto',padding:18, maxHeight: '80vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch'}}>
              <h4 style={{marginTop:0}}>Elegir foto principal</h4>
              <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:8}}>
                    {(imagePickerImages || []).map((img, i) => {
                  const src = normalizeSrc(img)
                  if (!src) return null
                  const isSelected = normalizeSrc(imagePickerSelected) === normalizeSrc(img)
                  return (
                    <button key={i} type="button" onClick={() => setImagePickerSelected(img)} style={{width:140,height:96,overflow:'hidden',borderRadius:8,padding:0,border:isSelected ? '3px solid #D4AF37' : '1px solid #ddd'}}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`opt-${i}`} loading="lazy" decoding="async" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                    </button>
                  )
                })}
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',marginTop:12,gap:8}}>
                <button className="btn btn-ghost" onClick={() => setImagePickerOpen(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={() => {
                  if (imagePickerSelected) {
                    // build a normalized URL string (avoid storing objects like {url, path})
                    const selectedSrc = normalizeSrc(imagePickerSelected) || (typeof imagePickerSelected === 'string' ? imagePickerSelected : null)
                    if (selectedSrc) {
                      // create next settings object and update state functionally
                      const nextMain = Object.assign({}, settings.featuredMain || {})
                      nextMain[imagePickerProduct] = selectedSrc
                      const nextSettings = Object.assign({}, settings, { featuredMain: nextMain })
                      setSettings(() => nextSettings)
                      // schedule a debounced save so change persists and other tabs get the update
                      try { scheduleSaveFeatured(nextSettings) } catch (_) {}
                    } else {
                      toast.error('Imagen inválida')
                    }
                  }
                  setImagePickerOpen(false)
                }}>Guardar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOwner && adminsModalOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} style={{maxWidth:720,margin:'40px auto',padding:18, maxHeight: '70vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                <h4 style={{margin:0}}>Administradores</h4>
                <div style={{display:'flex',gap:8}}>
                  <button className="btn btn-ghost" onClick={() => { setAdminsModalOpen(false); setAdminsList([]) }}>Cerrar</button>
                </div>
              </div>
              <div style={{marginTop:12}}>
                <div style={{fontSize:13,color:'#888',marginBottom:8}}>Lista de administradores. Podés copiar el ID o revocar su acceso.</div>
                {loadingAdmins ? (
                  <div className="muted">Cargando...</div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {adminsList.length === 0 ? <div className="muted">No hay administradores registrados</div> : adminsList.map(a => (
                      <div key={a.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:10,background:'rgba(0,0,0,0.03)',borderRadius:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <div style={{width:44,height:44,borderRadius:22,background:'#111',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#fff',fontSize:12}} aria-hidden>{String(a.id || '').slice(0,2).toUpperCase()}</div>
                          <div style={{display:'flex',flexDirection:'column'}}>
                            <div style={{fontWeight:700,fontSize:13}}>{String(a.id || '').slice(0,12)}{(a.id && a.id.length>12)?'...':''}</div>
                            <div className="muted" style={{fontSize:12}}>ID completo oculto por seguridad</div>
                          </div>
                        </div>
                        <div style={{display:'flex',gap:8,alignItems:'center'}}>
                          <button className="btn btn-ghost" title="Copiar ID" onClick={async ()=>{
                            try {
                              await (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(a.id) : Promise.reject('clipboard'))
                              toast.success('ID copiado')
                            } catch (e) { toast('No se pudo copiar') }
                          }}><FiCopy size={16} /></button>
                          <button className="btn" style={{background:'#fff',border:'1px solid #ff4d4f',color:'#ff4d4f',padding:'8px 10px',borderRadius:8}} onClick={() => revokeAdmin(a.id)} title="Revocar administrador"><FiTrash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

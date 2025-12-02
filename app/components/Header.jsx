"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FiLogOut } from 'react-icons/fi'
import { supabase } from '../../lib/supabaseClient'
import { useRouter, usePathname } from 'next/navigation'

export default function Header() {
  const [open, setOpen] = useState(false);
  const router = useRouter()
  const pathname = usePathname()
  const isAdminRoute = typeof pathname === 'string' && pathname.startsWith('/admin')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [menuClosing, setMenuClosing] = useState(false)
  const closingTimeout = useRef(null)
  const [menuOpening, setMenuOpening] = useState(false)
  const avatarRef = useRef(null)
  const menuRef = useRef(null)
  const mobileBtnRef = useRef(null)
  const mobileMenuRef = useRef(null)
  

  // Check session and listen for changes so we can conditionally show admin buttons
  useEffect(() => {
    let mounted = true
    async function check() {
      try {
        if (typeof supabase?.auth?.getSession === 'function'){
          const { data } = await supabase.auth.getSession()
          if (!mounted) return
          const sess = data?.session || null
          setIsLoggedIn(!!(sess && sess.user))
          setUser(sess ? sess.user : null)
        }
      } catch (e) {
        console.error('Error checking session', e)
      }
    }
    check()
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      const u = session?.user || null
      setIsLoggedIn(!!u)
      setUser(u)
    })
    return () => { mounted = false; try { sub?.subscription?.unsubscribe?.() } catch {} }
  }, [])

  // Close avatar menu when clicking outside or pressing Escape.
  // Keep the menu mounted during a short 'closing' animation before unmounting.
  useEffect(() => {
    const menuVisible = avatarMenuOpen || menuClosing
    if (!menuVisible) return

    function closeWithAnimation() {
      setAvatarMenuOpen(false)
      setMenuClosing(true)
      // fallback timeout in case transitionend isn't fired
      if (closingTimeout.current) clearTimeout(closingTimeout.current)
      closingTimeout.current = setTimeout(() => {
        setMenuClosing(false)
        closingTimeout.current = null
      }, 600)
    }

    // Use pointerdown in capture phase so we detect outside clicks before other handlers
    function onDocPointer(e) {
      try {
        const path = e.composedPath ? e.composedPath() : (e.path || [])
        // if click is inside trigger or menu, ignore
        const insideTrigger = path.some((node) => node && node.dataset && node.dataset.avatarTrigger !== undefined)
        const insideMenu = path.some((node) => node && node.dataset && node.dataset.avatarMenu !== undefined)
        if (insideTrigger || insideMenu) return
      } catch (err) {
        if (e.target && (e.target.closest && e.target.closest('[data-avatar-trigger]'))) return
        if (e.target && (e.target.closest && e.target.closest('[data-avatar-menu]'))) return
      }
      closeWithAnimation()
    }

    function onKey(e){ if (e.key === 'Escape') closeWithAnimation() }

    document.addEventListener('pointerdown', onDocPointer, true)
    document.addEventListener('keydown', onKey)

    // If menuRef is present, listen for transitionend to remove closing state precisely
    const el = menuRef.current
    function onTransitionEnd(ev) {
      if (ev.propertyName === 'opacity' || ev.propertyName === 'transform') {
        setMenuClosing(false)
        if (closingTimeout.current) { clearTimeout(closingTimeout.current); closingTimeout.current = null }
      }
    }
    if (el) el.addEventListener('transitionend', onTransitionEnd)

    return () => {
      document.removeEventListener('pointerdown', onDocPointer, true)
      document.removeEventListener('keydown', onKey)
      if (el) el.removeEventListener('transitionend', onTransitionEnd)
      if (closingTimeout.current) { clearTimeout(closingTimeout.current); closingTimeout.current = null }
    }
  }, [avatarMenuOpen, menuClosing])
  

  const navLinkClass =
    "nav-link px-3 py-2 text-sm md:text-base font-medium transition-colors duration-200 ease-out hover:text-[var(--gold-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-100)]/60";

  // Lock body scroll while the mobile menu is open to prevent background scroll
  useEffect(() => {
    if (typeof document === 'undefined') return
    const prev = document.body.style.overflow
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = prev || ''
    return () => { document.body.style.overflow = prev || '' }
  }, [open])

  // Close mobile menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return
    function close() { setOpen(false) }
    function onPointer(e) {
      try {
        const path = e.composedPath ? e.composedPath() : (e.path || [])
        const insideBtn = path.some((n) => n && n === mobileBtnRef.current)
        const insideMenu = path.some((n) => n && n === mobileMenuRef.current)
        if (insideBtn || insideMenu) return
      } catch (err) {
        if (e.target && (e.target.closest && (e.target.closest('#mobile-menu-button') || e.target.closest('#mobile-menu')))) return
      }
      close()
    }
    function onKey(e){ if (e.key === 'Escape') close() }
    document.addEventListener('pointerdown', onPointer, true)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onPointer, true); document.removeEventListener('keydown', onKey) }
  }, [open])

  async function handleSignOut() {
    try {
      if (typeof supabase?.auth?.signOut === 'function') {
        await supabase.auth.signOut()
      }
    } catch (e) {
      console.error('Sign out error', e)
    }
    // close menu and navigate home to reflect signed-out state
    try { router.push('/') } catch { window.location.href = '/' }
  }

  function closeMenuAnimated() {
    // start closing animation then clear after transition/fallback
    setAvatarMenuOpen(false)
    setMenuClosing(true)
    setMenuOpening(false)
    if (closingTimeout.current) clearTimeout(closingTimeout.current)
    closingTimeout.current = setTimeout(() => { setMenuClosing(false); closingTimeout.current = null }, 400)
  }

  function toggleAvatarMenu() {
    if (avatarMenuOpen) {
      // already open -> close with animation
      closeMenuAnimated()
      return
    }
    if (menuClosing) {
      // was closing, cancel and reopen
      if (closingTimeout.current) { clearTimeout(closingTimeout.current); closingTimeout.current = null }
      setMenuClosing(false)
      setAvatarMenuOpen(true)
      // ensure opening animation runs
      setMenuOpening(true)
      requestAnimationFrame(() => setMenuOpening(false))
      return
    }
    // default: open
    setAvatarMenuOpen(true)
    setMenuOpening(true)
    // trigger the opening class change on next frame so CSS transition runs
    requestAnimationFrame(() => setMenuOpening(false))
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0D0D0D] text-[#EDEDED] font-sans">
      <div className="mx-auto flex h-[64px] md:h-[80px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-semibold tracking-wide hover:text-[var(--gold-100)] transition-colors duration-200"
          aria-label="Ir a inicio"
        >
          La Guarida Guitarshop
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          <Link href="/" className={navLinkClass}>
            Inicio
          </Link>
          <Link href="/modelos" className={navLinkClass}>
            Modelos
          </Link>
          <Link href="/contacto" className={navLinkClass}>
            Contacto
          </Link>
          {isLoggedIn && (
            <Link href="/admin/dashboard" className={navLinkClass}>
              Administración
            </Link>
          )}
        </nav>

        {/* Admin indicator (desktop) */}
        {isLoggedIn && (
          <>
            <div className="hidden md:flex items-center gap-3 ml-4">
              <div ref={avatarRef} className="relative" aria-label="Avatar admin">
                <button data-avatar-trigger type="button" onClick={toggleAvatarMenu} className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-transparent ring-1 ring-white/6 text-sm font-semibold text-[#EDEDED] focus:outline-none ${avatarMenuOpen ? 'avatar-trigger-active' : ''}`} aria-haspopup="true" aria-expanded={avatarMenuOpen} aria-label="Abrir menú admin">
                  {(user?.email || user?.id || 'A').toString().charAt(0).toUpperCase()}
                </button>
                {/* badge removed: no extra hamburger indicator next to avatar */}
                {(avatarMenuOpen || menuClosing) && (
                  <div ref={menuRef} data-avatar-menu role="menu" className={`avatar-menu origin-top-right absolute right-0 top-full mt-2 w-48 rounded-lg z-50 py-2 ${avatarMenuOpen && !menuClosing ? 'open' : 'closing'}`}>
                    <Link href="/admin/dashboard" onClick={() => closeMenuAnimated()} className="avatar-menu-item block px-4 py-3 text-sm font-medium text-white/90" role="menuitem">Administración</Link>
                    <button type="button" onClick={()=>{ closeMenuAnimated(); if (closingTimeout.current) clearTimeout(closingTimeout.current); closingTimeout.current = setTimeout(()=>{ setMenuClosing(false); closingTimeout.current = null }, 400); handleSignOut() }} className="avatar-menu-item block w-full text-left px-4 py-3 text-sm font-medium text-white/80" role="menuitem">Cerrar sesión</button>
                  </div>
                )}
              </div>
              <span className="text-sm text-white/80">Admin</span>
            </div>
            {/* small indicator for mobile (avatar toggles same menu) */}
              <div className="md:hidden flex items-center gap-2 mr-2">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-transparent ring-1 ring-white/6 text-sm font-semibold text-[#EDEDED]" aria-hidden>
                  {(user?.email || user?.id || 'A').toString().charAt(0).toUpperCase()}
                </div>
              </div>
          </>
        )}

        {/* Mobile menu button (visible on small screens) - animated SVG */}
        <button
          id="mobile-menu-button"
          ref={mobileBtnRef}
          type="button"
          className={`hamburger-btn md:hidden inline-flex items-center justify-center p-2 rounded-md focus:outline-none ${open ? 'active' : ''}`}
          aria-controls="mobile-menu"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Abrir menú</span>
          <svg className="hamburger-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path className="line top" d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path className="line middle" d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path className="line bottom" d="M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile dropdown (hamburger) */}
      <div
        id="mobile-menu"
        ref={mobileMenuRef}
        className={`${open ? 'mobile-drawer open' : 'mobile-drawer closed'} md:hidden bg-[#0D0D0D]`}
        aria-hidden={!open}
      >
        <nav className="flex flex-col gap-1 px-4 pb-4 max-h-[58vh] overflow-auto" aria-label="Menú móvil">
          <Link href="/" onClick={(e)=>{ e.preventDefault(); setOpen(false); setTimeout(()=>router.push('/'),420) }} className="py-3 text-base font-medium transition-colors duration-200 ease-out hover:text-[var(--gold-100)]">Inicio</Link>
          <Link href="/modelos" onClick={(e)=>{ e.preventDefault(); setOpen(false); setTimeout(()=>router.push('/modelos'),420) }} className="py-3 text-base font-medium transition-colors duration-200 ease-out hover:text-[var(--gold-100)]">Modelos</Link>
          <Link href="/contacto" onClick={(e)=>{ e.preventDefault(); setOpen(false); setTimeout(()=>router.push('/contacto'),420) }} className="py-3 text-base font-medium transition-colors duration-200 ease-out hover:text-[var(--gold-100)]">Contacto</Link>
          {isLoggedIn && (
            <Link href="/admin/dashboard" onClick={(e)=>{ e.preventDefault(); setOpen(false); setTimeout(()=>router.push('/admin/dashboard'),420) }} className="mt-2 w-full inline-flex items-center gap-3 rounded-lg btn-panel-mobile px-3 py-3 text-sm font-medium text-[#EDEDED] bg-transparent transition transform-gpu border-t border-white/6 justify-start" aria-label="Ir a Administración">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4"/></svg>
              <span>Administración</span>
            </Link>
          )}
          {isLoggedIn && (
            <button type="button" onClick={() => { setOpen(false); handleSignOut() }} className="mt-2 w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[#EDEDED] bg-transparent hover:bg-white/6 transition transform-gpu border-t border-white/6 justify-start" aria-label="Cerrar sesión">
              <FiLogOut className="h-5 w-5 text-[#EDEDED]" aria-hidden />
              <span>Cerrar sesión</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

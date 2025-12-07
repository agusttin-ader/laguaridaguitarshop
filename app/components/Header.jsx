"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from 'next/image'
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
  // Avatar and menu are static identifiers on desktop — no avatar dropdown menu
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

  // Avatar menu removed: avatar is only an identifier on desktop
  

  const navLinkClass = "revamp-nav-link";

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
    // kept for compatibility but no avatar menu UI exists
  }


  return (
    <header className="sticky top-0 z-50 w-full bg-[#0D0D0D] text-[#EDEDED] font-sans revamp-header">
      <div className="mx-auto flex h-[64px] md:h-[80px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-semibold tracking-wide hover:text-[var(--gold-100)] transition-colors duration-200 revamp-brand flex items-center gap-3"
          aria-label="Ir a inicio"
        >
            <div className="revamp-brand-mark" aria-hidden>
            {/* Rectangular logo (SVG placed at /public/images/logo-rect.svg) */}
            <Image src="/images/logo-rect.svg" alt="La Guarida" width={520} height={200} className="object-contain rounded-sm block logo-mark" style={{background:'transparent', boxShadow:'none'}} />
          </div>
          <span className="revamp-logo hidden md:inline-block">La Guarida Guitarshop</span>
        </Link>

        {/* Desktop nav (large screens and up) */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Principal">
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

        {/* Admin indicator (large screens and up) - static identifier (no desktop menus) */}
        {isLoggedIn && (
          <>
            <div className="hidden lg:flex items-center gap-3 ml-4">
              <div className="relative" aria-label="Avatar admin">
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-transparent ring-1 ring-white/6 text-sm font-semibold text-[#EDEDED]`} aria-hidden>
                  {(user?.email || user?.id || 'A').toString().charAt(0).toUpperCase()}
                </div>
              </div>
              <span className="text-sm text-white/80">Admin</span>
            </div>
            {/* small indicator for mobile/tablet (static) */}
            <div className="lg:hidden flex items-center gap-2 mr-2">
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
          className={`hamburger-btn lg:hidden inline-flex items-center justify-center p-2 rounded-md focus:outline-none ${open ? 'active' : ''}`}
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
        className={`${open ? 'mobile-drawer open' : 'mobile-drawer closed'} lg:hidden bg-[#0D0D0D]`}
        aria-hidden={!open}
      >
        <nav className="flex flex-col gap-1 px-4 pb-4 max-h-[58vh] overflow-auto" aria-label="Menú móvil">
          <Link href="/" onClick={(e)=>{ e.preventDefault(); setOpen(false); setTimeout(()=>router.push('/'),420) }} className="py-3 text-base font-medium transition-colors duration-200 ease-out hover:text-[var(--gold-100)]">Inicio</Link>
          <Link href="/modelos" onClick={(e)=>{ e.preventDefault(); setOpen(false); setTimeout(()=>router.push('/modelos'),420) }} className="py-3 text-base font-medium transition-colors duration-200 ease-out hover:text-[var(--gold-100)]">Modelos</Link>
          <Link href="/contacto" onClick={(e)=>{ e.preventDefault(); setOpen(false); setTimeout(()=>router.push('/contacto'),420) }} className="py-3 text-base font-medium transition-colors duration-200 ease-out hover:text-[var(--gold-100)]">Contacto</Link>
          {isLoggedIn && (
            <Link href="/admin/dashboard" onClick={(e)=>{ e.preventDefault(); setOpen(false); setTimeout(()=>router.push('/admin/dashboard'),420) }} className="mt-2 w-full inline-flex items-center gap-3 rounded-lg btn-panel-mobile px-3 py-3 text-sm font-medium text-[#EDEDED] bg-transparent transition transform-gpu border-t border-white/6 justify-start" aria-label="Ir a Administración">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#D4AF37] block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4"/></svg>
              <span className="align-middle">Administración</span>
            </Link>
          )}
          {isLoggedIn && (
            <button type="button" onClick={() => { setOpen(false); handleSignOut() }} className="mt-2 w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[#EDEDED] bg-transparent hover:bg-white/6 transition transform-gpu border-t border-white/6 justify-start" aria-label="Cerrar sesión">
              <FiLogOut className="h-5 w-5 text-[#EDEDED] block" aria-hidden />
              <span className="align-middle">Cerrar sesión</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

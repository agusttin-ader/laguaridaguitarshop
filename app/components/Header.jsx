"use client";

import { useState } from "react";
import Link from "next/link";
import { FiMenu, FiX } from 'react-icons/fi'

export default function Header() {
  const [open, setOpen] = useState(false);
  

  const navLinkClass =
    "px-3 py-2 text-sm md:text-base font-medium transition-colors duration-200 ease-out hover:text-[var(--gold-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-100)]/60";

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
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 hover:opacity-80 md:hidden"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Abrir menú</span>
          {open ? <FiX className="h-6 w-6" aria-hidden /> : <FiMenu className="h-6 w-6" aria-hidden />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`${
          open ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
        } md:hidden overflow-hidden bg-[#0D0D0D] transition-all duration-200 ease-out`}
      >
        <nav className="flex flex-col gap-1 px-4 pb-4" aria-label="Menú móvil">
          <Link
            href="/"
            className="py-2 transition-colors duration-200 ease-out hover:text-[var(--gold-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-100)]/60"
            onClick={() => setOpen(false)}
          >
            Inicio
          </Link>
          <Link
            href="/modelos"
            className="py-2 transition-colors duration-200 ease-out hover:text-[var(--gold-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-100)]/60"
            onClick={() => setOpen(false)}
          >
            Modelos
          </Link>
          <Link
            href="/contacto"
            className="py-2 transition-colors duration-200 ease-out hover:text-[var(--gold-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-100)]/60"
            onClick={() => setOpen(false)}
          >
            Contacto
          </Link>
        </nav>
      </div>
    </header>
  );
}

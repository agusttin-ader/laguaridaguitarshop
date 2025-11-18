"use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [open, setOpen] = useState(false);

  const navLinkClass =
    "px-3 py-2 text-sm md:text-base font-medium transition-colors duration-200 ease-out hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60";

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0D0D0D] text-[#EDEDED] font-sans">
      <div className="mx-auto flex h-[80px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-semibold tracking-wide hover:opacity-80"
          aria-label="Ir a inicio"
        >
          La Guarida Guitar Shop
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          <Link href="/" className={navLinkClass}>
            Home
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
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Abrir menú</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-6 w-6"
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            )}
          </svg>
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
            className="py-2 transition-colors duration-200 ease-out hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
            onClick={() => setOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/modelos"
            className="py-2 transition-colors duration-200 ease-out hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
            onClick={() => setOpen(false)}
          >
            Modelos
          </Link>
          <Link
            href="/contacto"
            className="py-2 transition-colors duration-200 ease-out hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
            onClick={() => setOpen(false)}
          >
            Contacto
          </Link>
        </nav>
      </div>
    </header>
  );
}

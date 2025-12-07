"use client"

import Link from 'next/link'
import { FaHome, FaGuitar, FaPhone } from 'react-icons/fa'

export default function BottomNav(){
  return (
    <nav className="bottom-nav fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[94%] max-w-3xl bg-[#0b0b0b]/95 border border-white/6 rounded-3xl p-2 flex items-center justify-between md:hidden">
      <Link href="/" className="nav-item flex-1 text-center py-2 text-sm text-white/90">
        <FaHome className="mx-auto h-5 w-5" />
        <span className="block text-xs">Inicio</span>
      </Link>
      <Link href="/modelos" className="nav-item flex-1 text-center py-2 text-sm text-white/90">
        <FaGuitar className="mx-auto h-5 w-5" />
        <span className="block text-xs">Modelos</span>
      </Link>
      <Link href="/contacto" className="nav-item flex-1 text-center py-2 text-sm text-white/90">
        <FaPhone className="mx-auto h-5 w-5" />
        <span className="block text-xs">Contacto</span>
      </Link>
    </nav>
  )
}

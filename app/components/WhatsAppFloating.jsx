"use client"
import { FaWhatsapp } from 'react-icons/fa'
import { openAndAutoClose } from '../lib/windowHelpers'

export default function WhatsAppFloating({ messageUrl = 'https://wa.me/541168696491?text=Hola%2C%20quiero%20consultar%20sobre%20sus%20guitarras', timeout = 3000 }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      <button
        type="button"
        onClick={() => openAndAutoClose(messageUrl, timeout)}
        aria-label="Abrir WhatsApp"
        className="bg-[#25D366] hover:brightness-95 text-white rounded-full p-4 shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
      >
        <FaWhatsapp className="h-6 w-6" aria-hidden />
      </button>
    </div>
  )
}

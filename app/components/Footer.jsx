"use client";

import Link from "next/link";
import Image from "next/image";
import { FaInstagram, FaWhatsapp } from 'react-icons/fa'
import { FiMail } from 'react-icons/fi'
import { openAndAutoClose } from '../lib/windowHelpers'

export default function Footer() {
  return (
    <footer className="mt-12 w-full bg-[#0D0D0D] text-[#B5B5B5] revamp-footer">
      <div className="mx-auto flex h-[150px] max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full text-center text-sm font-sans">
          <div className="flex justify-center">
            <Image
              src="/images/logo-main.png"
              alt="La Guarida Guitar Shop"
              width={80}
              height={80}
              className="footer-brand-logo"
            />
          </div>
          <div className="mb-3 flex items-center justify-center gap-6">
            <Link
              href="https://www.instagram.com/laguaridainstrumentos/"
              className="inline-flex items-center gap-2 transition-colors duration-200"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram className="h-4 w-4" aria-hidden />
              <span>Instagram</span>
            </Link>

            {/* Open WhatsApp in a popup and auto-close it after a short delay */}
            <button
              type="button"
              onClick={() => openAndAutoClose('https://wa.me/541168696491?text=Hola%2C%20quiero%20consultar%20sobre%20sus%20guitarras', 3000)}
              className="inline-flex items-center gap-2 transition-colors duration-200 bg-transparent border-0 p-0 text-inherit footer-whatsapp-link"
              aria-label="WhatsApp"
            >
              <FaWhatsapp className="h-4 w-4" aria-hidden />
              <span>WhatsApp</span>
            </button>

            <Link
              href="mailto:info@example.com"
              className="inline-flex items-center gap-2 transition-colors duration-200"
              aria-label="Email"
            >
              <FiMail className="h-4 w-4" aria-hidden />
              <span>Email</span>
            </Link>
          </div>

          <div className="text-xs text-[#999]">© {new Date().getFullYear()} La Guarida Guitar Shop</div>
        </div>
      </div>
    </footer>
  );
}

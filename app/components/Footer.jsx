"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-12 w-full bg-[#0D0D0D] text-[#B5B5B5]">
      <div className="mx-auto flex h-[150px] max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full text-center text-sm font-sans">
          <div className="mb-3 flex items-center justify-center gap-6">
            <Link
              href="https://www.instagram.com"
              className="inline-flex items-center gap-2 transition-colors duration-200 hover:text-[#D4AF37]"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
              </svg>
              <span>Instagram</span>
            </Link>

            <Link
              href="https://wa.me/541168696491?text=Hola%2C%20quiero%20consultar%20sobre%20sus%20guitarras"
              className="inline-flex items-center gap-2 transition-colors duration-200 hover:text-[#D4AF37]"
              aria-label="WhatsApp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-3.8-11.4 8.38 8.38 0 0 1 3.8.9L21 3z" />
                <path d="M17.5 14.5c-.3-.1-1.7-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.2-.9.9-1.1 1.1-.2.2-.4.2-.7.1-0.3-.1-1.1-.4-2.1-1.3-.8-.7-1.3-1.5-1.5-1.8-.2-.2 0-.5.1-.7.1-.2.3-.5.4-.8.1-.2.1-.4 0-.6-.1-.2-0.6-1.5-.8-2.1-.2-.6-.4-.5-.6-.5-.2 0-.4 0-.6 0-.2 0-.6.1-.9.4-.2.2-.7.7-.7 1.6 0 .9.8 1.9 1 2.1.2.2 1.6 2.5 3.9 3.6 2.3 1.1 2.3 0.8 2.7 0.8.4 0 1.2-.6 1.4-1.2.2-.6.2-1 .1-1.1-.1-.1-.3-.2-.6-.3z" />
              </svg>
              <span>WhatsApp</span>
            </Link>

            <Link
              href="mailto:info@example.com"
              className="inline-flex items-center gap-2 transition-colors duration-200 hover:text-[#D4AF37]"
              aria-label="Email"
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                <path d="M3 8l9 6 9-6" />
                <path d="M21 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
              </svg>
              <span>Email</span>
            </Link>
          </div>

          <div className="text-xs text-[#999]">© {new Date().getFullYear()} La Guarida Guitar Shop</div>
        </div>
      </div>
    </footer>
  );
}

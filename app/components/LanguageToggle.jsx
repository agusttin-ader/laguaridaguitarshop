"use client";

import { useState, useEffect } from "react";

export default function LanguageToggle() {
  // Minimal toggle that updates a localStorage preference but does not rely on i18n package.
  const [lang, setLang] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('lg_lang') || 'es' : 'es'));

  useEffect(() => {
    const onChange = () => setLang(localStorage.getItem('lg_lang') || 'es');
    window.addEventListener('storage', onChange);
    return () => window.removeEventListener('storage', onChange);
  }, []);

  const toggle = () => {
    const next = lang === 'es' ? 'en' : 'es';
    localStorage.setItem('lg_lang', next);
    setLang(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Cambiar idioma"
      className="ml-4 rounded px-2 py-1 text-sm border border-white/6 text-white/90 hover:bg-[var(--gold-100)] hover:text-black transition-colors"
    >
      {lang === 'es' ? 'ES' : 'EN'}
    </button>
  );
}

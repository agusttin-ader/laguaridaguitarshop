"use client";

import { useEffect, useState } from "react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export default function I18nProvider({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!i18n.isInitialized) {
      i18n.use(initReactI18next).init({
        resources: {},
        lng: typeof window !== "undefined" ? localStorage.getItem("lg_lang") || "es" : "es",
        fallbackLng: "es",
        interpolation: { escapeValue: false },
      });
    }

    let mounted = true;

    async function loadLang(lang) {
      try {
        const res = await fetch(`/locales/${lang}/translation.json`);
        if (!res.ok) return;
        const data = await res.json();
        // add or overwrite bundle
        i18n.addResourceBundle(lang, "translation", data, true, true);
        await i18n.changeLanguage(lang);
        if (mounted) setReady(true);
      } catch (e) {
        console.error("i18n load error", e);
        if (mounted) setReady(true);
      }
    }

    const initial = localStorage.getItem("lg_lang") || "es";
    loadLang(initial);

    const onStorage = (e) => {
      if (e.key === "lg_lang" && e.newValue) {
        loadLang(e.newValue);
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (!ready) return children;

  return children;
}

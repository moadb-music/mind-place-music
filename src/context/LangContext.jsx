import { createContext, useContext, useState } from 'react';
import { translations } from '../i18n/translations';

const LangContext = createContext(null);

function detectLang() {
  const saved = localStorage.getItem('lang');
  if (saved === 'pt' || saved === 'en') return saved;
  const browser = navigator.language || navigator.userLanguage || 'en';
  return browser.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(detectLang);

  const setLanguage = (l) => {
    setLang(l);
    localStorage.setItem('lang', l);
  };

  const t = translations[lang];

  return (
    <LangContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  // Fallback se usado fora do LangProvider (ex: páginas com PlayerProvider próprio)
  if (!ctx) {
    const lang = localStorage.getItem('lang') === 'pt' ? 'pt' : detectLang();
    return { lang, setLanguage: () => {}, t: translations[lang] };
  }
  return ctx;
}

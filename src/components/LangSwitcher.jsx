import { useState, useEffect, useRef } from 'react';
import { useLang } from '../context/LangContext';

function FlagBR({ size = 20 }) {
  const h = Math.round(size * 0.7);
  return (
    <svg width={size} height={h} viewBox="0 0 20 14" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="14" fill="#009c3b"/>
      <polygon points="10,1 19,7 10,13 1,7" fill="#ffdf00"/>
      <circle cx="10" cy="7" r="3" fill="#002776"/>
      <path d="M7.2 6.1 Q10 5 12.8 6.1" stroke="white" strokeWidth="0.7" fill="none"/>
    </svg>
  );
}

function FlagUK({ size = 20 }) {
  const h = Math.round(size * 0.7);
  return (
    <svg width={size} height={h} viewBox="0 0 20 14" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="14" fill="#012169"/>
      <path d="M0,0 L20,14 M20,0 L0,14" stroke="white" strokeWidth="3"/>
      <path d="M0,0 L20,14 M20,0 L0,14" stroke="#C8102E" strokeWidth="1.8"/>
      <path d="M10,0 V14 M0,7 H20" stroke="white" strokeWidth="4"/>
      <path d="M10,0 V14 M0,7 H20" stroke="#C8102E" strokeWidth="2.5"/>
    </svg>
  );
}

export function FlagIcon({ lang, size = 20 }) {
  return lang === 'pt' ? <FlagBR size={size} /> : <FlagUK size={size} />;
}

export default function LangSwitcher() {
  const { lang, setLanguage } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const labels = { pt: 'Português', en: 'English' };

  return (
    <div className="lang-switcher" ref={ref}>
      <button className="lang-current" onClick={() => setOpen(o => !o)}>
        <FlagIcon lang={lang} />
        <svg className={`lang-arrow${open ? ' lang-arrow--open' : ''}`} width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1 2l3 4 3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="lang-dropdown">
          {['pt', 'en'].map(l => (
            <button
              key={l}
              className={`lang-option${lang === l ? ' lang-option--active' : ''}`}
              onClick={() => { setLanguage(l); setOpen(false); }}
            >
              <FlagIcon lang={l} size={22} />
              <span>{labels[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

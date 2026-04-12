import { useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Domínios próprios — não rastrear
const OWN_DOMAINS = ['localhost', 'mindplacemusic.com', 'mind-place-music.web.app', 'mind-place-music.firebaseapp.com'];

function isExternal(href) {
  if (!href) return false;
  try {
    const url = new URL(href, window.location.href);
    if (url.origin === window.location.origin) return false;
    if (OWN_DOMAINS.some(d => url.hostname.includes(d))) return false;
    return true;
  } catch {
    return false;
  }
}

function getLabel(el, href) {
  // Tenta pegar o título do link, texto, ou alt da imagem filha
  if (el.title) return el.title;
  const text = el.innerText?.trim();
  if (text && text.length > 0 && text.length < 60) return text;
  const img = el.querySelector('img');
  if (img?.alt) return img.alt;
  // Fallback: hostname da URL
  try {
    return new URL(href).hostname.replace('www.', '');
  } catch {
    return href;
  }
}

function getSection(el) {
  // Sobe na árvore DOM para identificar a seção
  let node = el;
  while (node && node !== document.body) {
    const id = node.id;
    if (id === 'moadb') return 'Home - MOADB';
    if (id === 'som') return 'Home - State of Mind';
    const cls = node.className || '';
    if (typeof cls === 'string') {
      if (cls.includes('som-discography')) return 'SoM - Discography';
      if (cls.includes('som-hero')) return 'SoM - Latest';
      if (cls.includes('som-about')) return 'SoM - About';
      if (cls.includes('som-page')) return 'State of Mind';
      if (cls.includes('fixed-nav')) return 'Nav';
      if (cls.includes('final-footer')) return 'Footer';
    }
    node = node.parentElement;
  }
  return document.title?.includes('State of Mind') ? 'State of Mind' : 'Home';
}

export function useTrackExternalClicks() {
  useEffect(() => {
    function handleClick(e) {
      // Botão do meio (auxclick) ou botão esquerdo (click)
      if (e.type === 'auxclick' && e.button !== 1) return;

      const anchor = e.target.closest('a[href]');
      if (!anchor) return;

      const href = anchor.href;
      if (!isExternal(href)) return;

      const label = getLabel(anchor, href);
      const source = getSection(anchor);

      const data = {
        type: 'click',
        label,
        url: href,
        source,
        ts: serverTimestamp(),
      };

      console.log('[trackClick] gravando:', label, source);
      addDoc(collection(db, 'analytics_clicks'), data)
        .then(() => console.log('[trackClick] gravado com sucesso'))
        .catch(err => console.error('[trackClick] erro:', err));
    }

    document.addEventListener('click', handleClick);
    document.addEventListener('auxclick', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('auxclick', handleClick);
    };
  }, []);
}

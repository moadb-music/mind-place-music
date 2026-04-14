import { useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function getOS(ua) {
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac os x/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Other';
}

function getBrowser(ua) {
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return 'Opera';
  if (/edg\//i.test(ua)) return 'Edge';
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua)) return 'Safari';
  if (/firefox/i.test(ua)) return 'Firefox';
  return 'Other';
}

function getDevice(ua) {
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function getSessionId() {
  let sid = sessionStorage.getItem('mpm_sid');
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('mpm_sid', sid);
  }
  return sid;
}

function getReferrer() {
  // Verifica parâmetros UTM primeiro (mais confiável que o header Referer)
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  if (utmSource) return utmSource;

  const ref = document.referrer;
  if (!ref) return 'Direct';
  try {
    const url = new URL(ref);
    return url.hostname.replace('www.', '');
  } catch {
    return ref;
  }
}

export function useTrackVisit(pageName) {
  useEffect(() => {
    // Não contabiliza em desenvolvimento local
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;
    // Não contabiliza visitas do admin
    if (localStorage.getItem('mpm_admin')) return;

    const ua = navigator.userAgent;
    const sessionId = getSessionId();

    const data = {
      page: pageName,
      sessionId,
      device: getDevice(ua),
      browser: getBrowser(ua),
      os: getOS(ua),
      referrer: getReferrer(),
      country: 'Unknown',
      ts: serverTimestamp(),
    };

    // Tenta pegar o país com timeout de 2s, depois grava de qualquer jeito
    const geoTimeout = new Promise(resolve => setTimeout(resolve, 2000));
    const geoFetch = fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(geo => {
        if (geo.country_code) {
          data.country = `${geo.country_code} ${geo.country_name || ''}`.trim();
        }
      })
      .catch(() => {});

    Promise.race([geoFetch, geoTimeout])
      .finally(() => {
        addDoc(collection(db, 'analytics'), data).catch(() => {});
      });
  }, [pageName]);
}

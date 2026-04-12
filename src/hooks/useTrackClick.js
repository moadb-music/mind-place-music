import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Grava um clique de saída no Firestore.
 * @param {string} label  - Nome legível do destino (ex: "MOADB - Visit Website")
 * @param {string} url    - URL de destino
 * @param {string} source - Página de origem (ex: "Home", "State of Mind")
 */
export function trackClick(label, url, source) {
  const data = {
    type: 'click',
    label,
    url,
    source,
    ts: serverTimestamp(),
  };
  addDoc(collection(db, 'analytics_clicks'), data).catch(() => {});
}

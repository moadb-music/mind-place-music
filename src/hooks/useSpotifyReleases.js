import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { moadbDb } from '../firebase';

// ============================================================================
// HOOK: useSpotifyReleases
// ============================================================================
// Busca a discografia do projeto MOADB (Mind of a Dead Body) do Firebase.
//
// IMPORTANTE: Este hook usa 'moadbDb' que aponta para o projeto Firebase
// do MOADB (site-mindofadeadbody), não para o projeto principal.
//
// PARA CRIAR UM HOOK SIMILAR PARA OUTRO PROJETO FILHO:
// 1. Copie este arquivo e renomeie (ex: useSomReleases.js)
// 2. Importe o db correto do firebase.js (ex: import { somDb } from '../firebase')
// 3. Altere o nome da coleção/documento conforme necessário
// 4. Exporte com um nome descritivo (ex: export function useSomReleases())
// 5. Use o novo hook no componente correspondente
// ============================================================================

export function useSpotifyReleases() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar documento 'moadb_discography' da coleção 'siteData'
    // no projeto Firebase do MOADB
    getDoc(doc(moadbDb, 'siteData', 'moadb_discography'))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          const items = Object.values(data)
            .flat()
            .filter(item => item && item.title && item.coverUrl)
            .map(r => ({
              ...r,
              tracks: Array.isArray(r.tracks)
                ? r.tracks
                : Object.values(r.tracks || {}),
            }));
          setReleases(items);
        }
      })
      .catch(e => console.error('Erro ao buscar discografia MOADB:', e))
      .finally(() => setLoading(false));
  }, []);

  return { releases, loading };
}

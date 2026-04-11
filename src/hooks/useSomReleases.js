import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useSomReleases() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'siteData', 'som_discography'))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          const items = (data.releases || []).filter(item => item && item.title && item.coverUrl);
          // Normaliza tracks: Firestore às vezes salva arrays como objetos {0:{...},1:{...}}
          const normalized = items.map(r => ({
            ...r,
            tracks: Array.isArray(r.tracks)
              ? r.tracks
              : Object.values(r.tracks || {}),
          }));
          setReleases(normalized);
        }
      })
      .catch(e => console.error('Erro ao buscar discografia SoM:', e))
      .finally(() => setLoading(false));
  }, []);

  return { releases, loading };
}

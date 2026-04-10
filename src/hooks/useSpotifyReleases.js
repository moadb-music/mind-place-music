import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useSpotifyReleases() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'siteData', 'moadb_discography'))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          // o documento tem um array, pegamos todos os itens e filtramos os vazios
          const items = Object.values(data)
            .flat()
            .filter(item => item && item.title && item.coverUrl);
          setReleases(items);
        }
      })
      .catch(e => console.error('Erro Firebase:', e))
      .finally(() => setLoading(false));
  }, []);

  return { releases, loading };
}

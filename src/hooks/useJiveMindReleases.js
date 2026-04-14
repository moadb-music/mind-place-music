import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useJiveMindReleases() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'siteData', 'jivemind_discography'))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          const items = (data.releases || []).filter(item => item && item.title && item.coverUrl);
          const normalized = items.map(r => ({
            ...r,
            tracks: Array.isArray(r.tracks)
              ? r.tracks
              : Object.values(r.tracks || {}),
          }));
          console.log('[JiveMind] releases carregados:', normalized.map(r => ({
            id: r.id,
            title: r.title,
            type: r.type,
            tracks: r.tracks?.map(t => ({ title: t.title, youtubeUrl: t.youtubeUrl, startSec: t.startSec, endSec: t.endSec })),
          })));
          setReleases(normalized);
        } else {
          console.warn('[JiveMind] documento jivemind_discography não encontrado');
        }
      })
      .catch(e => console.error('Erro ao buscar discografia Jive Mind:', e))
      .finally(() => setLoading(false));
  }, []);

  return { releases, loading };
}

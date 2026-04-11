import { useState, useEffect, useRef } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import AdminLogin from './AdminLogin';
import './AdminPage.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

const EMPTY_TRACK = () => ({ title: '', youtubeUrl: '', startSec: 0, endSec: 30 });

const EMPTY_RELEASE = () => ({
  id: `release_${Date.now()}`,
  title: '',
  type: 'SINGLE',
  year: String(new Date().getFullYear()),
  coverUrl: '',
  tracks: [EMPTY_TRACK()],
  links: { spotify: '', apple: '', youtube: '', ytmusic: '', deezer: '' },
});

const COVERS_PATH = 'som/covers';

// ─── ImageGalleryModal ───────────────────────────────────────────────────────

function ImageGalleryModal({ onSelect, onClose }) {
  const inputRef = useRef();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [deleting, setDeleting] = useState(null); // path being deleted
  const [error, setError] = useState('');

  const fetchImages = async () => {
    setLoading(true);
    try {
      const listRef = ref(storage, COVERS_PATH);
      const result = await listAll(listRef);
      const items = await Promise.all(
        result.items.map(async (item) => ({
          ref: item,
          path: item.fullPath,
          name: item.name,
          url: await getDownloadURL(item),
        }))
      );
      setImages(items);
    } catch {
      setError('Erro ao carregar imagens.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImages(); }, []);

  const handleUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setError('');
    setUploading(true);
    setUploadProgress(0);

    const storageRef = ref(storage, `${COVERS_PATH}/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(storageRef, file);

    task.on('state_changed',
      snap => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      () => { setError('Erro no upload.'); setUploading(false); setUploadProgress(null); },
      async () => {
        setUploading(false);
        setUploadProgress(null);
        await fetchImages();
      }
    );
  };

  const handleDelete = async (img) => {
    if (!confirm(`Excluir "${img.name}"?`)) return;
    setDeleting(img.path);
    try {
      await deleteObject(img.ref);
      setImages(prev => prev.filter(i => i.path !== img.path));
    } catch {
      setError('Erro ao excluir imagem.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="admin-modal-overlay" style={{ zIndex: 300 }}>
      <div className="admin-modal admin-gallery-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <span className="admin-modal-title">Galeria de Capas</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="admin-btn-ghost"
              onClick={() => inputRef.current.click()}
              disabled={uploading}
            >
              {uploading ? `Enviando ${uploadProgress}%` : '+ Upload'}
            </button>
            <button className="admin-btn-icon" onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files[0])}
        />

        {error && <p className="admin-error">{error}</p>}

        {loading && <p className="admin-empty">Carregando imagens...</p>}

        {!loading && images.length === 0 && (
          <p className="admin-empty">Nenhuma imagem ainda. Faça upload da primeira!</p>
        )}

        {!loading && images.length > 0 && (
          <div className="admin-gallery-grid">
            {images.map(img => (
              <div
                key={img.path}
                className="admin-gallery-item"
                onClick={() => { onSelect(img.url); onClose(); }}
              >
                <img src={img.url} alt={img.name} className="admin-gallery-img" />
                <div className="admin-gallery-overlay">
                  <span className="admin-gallery-name">{img.name}</span>
                  <button
                    className="admin-gallery-delete"
                    disabled={deleting === img.path}
                    onClick={e => { e.stopPropagation(); handleDelete(img); }}
                    title="Excluir"
                  >
                    {deleting === img.path ? '...' : (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M6 2h4a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1zM3 5h10l-1 9H4L3 5zm3 2v5m4-5v5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CoverUpload ─────────────────────────────────────────────────────────────

function CoverUpload({ coverUrl, onChange }) {
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <>
      <div className="admin-cover-upload">
        {coverUrl
          ? <img src={coverUrl} alt="capa" className="admin-cover-preview" />
          : <div className="admin-cover-preview admin-cover-empty">sem capa</div>
        }
        <button
          type="button"
          className="admin-btn-ghost"
          onClick={() => setGalleryOpen(true)}
        >
          {coverUrl ? 'Trocar capa' : 'Selecionar capa'}
        </button>
      </div>

      {galleryOpen && (
        <ImageGalleryModal
          onSelect={onChange}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  );
}

// ─── ReleaseModal ────────────────────────────────────────────────────────────

function ReleaseModal({ release, onSave, onClose }) {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(release)));

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setLink = (key, value) => setForm(f => ({ ...f, links: { ...f.links, [key]: value } }));
  const setTrack = (idx, field, value) =>
    setForm(f => {
      const tracks = [...f.tracks];
      tracks[idx] = { ...tracks[idx], [field]: value };
      return { ...f, tracks };
    });
  const addTrack = () => setForm(f => ({ ...f, tracks: [...f.tracks, EMPTY_TRACK()] }));
  const removeTrack = (idx) =>
    setForm(f => ({ ...f, tracks: f.tracks.filter((_, i) => i !== idx) }));

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <span className="admin-modal-title">{release.title ? 'Editar Release' : 'Novo Release'}</span>
          <button className="admin-btn-icon" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="admin-form-group">
          <label className="admin-label">Título</label>
          <input className="admin-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Nome do release" />
        </div>

        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-label">Tipo</label>
            <select className="admin-select" value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="SINGLE">Single</option>
              <option value="EP">EP</option>
              <option value="ALBUM">Album</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Ano</label>
            <input className="admin-input" value={form.year} onChange={e => set('year', e.target.value)} placeholder="2025" />
          </div>
        </div>

        <div className="admin-form-group">
          <label className="admin-label">Capa</label>
          <CoverUpload
            coverUrl={form.coverUrl}
            onChange={url => set('coverUrl', url)}
          />
        </div>

        <div className="admin-form-group">
          <label className="admin-label">Links de Streaming</label>
          <div className="admin-links-grid">
            {['spotify', 'apple', 'youtube', 'ytmusic', 'deezer'].map(key => (
              <input
                key={key}
                className="admin-input"
                value={form.links?.[key] || ''}
                onChange={e => setLink(key, e.target.value)}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
              />
            ))}
          </div>
        </div>

        <div className="admin-form-group">
          <div className="admin-tracks-header">
            <label className="admin-label">Tracks</label>
            <button className="admin-btn-ghost" onClick={addTrack}>+ Adicionar</button>
          </div>
          <div className="admin-tracks">
            {form.tracks.map((track, idx) => (
              <div key={idx} className="admin-track-row">
                <input
                  className="admin-input"
                  value={track.title}
                  onChange={e => setTrack(idx, 'title', e.target.value)}
                  placeholder={`Track ${idx + 1}`}
                />
                <input
                  className="admin-input"
                  value={track.youtubeUrl}
                  onChange={e => setTrack(idx, 'youtubeUrl', e.target.value)}
                  placeholder="YouTube URL"
                />
                <input
                  className="admin-input"
                  type="number"
                  value={track.startSec}
                  onChange={e => setTrack(idx, 'startSec', Number(e.target.value))}
                  placeholder="Start"
                  title="Start (seg)"
                />
                <input
                  className="admin-input"
                  type="number"
                  value={track.endSec}
                  onChange={e => setTrack(idx, 'endSec', Number(e.target.value))}
                  placeholder="End"
                  title="End (seg)"
                />
                <button className="admin-btn-icon" onClick={() => removeTrack(idx)} disabled={form.tracks.length === 1}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="admin-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="admin-btn-primary" onClick={() => onSave(form)}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── SoM Panel ───────────────────────────────────────────────────────────────

function SomPanel() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'siteData', 'som_discography'))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          // Lê como array ordenado { releases: [...] }
          const items = (data.releases || []).filter(item => item && item.title);
          setReleases(items.map((r, i) => ({ ...r, id: r.id || `release_${i}` })));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = async (updatedReleases) => {
    setSaving(true);
    setFeedback('');
    try {
      // Salva como array para preservar ordem
      await setDoc(doc(db, 'siteData', 'som_discography'), { releases: updatedReleases });
      setReleases(updatedReleases);
      setFeedback('Salvo com sucesso!');
      setTimeout(() => setFeedback(''), 3000);
    } catch (e) {
      setFeedback('Erro ao salvar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = (updated) => {
    const exists = releases.find(r => r.id === updated.id);
    const next = exists
      ? releases.map(r => r.id === updated.id ? updated : r)
      : [updated, ...releases];
    setEditing(null);
    persist(next);
  };

  const handleDelete = (id) => {
    if (!confirm('Remover este release?')) return;
    persist(releases.filter(r => r.id !== id));
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    const next = [...releases];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    persist(next);
  };

  const moveDown = (idx) => {
    if (idx === releases.length - 1) return;
    const next = [...releases];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    persist(next);
  };

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">State of Mind</h2>
          <p className="admin-section-sub">Discografia · o primeiro item é o "Latest Release"</p>
        </div>
        <button className="admin-btn-primary" onClick={() => setEditing(EMPTY_RELEASE())}>
          + Novo Release
        </button>
      </div>

      {feedback && (
        <p className={feedback.startsWith('Erro') ? 'admin-error' : 'admin-success'} style={{ marginBottom: 16 }}>
          {feedback}
        </p>
      )}

      {loading && <p className="admin-empty">Carregando...</p>}
      {!loading && releases.length === 0 && (
        <p className="admin-empty">Nenhum release ainda. Adicione o primeiro!</p>
      )}

      <div className="admin-releases">
        {releases.map((release, idx) => (
          <div key={release.id} className="admin-release-card">
            {release.coverUrl
              ? <img src={release.coverUrl} alt={release.title} className="admin-release-cover" />
              : <div className="admin-release-cover" style={{ background: '#222' }} />
            }
            <div className="admin-release-info">
              <div className="admin-release-name">{release.title}</div>
              <div className="admin-release-meta">
                {release.type} · {release.year}
                {idx === 0 && <span style={{ color: '#888', marginLeft: 8 }}>★ Latest</span>}
              </div>
            </div>
            <div className="admin-release-actions">
              <button className="admin-btn-icon" onClick={() => moveUp(idx)} disabled={idx === 0} title="Mover para cima">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 3l-5 6h10L8 3z" />
                </svg>
              </button>
              <button className="admin-btn-icon" onClick={() => moveDown(idx)} disabled={idx === releases.length - 1} title="Mover para baixo">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 13l5-6H3l5 6z" />
                </svg>
              </button>
              <button className="admin-btn-ghost" onClick={() => setEditing(release)}>Editar</button>
              <button className="admin-btn-danger" onClick={() => handleDelete(release.id)}>Remover</button>
            </div>
          </div>
        ))}
      </div>

      {saving && <p className="admin-section-sub" style={{ marginTop: 12 }}>Salvando...</p>}

      {editing && (
        <ReleaseModal
          release={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

// ─── Main Admin ──────────────────────────────────────────────────────────────

function AdminDashboard() {
  const [active, setActive] = useState('som');
  const handleLogout = () => signOut(auth);

  return (
    <div className="admin-wrap">
      <nav className="admin-nav">
        <div className="admin-nav-left">
          <img src="/images/MPM Logo.png" alt="MPM" />
          <span className="admin-nav-title">Admin</span>
        </div>
        <button className="admin-btn-ghost" onClick={handleLogout}>Sair</button>
      </nav>
      <div className="admin-body">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-label">Projetos</div>
          {[{ id: 'som', label: 'State of Mind', icon: '🎵' }].map(p => (
            <div
              key={p.id}
              className={`admin-sidebar-item${active === p.id ? ' active' : ''}`}
              onClick={() => setActive(p.id)}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </div>
          ))}
        </aside>
        <main className="admin-content">
          {active === 'som' && <SomPanel />}
        </main>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return unsub;
  }, []);

  if (user === undefined) return null;
  if (!user) return <AdminLogin />;
  return <AdminDashboard />;
}

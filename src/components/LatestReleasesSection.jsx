import { useState, useEffect, useRef, useCallback } from 'react';
import { useSomReleases } from '../hooks/useSomReleases';
import { useJiveMindReleases } from '../hooks/useJiveMindReleases';
import { useSpotifyReleases } from '../hooks/useSpotifyReleases';
import { usePlayer } from '../context/PlayerContext';
import { isInAppBrowser } from '../utils/browserDetect';
import { loadYTApi } from '../utils/ytApi';
import { useLang } from '../context/LangContext';

const IN_APP = isInAppBrowser();

// ─── Helpers ────────────────────────────────────────────────────────────────

function getVideoId(url) {
  if (!url) return '';
  if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
  return '';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// ─── Extração de itens ───────────────────────────────────────────────────────

function extractItems(releases, artist, project) {
  const items = [];
  releases.forEach(release => {
    if (release.releaseDate) {
      const firstTrack = (release.tracks || [])[0];
      items.push({
        kind: 'release',
        id: `${project}-release-${release.id}`,
        trackId: `lr-${project}-release-${release.id}`,
        releaseDate: release.releaseDate,
        title: release.title,
        typeLabel: release.type,
        coverUrl: release.coverUrl,
        artist, project,
        youtubeUrl: firstTrack?.youtubeUrl || '',
        startSec: firstTrack?.startSec || 0,
        endSec: firstTrack?.endSec || 0,
        subtitle: null,
      });
    }
    (release.tracks || []).forEach((track, idx) => {
      if (!track.releaseDate) return;
      items.push({
        kind: 'track',
        id: `${project}-track-${release.id}-${idx}`,
        trackId: `lr-${project}-track-${release.id}-${idx}`,
        releaseDate: track.releaseDate,
        trackIndex: idx,
        title: track.title || track.name || '',
        typeLabel: 'TRACK',
        coverUrl: release.coverUrl,
        artist, project,
        youtubeUrl: track.youtubeUrl || '',
        startSec: track.startSec || 0,
        endSec: track.endSec || 0,
        subtitle: release.title,
      });
    });
  });
  return items;
}

// ─── Card com player embutido na capa ────────────────────────────────────────

function ReleaseCard({ item, playingId, setPlayingId, setNowPlaying, onActiveChange }) {
  const videoId = getVideoId(item.youtubeUrl);
  const isPlaying = playingId === item.trackId;
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);
  const { setProgress: setGlobalProgress, setIsPaused, isPaused: globalPaused } = usePlayer();
  const duration = (item.endSec - item.startSec) || 30;

  // Sincroniza pausa com o nav
  useEffect(() => {
    if (!isPlaying) return;
    if (globalPaused && !paused) {
      setPaused(true);
      playerRef.current?.pauseVideo?.();
      clearInterval(intervalRef.current);
    } else if (!globalPaused && paused) {
      setPaused(false);
      playerRef.current?.playVideo?.();
      startInterval();
    }
  }, [globalPaused]);

  // Reset quando outro player assume
  useEffect(() => {
    if (!isPlaying) {
      setPaused(false);
      setProgress(0);
      setGlobalProgress(0);
      clearInterval(intervalRef.current);
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
    }
  }, [isPlaying]);

  // Inicia YT.Player quando começa a tocar
  useEffect(() => {
    if (!isPlaying || !videoId) return;
    loadYTApi().then(() => {
      if (!containerRef.current) return;
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = new window.YT.Player(containerRef.current, {
        width: '1', height: '1', videoId,
        playerVars: { autoplay: 1, start: Math.floor(item.startSec), end: Math.floor(item.endSec), controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0 },
        events: {
          onReady: (e) => { e.target.playVideo(); startInterval(); },
          onStateChange: (e) => {
            if (e.data === 0) {
              clearInterval(intervalRef.current);
              setProgress(0);
              setGlobalProgress(0);
              setPlayingId(null);
              setNowPlaying(null);
            }
          },
        },
      });
    });
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, videoId]);

  function startInterval() {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        const next = p + (100 / (duration * 10));
        if (next >= 100) { clearInterval(intervalRef.current); return 100; }
        setGlobalProgress(next);
        return next;
      });
    }, 100);
  }

  const handlePlay = () => {
    if (!isPlaying) {
      setPaused(false);
      setPlayingId(item.trackId);
      setNowPlaying({ title: item.title, artist: item.artist });
      onActiveChange(item.trackId); // novo card ativo
    } else if (paused) {
      setPaused(false);
      setIsPaused(false);
      playerRef.current?.playVideo?.();
      startInterval();
      onActiveChange(item.trackId); // retomou
    } else {
      setPaused(true);
      setIsPaused(true);
      playerRef.current?.pauseVideo?.();
      clearInterval(intervalRef.current);
      onActiveChange(null); // pausou
    }
  };

  const isActivelyPlaying = isPlaying && !paused;

  return (
    <div className={`lr-card${isPlaying ? (paused ? ' lr-card--paused' : ' lr-card--playing') : ''}`}>
      <div className="lr-cover-wrap">
        <img src={item.coverUrl} alt={item.title} className="lr-cover" />
        <span className="lr-type-badge">{item.typeLabel}</span>

        {/* Botão play/pause na capa */}
        {videoId && (
          IN_APP ? (
            <a
              href={item.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="lr-cover-play playing rc-inapp-link"
              onClick={e => e.stopPropagation()}
              title="Abrir no YouTube"
            >
              <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5 3l8 5-8 5V3z" />
              </svg>
            </a>
          ) : (
            <button className={`lr-cover-play${isPlaying ? ' playing' : ''}`} onClick={handlePlay}>
              {isActivelyPlaying ? (
                <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="4" y="3" width="3" height="10" />
                  <rect x="9" y="3" width="3" height="10" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5 3l8 5-8 5V3z" />
                </svg>
              )}
            </button>
          )
        )}

        {/* Timeline no rodapé da capa */}
        {isPlaying && (
          <div className="lr-cover-progress">
            <div className="lr-cover-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* YT Player invisível */}
        <div style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden', pointerEvents: 'none' }}>
          <div ref={containerRef} />
        </div>
      </div>

      <div className="lr-card-bottom">
        <div className="lr-info">
          <span className="lr-artist">{item.artist}</span>
          <span className="lr-track-title">
            {item.kind === 'track' && item.trackIndex != null && (
              <span className="lr-track-number">#{item.trackIndex + 1} </span>
            )}
            {item.title}
          </span>
          <span className="lr-release-context">{item.subtitle || ''}</span>
          <span className="lr-date">{formatDate(item.releaseDate)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export default function LatestReleasesSection() {
  const { releases: somReleases, loading: somLoading } = useSomReleases();
  const { releases: jmReleases, loading: jmLoading } = useJiveMindReleases();
  const { releases: moadbReleases, loading: moadbLoading } = useSpotifyReleases();
  const { playingId, setPlayingId, setNowPlaying } = usePlayer();
  const { t } = useLang();
  const [activeId, setActiveId] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 768
  );

  const loading = somLoading || jmLoading || moadbLoading;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!playingId) setActiveId(null);
  }, [playingId]);

  const allItems = [
    ...extractItems(moadbReleases, 'Mind of a Dead Body', 'moadb'),
    ...extractItems(somReleases, 'State of Mind', 'som'),
    ...extractItems(jmReleases, 'Jive Mind', 'jm'),
  ];

  const sorted = [...allItems].sort((a, b) => {
    if (b.releaseDate > a.releaseDate) return 1;
    if (b.releaseDate < a.releaseDate) return -1;
    // mesma data — ordena por trackIndex (número maior = mais recente = primeiro)
    return (b.trackIndex ?? -1) - (a.trackIndex ?? -1);
  });

  const latest = sorted.slice(0, 8);

  const gridCols = isMobile
    ? undefined
    : latest.map(item => activeId === item.trackId ? '2fr' : '1fr').join(' ');

  const handleActiveChange = (trackId) => {
    setActiveId(trackId);
  };

  // Carrossel mobile — 2 cards por "página"
  const totalSlides = Math.ceil(latest.length / 2);

  const handleScroll = useCallback(() => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    const slide = Math.round(scrollLeft / clientWidth);
    setCurrentSlide(slide);
  }, []);

  const goToSlide = (index) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollTo({
      left: index * carouselRef.current.clientWidth,
      behavior: 'smooth',
    });
  };

  if (loading || latest.length === 0) return null;

  return (
    <section className="lr-section">
      <div className="lr-inner">
        <h2 className="lr-heading">{t.common.latestReleases}</h2>

        {isMobile ? (
          <>
            <div
              className="lr-carousel"
              ref={carouselRef}
              onScroll={handleScroll}
            >
              {Array.from({ length: totalSlides }).map((_, slideIdx) => (
                <div className="lr-carousel-page" key={slideIdx}>
                  {latest.slice(slideIdx * 2, slideIdx * 2 + 2).map(item => (
                    <ReleaseCard
                      key={item.id}
                      item={item}
                      playingId={playingId}
                      setPlayingId={setPlayingId}
                      setNowPlaying={setNowPlaying}
                      onActiveChange={handleActiveChange}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="lr-dots">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  className={`lr-dot${i === currentSlide ? ' lr-dot--active' : ''}`}
                  onClick={() => goToSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        ) : (
          <div
            className="lr-grid"
            style={gridCols ? { gridTemplateColumns: gridCols } : {}}
          >
            {latest.map(item => (
              <ReleaseCard
                key={item.id}
                item={item}
                playingId={playingId}
                setPlayingId={setPlayingId}
                setNowPlaying={setNowPlaying}
                onActiveChange={handleActiveChange}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

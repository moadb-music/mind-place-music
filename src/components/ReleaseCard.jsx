import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { isInAppBrowser } from '../utils/browserDetect';
import { loadYTApi } from '../utils/ytApi';

const IN_APP = isInAppBrowser();

function getVideoId(url) {
  if (!url) return '';
  if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
  return '';
}

function getSocialLinks(release) {
  const links = [];
  if (release.links?.spotify) links.push({ icon: '/images/Spotify.png', url: release.links.spotify, name: 'Spotify' });
  if (release.links?.apple) links.push({ icon: '/images/apple.png', url: release.links.apple, name: 'Apple Music' });
  if (release.links?.youtube) links.push({ icon: '/images/youtube.png', url: release.links.youtube, name: 'YouTube' });
  if (release.links?.ytmusic) links.push({ icon: '/images/yt-music.png', url: release.links.ytmusic, name: 'YouTube Music' });
  if (release.links?.deezer) links.push({ icon: '/images/deezer.png', url: release.links.deezer, name: 'Deezer' });
  return links;
}

// Player por track (verso do card)
function TrackPlayer({ trackId, track, artist, index }) {
  const videoId = getVideoId(track.youtubeUrl);
  const startSec = Math.floor(track.startSec || 0);
  const endSec = Math.floor(track.endSec || 0);
  const duration = (endSec - startSec) || 30;

  const { playingId, setPlayingId, setNowPlaying, setProgress: setGlobalProgress, setIsPaused, isPaused: globalPaused } = usePlayer();

  const isPlaying = playingId === trackId;
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

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

  useEffect(() => {
    if (!isPlaying || !videoId) return;
    loadYTApi().then(() => {
      if (!containerRef.current) return;
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = new window.YT.Player(containerRef.current, {
        width: '1', height: '1', videoId,
        playerVars: { autoplay: 1, start: startSec, end: endSec, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0 },
        events: {
          onReady: (e) => { e.target.playVideo(); startInterval(); },
          onStateChange: (e) => {
            if (e.data === 0) {
              clearInterval(intervalRef.current);
              setProgress(0); setGlobalProgress(0);
              setPlayingId(null); setNowPlaying(null);
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

  const isActivelyPlaying = isPlaying && !paused;

  const handlePlay = (e) => {
    e.stopPropagation();
    if (!videoId) return;
    if (!isPlaying) {
      setPaused(false);
      setPlayingId(trackId);
      setNowPlaying({ title: track.title || track.name, artist });
    } else if (paused) {
      setPaused(false); setIsPaused(false);
      playerRef.current?.playVideo?.(); startInterval();
    } else {
      setPaused(true); setIsPaused(true);
      playerRef.current?.pauseVideo?.(); clearInterval(intervalRef.current);
    }
  };

  return (
    <div
      className={`rc-track-item${isPlaying ? ' rc-track-item--playing' : ''}`}
      onClick={IN_APP ? undefined : handlePlay}
      style={{ cursor: videoId ? 'pointer' : 'default' }}
    >
      <span className="rc-track-index">{String(index + 1).padStart(2, '0')}</span>

      <div className="rc-track-info">
        <span className="rc-track-name">{track.title || track.name}</span>
        {isPlaying && (
          <div className="rc-track-progress">
            <div className="rc-track-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {IN_APP && videoId ? (
        <a
          href={track.youtubeUrl}
          target="_blank"
          rel="noreferrer"
          className="rc-track-play-btn rc-inapp-link"
          onClick={e => e.stopPropagation()}
          title="Abrir no YouTube"
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5 3l8 5-8 5V3z" />
          </svg>
        </a>
      ) : (
        <button className="rc-track-play-btn" tabIndex={-1} disabled={!videoId}>
          {isActivelyPlaying ? (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <rect x="4" y="3" width="3" height="10" />
              <rect x="9" y="3" width="3" height="10" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5 3l8 5-8 5V3z" />
            </svg>
          )}
        </button>
      )}

      <div style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden', pointerEvents: 'none' }}>
        <div ref={containerRef} />
      </div>
    </div>
  );
}

// Card principal com flip
export default function ReleaseCard({ release, trackId, artist, project = '' }) {
  // Normaliza tracks independente do formato que vier do Firebase
  const tracks = Array.isArray(release.tracks)
    ? release.tracks
    : Object.values(release.tracks || {});
  const isMultiTrack = tracks.length > 1;
  const firstTrack = tracks[0];
  const videoId = getVideoId(firstTrack?.youtubeUrl);
  const startSec = Math.floor(firstTrack?.startSec || 0);
  const endSec = Math.floor(firstTrack?.endSec || 0);
  const duration = (endSec - startSec) || 30;

  const { playingId, setPlayingId, setNowPlaying, setProgress: setGlobalProgress, setIsPaused, isPaused: globalPaused } = usePlayer();

  const isPlaying = playingId === trackId;
  const anyTrackPlaying = tracks.some((_, i) => playingId === `${trackId}-track-${i}`);

  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  // Só destaca o card quando está tocando ativamente (não pausado)
  const isActiveCard = (isPlaying && !paused) || (anyTrackPlaying && !globalPaused);

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

  useEffect(() => {
    if (!isPlaying) {
      setPaused(false); setProgress(0); setGlobalProgress(0);
      clearInterval(intervalRef.current);
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || !videoId) return;
    loadYTApi().then(() => {
      if (!containerRef.current) return;
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = new window.YT.Player(containerRef.current, {
        width: '1', height: '1', videoId,
        playerVars: { autoplay: 1, start: startSec, end: endSec, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0 },
        events: {
          onReady: (e) => { e.target.playVideo(); startInterval(); },
          onStateChange: (e) => {
            if (e.data === 0) {
              clearInterval(intervalRef.current);
              setProgress(0); setGlobalProgress(0);
              setPlayingId(null); setNowPlaying(null);
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

  const handlePlay = (e) => {
    e.stopPropagation();
    if (!videoId) return;
    if (!isPlaying) {
      if (isMultiTrack) {
        // Álbum: vira e toca a primeira track
        setFlipped(true);
        setPlayingId(`${trackId}-track-0`);
        setNowPlaying({ title: tracks[0]?.title || tracks[0]?.name || release.title, artist });
      } else {
        // Single: toca normalmente
        setPaused(false);
        setPlayingId(trackId);
        setNowPlaying({ title: release.title, artist });
      }
    } else if (paused) {
      setPaused(false); setIsPaused(false);
      playerRef.current?.playVideo?.(); startInterval();
    } else {
      setPaused(true); setIsPaused(true);
      playerRef.current?.pauseVideo?.(); clearInterval(intervalRef.current);
    }
  };

  // No mobile, play na capa de álbum vai direto para a primeira track do verso
  const handlePlayMobile = (e) => {
    e.stopPropagation();
    if (!isMultiTrack) { handlePlay(e); return; }
    setFlipped(true);
    // Dispara play na primeira track após o flip
    const firstTrackId = `${trackId}-track-0`;
    if (playingId !== firstTrackId) {
      setPlayingId(firstTrackId);
      setNowPlaying({ title: tracks[0]?.title || tracks[0]?.name || release.title, artist });
    }
  };

  const isActivelyPlaying = isPlaying && !paused;

  return (
    <div className={`release-card${isActiveCard ? ' release-card--playing' : ''}`}
      style={isActiveCard && release.bgUrl ? { '--card-bg': `url(${release.bgUrl})` } : {}}
    >

      {/* Flip container */}
      <div className={`rc-flip${flipped ? ' rc-flip--flipped' : ''}`}>

        {/* FRENTE — capa */}
        <div className="rc-flip-front">
          <div className="release-card-cover-wrap">
            <img src={release.coverUrl} alt={release.title} className="release-card-cover" />
            <span className="release-card-type-badge">{release.type}</span>

            {videoId && (
              IN_APP ? (
                <a
                  href={firstTrack?.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="release-card-play-btn rc-inapp-link"
                  onClick={e => e.stopPropagation()}
                  title="Abrir no YouTube"
                >
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5 3l8 5-8 5V3z" />
                  </svg>
                </a>
              ) : (
                <button
                  className={`release-card-play-btn${isActivelyPlaying ? ' playing' : ''}`}
                  onClick={handlePlay}
                >
                  {isActivelyPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="4" y="3" width="3" height="10" />
                      <rect x="9" y="3" width="3" height="10" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M5 3l8 5-8 5V3z" />
                    </svg>
                  )}
                </button>
              )
            )}

            {/* Botão flip — só para álbuns */}
            {isMultiTrack && (
              <button
                className="rc-flip-btn"
                onClick={(e) => { e.stopPropagation(); setFlipped(true); }}
                title="Ver tracklist"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            )}

            <div className="release-card-timeline">
              <div className="release-card-timeline-fill" style={{ width: `${progress}%` }} />
            </div>

            <div style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden', pointerEvents: 'none' }}>
              <div ref={containerRef} />
            </div>
          </div>
        </div>

        {/* VERSO — tracklist */}
        {isMultiTrack && (
          <div
            className={`rc-flip-back${project ? ` rc-flip-back--${project}` : ''}`}
            style={release.bgUrl ? {
              backgroundImage: `url(${release.bgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {}}
          >
            <button
              className="rc-flip-back-close"
              onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
              title="Voltar"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
              <span>{release.title}</span>
            </button>
            <div className="rc-tracks-list">
              {tracks.map((track, i) => (
                <TrackPlayer
                  key={i}
                  index={i}
                  trackId={`${trackId}-track-${i}`}
                  track={track}
                  artist={artist}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info abaixo do card (sempre visível) */}
      <div className="release-card-info">
        <h4 className="release-card-title">{release.title}</h4>
        <div className="release-card-meta">
          <span className="release-card-year">{release.year}</span>
          {isMultiTrack && (
              <button
                className="release-card-track-count"
                onClick={() => setFlipped(true)}
              >
                {tracks.length} tracks
              </button>
            )}
        </div>
        <div className="release-card-links">
          {getSocialLinks(release).map((link, idx) => (
            <a key={idx} href={link.url} target="_blank" rel="noreferrer"
              className="release-card-link" title={link.name}
              onClick={(e) => e.stopPropagation()}>
              <img src={link.icon} alt={link.name} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

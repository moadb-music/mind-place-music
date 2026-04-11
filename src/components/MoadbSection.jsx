import { useSpotifyReleases } from '../hooks/useSpotifyReleases';
import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';

function getVideoId(url) {
  if (!url) return '';
  if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
  return '';
}

function formatTime(sec) {
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function SimplePlayer({ videoId, startSec, endSec, isPlaying, onToggle, onEnd, label }) {
  const duration = (endSec - startSec) || 30;
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const iframeRef = useRef(null);

  // Controla o src do iframe diretamente — evita re-mount e áudio duplicado
  useEffect(() => {
    if (!iframeRef.current) return;
    if (isPlaying) {
      iframeRef.current.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${Math.floor(startSec)}&end=${Math.floor(endSec)}`;
    } else {
      iframeRef.current.src = '';
    }
  }, [isPlaying, videoId, startSec, endSec]);

  useEffect(() => {
    if (isPlaying) {
      setProgress(0);
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(intervalRef.current); if (onEnd) onEnd(); return 0; }
          return p + (100 / (duration * 10));
        });
      }, 100);
    } else {
      clearInterval(intervalRef.current);
      setProgress(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, duration]);

  return (
    <div className="simple-player">
      <div style={{ overflow:'hidden', height:'1px', width:'1px', position:'absolute', pointerEvents:'none', left:'-9999px' }}>
        <iframe ref={iframeRef} width="1" height="1" title="audio" allow="autoplay" />
      </div>
      <div className="simple-player-top">
        <button className="simple-play-btn" onClick={onToggle}>
          {isPlaying ? (
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
        <span className="simple-player-label">{isPlaying && label ? label : 'Preview'}</span>
      </div>
      <div className="simple-player-timeline">
        <div className="simple-player-bar">
          <div className="simple-player-fill" style={{ width: `${progress}%` }} />
          <div className="simple-player-thumb" style={{ left: `${progress}%` }} />
        </div>
        <div className="simple-player-time">
          <span>{formatTime(startSec + (progress / 100) * duration)}</span>
          <span>{formatTime(endSec)}</span>
        </div>
      </div>
    </div>
  );
}

function TrackItem({ track, isPlaying, onPlay }) {
  const videoId = getVideoId(track.youtubeUrl);
  return (
    <div className={`track-item${isPlaying ? ' track-item--playing' : ''}`}>
      <button
        className="audio-play-btn-mini"
        onClick={onPlay}
        disabled={!videoId}
        style={!videoId ? { opacity: 0.2, cursor: 'default' } : {}}
      >
        {isPlaying ? (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <rect x="4" y="3" width="3" height="10" />
            <rect x="9" y="3" width="3" height="10" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5 3l8 5-8 5V3z" />
          </svg>
        )}
      </button>
      <span className="track-name">{track.title || track.name}</span>
    </div>
  );
}

export default function MoadbSection() {
  const { releases, loading } = useSpotifyReleases();
  const { playingId, setPlayingId, setNowPlaying } = usePlayer();
  const ARTIST = 'Mind of a Dead Body';

  const getSocialLinks = (release) => {
    const links = [];
    if (release.links?.spotify) links.push({ icon: '/images/Spotify.png', url: release.links.spotify, name: 'Spotify' });
    if (release.links?.apple) links.push({ icon: '/images/apple.png', url: release.links.apple, name: 'Apple Music' });
    if (release.links?.youtube) links.push({ icon: '/images/youtube.png', url: release.links.youtube, name: 'YouTube' });
    if (release.links?.ytmusic) links.push({ icon: '/images/yt-music.png', url: release.links.ytmusic, name: 'YouTube Music' });
    if (release.links?.deezer) links.push({ icon: '/images/deezer.png', url: release.links.deezer, name: 'Deezer' });
    return links;
  };

  const playTrack = (releaseId, idx, tracks) => {
    if (idx >= tracks.length) { setPlayingId(null); setNowPlaying(null); return; }
    const track = tracks[idx];
    setPlayingId(`${releaseId}-${idx}`);
    setNowPlaying({ title: track.title || track.name, artist: ARTIST });
  };

  return (
    <section id="moadb" className="project-section">
      <div className="project-header">
        <div>
          <img src="/images/Mind of a Dead Body.png" alt="MOADB" className="project-logo" />
          <div className="project-info">
            <span className="project-genre">MODERN METALCORE</span>
            <h2 className="project-name">MIND OF A DEAD BODY</h2>
            <p className="project-bio">
              Where visceral weight meets digital precision. From the Sci-Fi of 'Singularity's Echo' to the cosmic horror of 'Eldritch Awakening', we translate chaos into sound through millimetric layers of technique and soul.
            </p>
            <a href="https://mindofadeadbody.com.br" target="_blank" rel="noreferrer" className="btn-primary">
              VISIT WEBSITE
            </a>
            <div className="social-links">
              <a href="https://www.instagram.com/mindofadeadbody" target="_blank" rel="noreferrer">Instagram</a>
              <a href="https://www.youtube.com/@mindofadeadbody" target="_blank" rel="noreferrer">YouTube</a>
              <a href="https://www.tiktok.com/@mind.of.a.dead.bo" target="_blank" rel="noreferrer">TikTok</a>
            </div>
          </div>
        </div>

        <div className="releases-section">
          <h3 className="section-title">Latest Releases</h3>
          <div className="releases-list">
            {loading && <p className="loading-text">Loading...</p>}
            {!loading && releases.slice(0, 4).map(release => {
              const tracks = release.tracks || [];
              const currentIdx = tracks.findIndex((_, i) => playingId === `${release.id}-${i}`);
              const isAlbumPlaying = currentIdx >= 0;
              const currentTrack = isAlbumPlaying ? tracks[currentIdx] : tracks[0];
              const albumVideoId = getVideoId(currentTrack?.youtubeUrl);
              const albumStart = Math.floor(currentTrack?.startSec || 0);
              const albumEnd = Math.floor(currentTrack?.endSec || 0);

              return (
                <div key={release.id} className="release-item-with-player">
                  <div className={`release-item-header${release.type === 'SINGLE' ? ' release-item-header--single' : ''}`}>

                    {/* Col 1: capa + ícones */}
                    <div className="release-cover-col">
                      <img src={release.coverUrl} alt={release.title} />
                      <div className="release-links">
                        {getSocialLinks(release).map((link, idx) => (
                          <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="release-link-btn" title={link.name}>
                            <img src={link.icon} alt={link.name} />
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Col 2: info + player */}
                    <div className="release-details">
                      <span className="release-type">{release.type}</span>
                      <h4 className="release-title">{release.title}</h4>
                      <p className="release-year">{release.year}</p>

                      {release.type === 'SINGLE' && release.tracks?.[0]?.youtubeUrl && (() => {
                        const track = release.tracks[0];
                        const trackId = `${release.id}-0`;
                        const videoId = getVideoId(track.youtubeUrl);
                        const isPlaying = playingId === trackId;
                        return videoId ? (
                          <SimplePlayer
                            videoId={videoId}
                            startSec={Math.floor(track.startSec || 0)}
                            endSec={Math.floor(track.endSec || 0)}
                            isPlaying={isPlaying}
                            label={release.title}
                            onToggle={() => {
                              if (isPlaying) { setPlayingId(null); setNowPlaying(null); }
                              else { setPlayingId(trackId); setNowPlaying({ title: release.title, artist: ARTIST }); }
                            }}
                          />
                        ) : null;
                      })()}

                      {release.type !== 'SINGLE' && albumVideoId && (
                        <SimplePlayer
                          videoId={albumVideoId}
                          startSec={isAlbumPlaying ? albumStart : Math.floor(tracks[0]?.startSec || 0)}
                          endSec={isAlbumPlaying ? albumEnd : Math.floor(tracks[0]?.endSec || 0)}
                          isPlaying={isAlbumPlaying}
                          label={isAlbumPlaying ? (tracks[currentIdx]?.title || tracks[currentIdx]?.name) : 'Preview'}
                          onToggle={() => {
                            if (isAlbumPlaying) { setPlayingId(null); setNowPlaying(null); }
                            else { playTrack(release.id, 0, tracks); }
                          }}
                          onEnd={() => playTrack(release.id, currentIdx + 1, tracks)}
                        />
                      )}

                      <a
                        href="https://mindofadeadbody.com.br/#discografia"
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, color: '#888', textDecoration: 'none', marginTop: 8, display: 'inline-block', letterSpacing: '0.5px' }}
                      >
                        Ver discografia completa →
                      </a>
                    </div>

                    {/* Col 3: tracklist */}
                    {release.type !== 'SINGLE' && tracks.length > 0 && (
                      <div className="tracks-list-right">
                        <div className="tracks-header">Tracks</div>
                        {tracks.map((track, idx) => {
                          const trackId = `${release.id}-${idx}`;
                          const isPlaying = playingId === trackId;
                          return (
                            <TrackItem
                              key={idx}
                              track={track}
                              isPlaying={isPlaying}
                              onPlay={() => {
                                if (isPlaying) { setPlayingId(null); setNowPlaying(null); }
                                else { setPlayingId(trackId); setNowPlaying({ title: track.title || track.name, artist: ARTIST }); }
                              }}
                            />
                          );
                        })}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

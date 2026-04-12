import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useJiveMindReleases } from '../hooks/useJiveMindReleases';
import { PlayerProvider, usePlayer } from '../context/PlayerContext';
import { useTrackVisit } from '../hooks/useTrackVisit';
import { useTrackExternalClicks } from '../hooks/useTrackExternalClicks';
import '../App.css';
import './JiveMindPage.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── SimplePlayer ────────────────────────────────────────────────────────────

function SimplePlayer({ videoId, startSec, endSec, isPlaying, onToggle, onEnd, label }) {
  const duration = (endSec - startSec) || 30;
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const iframeRef = useRef(null);

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
      <div style={{ overflow: 'hidden', height: '1px', width: '1px', position: 'absolute', pointerEvents: 'none', left: '-9999px' }}>
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

// ─── TrackItem ───────────────────────────────────────────────────────────────

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

// ─── ReleaseCard ─────────────────────────────────────────────────────────────

function getSocialLinks(release) {
  const links = [];
  if (release.links?.spotify) links.push({ icon: '/images/Spotify.png', url: release.links.spotify, name: 'Spotify' });
  if (release.links?.apple) links.push({ icon: '/images/apple.png', url: release.links.apple, name: 'Apple Music' });
  if (release.links?.youtube) links.push({ icon: '/images/youtube.png', url: release.links.youtube, name: 'YouTube' });
  if (release.links?.ytmusic) links.push({ icon: '/images/yt-music.png', url: release.links.ytmusic, name: 'YouTube Music' });
  if (release.links?.deezer) links.push({ icon: '/images/deezer.png', url: release.links.deezer, name: 'Deezer' });
  return links;
}

function ReleaseCard({ release, playingId, setPlayingId, setNowPlaying, ARTIST }) {
  const tracks = release.tracks || [];
  const currentIdx = tracks.findIndex((_, i) => playingId === `${release.id}-${i}`);
  const isAlbumPlaying = currentIdx >= 0;
  const currentTrack = isAlbumPlaying ? tracks[currentIdx] : tracks[0];
  const albumVideoId = getVideoId(currentTrack?.youtubeUrl);
  const albumStart = Math.floor(currentTrack?.startSec || 0);
  const albumEnd = Math.floor(currentTrack?.endSec || 0);

  const playTrack = (idx) => {
    if (idx >= tracks.length) { setPlayingId(null); setNowPlaying(null); return; }
    const track = tracks[idx];
    setPlayingId(`${release.id}-${idx}`);
    setNowPlaying({ title: track.title || track.name, artist: ARTIST });
  };

  return (
    <div className="release-item-with-player">
      <div className={`release-item-header${release.type === 'SINGLE' ? ' release-item-header--single' : ''}`}>
        {/* Col 1: capa + ícones desktop */}
        <div className="release-cover-col">
          <img src={release.coverUrl} alt={release.title} />
          <div className="release-links release-links--desktop">
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
          <div className="release-links release-links--mobile">
            {getSocialLinks(release).map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="release-link-btn" title={link.name}>
                <img src={link.icon} alt={link.name} />
              </a>
            ))}
          </div>

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
                else { playTrack(0); }
              }}
              onEnd={() => playTrack(currentIdx + 1)}
            />
          )}
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
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function JiveMindContent() {
  const { releases, loading } = useJiveMindReleases();
  const { playingId, setPlayingId, nowPlaying, setNowPlaying } = usePlayer();
  const ARTIST = 'Jive Mind';
  useTrackVisit('Jive Mind');
  useTrackExternalClicks();

  const latestRelease = releases[0] || null;
  const discography = releases.slice(1);

  return (
    <div className="jm-page">
      <div className="noise" />

      {/* Nav */}
      <nav className="fixed-nav">
        <Link to="/" className="jm-back-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          MIND PLACE MUSIC
        </Link>

        {nowPlaying && (
          <div className="nav-player">
            <div className="nav-player-info">
              <span className="nav-player-title">{nowPlaying.title}</span>
              <span className="nav-player-artist">{nowPlaying.artist}</span>
            </div>
            <div className="nav-player-bars">
              <span /><span /><span /><span />
            </div>
            <button className="nav-player-stop" onClick={() => { setPlayingId(null); setNowPlaying(null); }} title="Stop">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <rect x="3" y="3" width="10" height="10" />
              </svg>
            </button>
          </div>
        )}

        <div className="nav-links">
          <a href="#latest">LATEST</a>
          <a href="#about">ABOUT</a>
          <a href="#discography">DISCOGRAPHY</a>
        </div>
      </nav>

      {/* ── Hero / Latest Release ── */}
      <section id="latest" className="jm-hero">
        <div className="jm-hero-bg" />
        <div className="jm-hero-content">
          <span className="jm-hero-label">LATEST RELEASE</span>
          {loading && <p className="loading-text">Loading...</p>}
          {!loading && latestRelease && (
            <div className="jm-latest-card">
              <div className="jm-latest-cover-col">
                <img src={latestRelease.coverUrl} alt={latestRelease.title} className="jm-latest-cover" />
                <div className="release-links" style={{ justifyContent: 'center', marginTop: 12 }}>
                  {getSocialLinks(latestRelease).map((link, idx) => (
                    <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="release-link-btn" title={link.name}>
                      <img src={link.icon} alt={link.name} />
                    </a>
                  ))}
                </div>
              </div>
              <div className="jm-latest-info">
                <span className="release-type">{latestRelease.type}</span>
                <h1 className="jm-latest-title">{latestRelease.title}</h1>
                <p className="release-year">{latestRelease.year}</p>
                {latestRelease.tracks?.[0]?.youtubeUrl && (() => {
                  const track = latestRelease.tracks[0];
                  const trackId = `latest-${latestRelease.id}-0`;
                  const videoId = getVideoId(track.youtubeUrl);
                  const isPlaying = playingId === trackId;
                  return videoId ? (
                    <SimplePlayer
                      videoId={videoId}
                      startSec={Math.floor(track.startSec || 0)}
                      endSec={Math.floor(track.endSec || 0)}
                      isPlaying={isPlaying}
                      label={latestRelease.title}
                      onToggle={() => {
                        if (isPlaying) { setPlayingId(null); setNowPlaying(null); }
                        else { setPlayingId(trackId); setNowPlaying({ title: latestRelease.title, artist: ARTIST }); }
                      }}
                    />
                  ) : null;
                })()}
              </div>
            </div>
          )}
          {!loading && !latestRelease && (
            <p className="loading-text">No releases yet.</p>
          )}
        </div>
      </section>

      {/* ── About ── */}
      <div className="jm-divider" />
      <section id="about" className="jm-about">
        <div className="jm-about-inner">
          <img src="/images/jivemind/jive mind logo.png" alt="Jive Mind" className="jm-about-logo" />
          <div className="jm-about-text">
            <span className="project-genre">ELECTRO SWING</span>
            <h2 className="project-name">JIVE MIND</h2>
            <p className="project-bio">
              Where vintage jazz meets modern electronic beats. Jive Mind blends the golden age of swing with contemporary production, creating a sound that's both timeless and irresistibly danceable. Step into a world of brass, beats, and boundless energy.
            </p>
            <div className="social-links">
              <a href="https://www.youtube.com/@JiveMind-ElectroSwing" target="_blank" rel="noreferrer">YouTube</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Discography ── */}
      <div className="jm-divider" />
      <section id="discography" className="jm-discography">
        <div className="jm-discography-inner">
          <h3 className="section-title">Discography</h3>
          {loading && <p className="loading-text">Loading...</p>}
          {!loading && releases.length === 0 && (
            <p className="loading-text">No releases found.</p>
          )}
          <div className="releases-list">
            {releases.map(release => (
              <ReleaseCard
                key={release.id}
                release={release}
                playingId={playingId}
                setPlayingId={setPlayingId}
                setNowPlaying={setNowPlaying}
                ARTIST={ARTIST}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="final-footer">
        <p>© {new Date().getFullYear()} JIVE MIND · MIND PLACE MUSIC</p>
      </footer>
    </div>
  );
}

export default function JiveMindPage() {
  return (
    <PlayerProvider>
      <JiveMindContent />
    </PlayerProvider>
  );
}

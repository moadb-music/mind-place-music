import { Link } from 'react-router-dom';
import { useSomReleases } from '../hooks/useSomReleases';
import { PlayerProvider, usePlayer } from '../context/PlayerContext';
import { useTrackVisit } from '../hooks/useTrackVisit';
import { useTrackExternalClicks } from '../hooks/useTrackExternalClicks';
import { trackClick } from '../hooks/useTrackClick';
import SimplePlayer from '../components/SimplePlayer';
import '../App.css';
import './StateOfMindPage.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getVideoId(url) {
  if (!url) return '';
  if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
  return '';
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

function StateOfMindContent() {
  const { releases, loading } = useSomReleases();
  const { playingId, setPlayingId, nowPlaying, setNowPlaying, isPaused, togglePause, stop, progress } = usePlayer();
  const ARTIST = 'State of Mind';
  useTrackVisit('State of Mind');
  useTrackExternalClicks();

  const latestRelease = releases[0] || null;
  const discography = releases.slice(1);

  return (
    <div className="som-page">
      <div className="noise" />

      {/* Nav */}
      <nav className="fixed-nav">
        <Link to="/" className="som-back-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          MIND PLACE MUSIC
        </Link>

        {nowPlaying && (
          <div className="nav-player">
            {/* Soundwave */}
            <svg width="32" height="18" viewBox="0 0 32 18" className="nav-soundwave" xmlns="http://www.w3.org/2000/svg">
              {[
                { h: 4,  d: 0 },    { h: 10, d: 0.1 },  { h: 7,  d: 0.2 },
                { h: 14, d: 0.05 }, { h: 9,  d: 0.3 },  { h: 16, d: 0.15 },
                { h: 6,  d: 0.25 }, { h: 13, d: 0.08 }, { h: 8,  d: 0.35 },
                { h: 15, d: 0.18 }, { h: 5,  d: 0.28 }, { h: 11, d: 0.12 },
              ].map((bar, i) => (
                <rect
                  key={i}
                  x={i * 2.5}
                  y={(18 - bar.h) / 2}
                  width="1.5"
                  height={bar.h}
                  rx="0.75"
                  fill="rgba(255,255,255,0.5)"
                  style={{
                    transformOrigin: `${i * 2.5 + 0.75}px 9px`,
                    animation: isPaused
                      ? 'none'
                      : `soundBar 0.9s ease-in-out ${bar.d}s infinite alternate`,
                  }}
                />
              ))}
            </svg>

            {/* Info */}
            <div className="nav-player-info">
              <span className="nav-player-title">{nowPlaying.title}</span>
              <span className="nav-player-artist">{nowPlaying.artist}</span>
            </div>

            {/* Timeline */}
            <div className="nav-player-timeline">
              <div className="nav-player-bar">
                <div className="nav-player-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Play/Pause */}
            <button className="nav-player-btn" onClick={togglePause} title={isPaused ? 'Retomar' : 'Pausar'}>
              {isPaused ? (
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5 3l8 5-8 5V3z" />
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="4" y="3" width="3" height="10" />
                  <rect x="9" y="3" width="3" height="10" />
                </svg>
              )}
            </button>

            {/* Stop */}
            <button className="nav-player-btn nav-player-stop" onClick={stop} title="Fechar">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 3l10 10M13 3L3 13" />
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
      <section id="latest" className="som-hero">
        <div className="som-hero-bg" />
        <div className="som-hero-content">
          <span className="som-hero-label">LATEST RELEASE</span>
          {loading && <p className="loading-text">Loading...</p>}
          {!loading && latestRelease && (
            <div className="som-latest-card">
              <div className="som-latest-cover-col">
                <img src={latestRelease.coverUrl} alt={latestRelease.title} className="som-latest-cover" />
                <div className="release-links" style={{ justifyContent: 'center', marginTop: 12 }}>
                  {getSocialLinks(latestRelease).map((link, idx) => (
                    <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="release-link-btn" title={link.name}>
                      <img src={link.icon} alt={link.name} />
                    </a>
                  ))}
                </div>
              </div>
              <div className="som-latest-info">
                <span className="release-type">{latestRelease.type}</span>
                <h1 className="som-latest-title">{latestRelease.title}</h1>
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
      <div className="som-divider" />
      <section id="about" className="som-about">
        <div className="som-about-inner">
          <img src="/images/stateofmind/state of mind logo.png" alt="State of Mind" className="som-about-logo" />
          <div className="som-about-text">
            <span className="project-genre">LO-FI / AMBIENT</span>
            <h2 className="project-name">STATE OF MIND</h2>
            <p className="project-bio">
              Where late-night introspection meets rhythmic serenity. From deep chillhop textures to ambient escapes, State of Mind is your digital sanctuary for focus and calm. Immerse yourself in a twilight atmosphere designed to guide your mind through every study session and coding marathon.
            </p>
            <div className="social-links">
              <a href="https://www.youtube.com/@SoM-Lo-Fi" target="_blank" rel="noreferrer">YouTube</a>
              <a href="https://www.instagram.com/som.lofi" target="_blank" rel="noreferrer">Instagram</a>
              <a href="https://www.tiktok.com/@state.of.mind.lofi" target="_blank" rel="noreferrer">TikTok</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Discography ── */}
      <div className="som-divider" />
      <section id="discography" className="som-discography">
        <div className="som-discography-inner">
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
        <p>© {new Date().getFullYear()} STATE OF MIND · MIND PLACE MUSIC</p>
      </footer>
    </div>
  );
}

export default function StateOfMindPage() {
  return (
    <PlayerProvider>
      <StateOfMindContent />
    </PlayerProvider>
  );
}

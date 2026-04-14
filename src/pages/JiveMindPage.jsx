import { Link } from 'react-router-dom';
import { useJiveMindReleases } from '../hooks/useJiveMindReleases';
import { PlayerProvider, usePlayer } from '../context/PlayerContext';
import { useTrackVisit } from '../hooks/useTrackVisit';
import { useTrackExternalClicks } from '../hooks/useTrackExternalClicks';
import SimplePlayer from '../components/SimplePlayer';
import ReleaseCard from '../components/ReleaseCard';
import '../App.css';
import './JiveMindPage.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── Main Page ───────────────────────────────────────────────────────────────

function JiveMindContent() {
  const { releases, loading } = useJiveMindReleases();
  const { playingId, setPlayingId, nowPlaying, setNowPlaying, isPaused, togglePause, stop, progress } = usePlayer();
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
              <a href="https://www.instagram.com/jivemind.es" target="_blank" rel="noreferrer">Instagram</a>
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
          <div className="releases-list releases-list--jm">
            {releases.map(release => (
              <ReleaseCard
                key={release.id}
                release={release}
                trackId={`jm-disc-${release.id}`}
                artist={ARTIST}
                project="jm"
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

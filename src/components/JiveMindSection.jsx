import { Link } from 'react-router-dom';
import { useJiveMindReleases } from '../hooks/useJiveMindReleases';
import { usePlayer } from '../context/PlayerContext';
import SimplePlayer from './SimplePlayer';

const ARTIST = 'Jive Mind';
const PREFIX = 'jm-mpm';

function getVideoId(url) {
  if (!url) return '';
  if (url.includes('v=')) return url.split('v=')[1].split('&')[0];
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
  return '';
}

function TrackItem({ track, isPlaying, onPlay }) {
  const videoId = getVideoId(track.youtubeUrl);
  return (
    <div className={`track-item${isPlaying ? ' track-item--playing' : ''}`}>
      <button className="audio-play-btn-mini" onClick={onPlay} disabled={!videoId} style={!videoId ? { opacity: 0.2, cursor: 'default' } : {}}>
        {isPlaying ? (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="3" height="10" /><rect x="9" y="3" width="3" height="10" /></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3l8 5-8 5V3z" /></svg>
        )}
      </button>
      <span className="track-name">{track.title || track.name}</span>
    </div>
  );
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

export default function JiveMindSection() {
  const { releases, loading } = useJiveMindReleases();
  const { playingId, setPlayingId, setNowPlaying } = usePlayer();
  const latest = releases[0] || null;

  const tracks = latest?.tracks || [];
  const currentIdx = tracks.findIndex((_, i) => playingId === `${PREFIX}-${i}`);
  const isAlbumPlaying = currentIdx >= 0;
  const currentTrack = isAlbumPlaying ? tracks[currentIdx] : tracks[0];
  const albumVideoId = getVideoId(currentTrack?.youtubeUrl);

  const playTrack = (idx) => {
    if (idx >= tracks.length) { setPlayingId(null); setNowPlaying(null); return; }
    const t = tracks[idx];
    setPlayingId(`${PREFIX}-${idx}`);
    setNowPlaying({ title: t.title || t.name, artist: ARTIST });
  };

  return (
    <section id="jive-mind" className="project-section">
      <div className="project-header">
        <div>
          <img src="/images/jivemind/jive mind logo.png" alt="Jive Mind" className="project-logo" />
          <div className="project-info">
            <span className="project-genre">ELECTRO SWING</span>
            <h2 className="project-name">JIVE MIND</h2>
            <p className="project-bio">
              Where vintage jazz meets modern electronic beats. Jive Mind blends the golden age of swing with contemporary production, creating a sound that's both timeless and irresistibly danceable. Step into a world of brass, beats, and boundless energy.
            </p>
            <a href="/jive-mind#latest" className="btn-primary">EXPLORE JIVE MIND</a>
            <div className="social-links">
              <a href="https://www.youtube.com/@JiveMind-ElectroSwing" target="_blank" rel="noreferrer">YouTube</a>
              <a href="https://www.instagram.com/jivemind.es" target="_blank" rel="noreferrer">Instagram</a>
            </div>
          </div>
        </div>

        <div className="releases-section">
          <h3 className="section-title">Latest Release</h3>
          {loading && <p className="loading-text">Loading...</p>}
          {!loading && !latest && <p className="loading-text" style={{ fontSize: 13 }}>No releases yet.</p>}
          {!loading && latest && (
            <div className="releases-list">
              <div className="release-item-with-player">
                <div className={`release-item-header${latest.type === 'SINGLE' ? ' release-item-header--single' : ''}`}>
                  <div className="release-cover-col">
                    <img src={latest.coverUrl} alt={latest.title} />
                    <div className="release-links release-links--desktop">
                      {getSocialLinks(latest).map((link, i) => (
                        <a key={i} href={link.url} target="_blank" rel="noreferrer" className="release-link-btn" title={link.name}>
                          <img src={link.icon} alt={link.name} />
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="release-details">
                    <span className="release-type">{latest.type}</span>
                    <h4 className="release-title">{latest.title}</h4>
                    <p className="release-year">{latest.year}</p>
                    <div className="release-links release-links--mobile">
                      {getSocialLinks(latest).map((link, i) => (
                        <a key={i} href={link.url} target="_blank" rel="noreferrer" className="release-link-btn" title={link.name}>
                          <img src={link.icon} alt={link.name} />
                        </a>
                      ))}
                    </div>

                    {latest.type === 'SINGLE' && tracks[0]?.youtubeUrl && (() => {
                      const trackId = `${PREFIX}-0`;
                      const videoId = getVideoId(tracks[0].youtubeUrl);
                      const isPlaying = playingId === trackId;
                      return videoId ? (
                        <SimplePlayer
                          videoId={videoId}
                          startSec={Math.floor(tracks[0].startSec || 0)}
                          endSec={Math.floor(tracks[0].endSec || 0)}
                          isPlaying={isPlaying}
                          label={latest.title}
                          onToggle={() => {
                            if (isPlaying) { setPlayingId(null); setNowPlaying(null); }
                            else { setPlayingId(trackId); setNowPlaying({ title: latest.title, artist: ARTIST }); }
                          }}
                        />
                      ) : null;
                    })()}

                    {latest.type !== 'SINGLE' && albumVideoId && (
                      <SimplePlayer
                        videoId={albumVideoId}
                        startSec={isAlbumPlaying ? Math.floor(currentTrack.startSec || 0) : Math.floor(tracks[0]?.startSec || 0)}
                        endSec={isAlbumPlaying ? Math.floor(currentTrack.endSec || 0) : Math.floor(tracks[0]?.endSec || 0)}
                        isPlaying={isAlbumPlaying}
                        label={isAlbumPlaying ? (currentTrack.title || currentTrack.name) : 'Preview'}
                        onToggle={() => {
                          if (isAlbumPlaying) { setPlayingId(null); setNowPlaying(null); }
                          else { playTrack(0); }
                        }}
                        onEnd={() => playTrack(currentIdx + 1)}
                      />
                    )}

                    <Link to="/jive-mind" style={{ fontSize: 12, color: '#888', textDecoration: 'none', marginTop: 8, display: 'inline-block', letterSpacing: '0.5px' }}>
                      Full discography →
                    </Link>
                  </div>

                  {latest.type !== 'SINGLE' && tracks.length > 0 && (
                    <div className="tracks-list-right">
                      <div className="tracks-header">Tracks</div>
                      {tracks.map((t, idx) => {
                        const trackId = `${PREFIX}-${idx}`;
                        const isPlaying = playingId === trackId;
                        return (
                          <TrackItem key={idx} track={t} isPlaying={isPlaying} onPlay={() => {
                            if (isPlaying) { setPlayingId(null); setNowPlaying(null); }
                            else { setPlayingId(trackId); setNowPlaying({ title: t.title || t.name, artist: ARTIST }); }
                          }} />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

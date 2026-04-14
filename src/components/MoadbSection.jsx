import { useSpotifyReleases } from '../hooks/useSpotifyReleases';
import { usePlayer } from '../context/PlayerContext';
import ReleaseCard from './ReleaseCard';

export default function MoadbSection() {
  const { releases, loading } = useSpotifyReleases();
  const ARTIST = 'Mind of a Dead Body';

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
            <a href="https://mindofadeadbody.com.br" target="_blank" rel="noopener" className="btn-primary">
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
          <div className="releases-section-header">
            <h3 className="section-title">Latest Releases</h3>
            <a
              href="https://mindofadeadbody.com.br/#discografia"
              target="_blank"
              rel="noopener"
              className="view-all-link"
            >
              Full discography →
            </a>
          </div>
          {loading && <p className="loading-text">Loading...</p>}
          {!loading && (
            <div className="releases-list">
              {releases.slice(0, 4).map(release => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  trackId={`moadb-${release.id}`}
                  artist={ARTIST}
                  project="moadb"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

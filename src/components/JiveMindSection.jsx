import { Link } from 'react-router-dom';
import { useJiveMindReleases } from '../hooks/useJiveMindReleases';
import ReleaseCard from './ReleaseCard';

const ARTIST = 'Jive Mind';

export default function JiveMindSection() {
  const { releases, loading } = useJiveMindReleases();

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
            <Link to="/jive-mind" className="btn-primary">EXPLORE JIVE MIND</Link>
            <div className="social-links">
              <a href="https://www.youtube.com/@JiveMind-ElectroSwing" target="_blank" rel="noreferrer">YouTube</a>
              <a href="https://www.instagram.com/jivemind.es" target="_blank" rel="noreferrer">Instagram</a>
            </div>
          </div>
        </div>

        <div className="releases-section">
          <div className="releases-section-header">
            <h3 className="section-title">Latest Releases</h3>
            <Link to="/jive-mind" className="view-all-link">
              Full discography →
            </Link>
          </div>
          {loading && <p className="loading-text">Loading...</p>}
          {!loading && releases.length === 0 && <p className="loading-text" style={{ fontSize: 13 }}>No releases yet.</p>}
          {!loading && releases.length > 0 && (
            <div className="releases-list">
              {releases.slice(0, 4).map(release => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  trackId={`jm-${release.id}`}
                  artist={ARTIST}
                  project="jm"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
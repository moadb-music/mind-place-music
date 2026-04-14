import { Link } from 'react-router-dom';
import { useJiveMindReleases } from '../hooks/useJiveMindReleases';
import ReleaseCard from './ReleaseCard';
import MobileCarousel from './MobileCarousel';
import { useIsMobile } from '../hooks/useIsMobile';
import { useLang } from '../context/LangContext';

const ARTIST = 'Jive Mind';

export default function JiveMindSection() {
  const { releases, loading } = useJiveMindReleases();
  const isMobile = useIsMobile();
  const { t } = useLang();

  return (
    <section id="jive-mind" className="project-section">
      <div className="project-header">
        <div>
          <img src="/images/jivemind/jive mind logo.png" alt="Jive Mind" className="project-logo" />
          <div className="project-info">
            <span className="project-genre">{t.jm.genre}</span>
            <h2 className="project-name">JIVE MIND</h2>
            <p className="project-bio">{t.jm.bio}</p>
            <Link to="/jive-mind" className="btn-primary">{t.jm.explore}</Link>
            <div className="social-links">
              <a href="https://www.youtube.com/@JiveMind-ElectroSwing" target="_blank" rel="noreferrer">YouTube</a>
              <a href="https://www.instagram.com/jivemind.es" target="_blank" rel="noreferrer">Instagram</a>
            </div>
          </div>
        </div>

        <div className="releases-section">
          <div className="releases-section-header">
            <h3 className="section-title">{t.common.latestReleases}</h3>
            <Link to="/jive-mind" className="view-all-link">{t.common.fullDiscography}</Link>
          </div>
          {loading && <p className="loading-text">{t.common.loading}</p>}
          {!loading && releases.length === 0 && <p className="loading-text" style={{ fontSize: 13 }}>{t.common.noReleases}</p>}
          {!loading && releases.length > 0 && (
            isMobile ? (
              <MobileCarousel>
                {releases.slice(0, 4).map(release => (
                  <ReleaseCard
                    key={release.id}
                    release={release}
                    trackId={`jm-${release.id}`}
                    artist={ARTIST}
                    project="jm"
                  />
                ))}
              </MobileCarousel>
            ) : (
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
            )
          )}
        </div>
      </div>
    </section>
  );
}
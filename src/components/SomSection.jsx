import { Link } from 'react-router-dom';
import { useSomReleases } from '../hooks/useSomReleases';
import ReleaseCard from './ReleaseCard';
import MobileCarousel from './MobileCarousel';
import { useIsMobile } from '../hooks/useIsMobile';
import { useLang } from '../context/LangContext';

const ARTIST = 'State of Mind';

function shortTitle(title) {
  const idx = title.indexOf(':');
  return idx !== -1 ? title.slice(idx + 1).trim() : title;
}

export default function SomSection() {
  const { releases, loading } = useSomReleases();
  const isMobile = useIsMobile();
  const { t } = useLang();

  return (
    <section id="som" className="project-section">
      <div className="project-header">
        <div>
          <img src="/images/stateofmind/state of mind logo.png" alt="State of Mind" className="project-logo" />
          <div className="project-info">
            <span className="project-genre">{t.som.genre}</span>
            <h2 className="project-name">STATE OF MIND</h2>
            <p className="project-bio">{t.som.bio}</p>
            <Link to="/state-of-mind" className="btn-primary">{t.som.explore}</Link>
            <div className="social-links">
              <a href="https://www.youtube.com/@SoM-Lo-Fi" target="_blank" rel="noreferrer">YouTube</a>
              <a href="https://www.instagram.com/som.lofi" target="_blank" rel="noreferrer">Instagram</a>
              <a href="https://www.tiktok.com/@state.of.mind.lofi" target="_blank" rel="noreferrer">TikTok</a>
            </div>
          </div>
        </div>

        <div className="releases-section">
          <div className="releases-section-header">
            <h3 className="section-title">{t.common.latestReleases}</h3>
            <Link to="/state-of-mind" className="view-all-link">{t.common.fullDiscography}</Link>
          </div>
          {loading && <p className="loading-text">{t.common.loading}</p>}
          {!loading && releases.length === 0 && <p className="loading-text" style={{ fontSize: 13 }}>{t.common.noReleases}</p>}
          {!loading && releases.length > 0 && (
            isMobile ? (
              <MobileCarousel>
                {releases.slice(0, 4).map(release => (
                  <ReleaseCard
                    key={release.id}
                    release={{ ...release, title: shortTitle(release.title) }}
                    trackId={`som-${release.id}`}
                    artist={ARTIST}
                    project="som"
                  />
                ))}
              </MobileCarousel>
            ) : (
              <div className="releases-list">
                {releases.slice(0, 4).map(release => (
                  <ReleaseCard
                    key={release.id}
                    release={{ ...release, title: shortTitle(release.title) }}
                    trackId={`som-${release.id}`}
                    artist={ARTIST}
                    project="som"
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

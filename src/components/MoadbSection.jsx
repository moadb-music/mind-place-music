import { useSpotifyReleases } from '../hooks/useSpotifyReleases';
import { usePlayer } from '../context/PlayerContext';
import ReleaseCard from './ReleaseCard';
import MobileCarousel from './MobileCarousel';
import { useIsMobile } from '../hooks/useIsMobile';
import { useLang } from '../context/LangContext';

export default function MoadbSection() {
  const { releases, loading } = useSpotifyReleases();
  const isMobile = useIsMobile();
  const { t } = useLang();
  const ARTIST = 'Mind of a Dead Body';

  return (
    <section id="moadb" className="project-section">
      <div className="project-header">
        <div>
          <img src="/images/Mind of a Dead Body.png" alt="MOADB" className="project-logo" />
          <div className="project-info">
            <span className="project-genre">{t.moadb.genre}</span>
            <h2 className="project-name">MIND OF A DEAD BODY</h2>
            <p className="project-bio">{t.moadb.bio}</p>
            <a href="https://mindofadeadbody.com.br" target="_blank" rel="noopener" className="btn-primary">
              {t.moadb.visitWebsite}
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
            <h3 className="section-title">{t.common.latestReleases}</h3>
            <a href="https://mindofadeadbody.com.br/#discografia" target="_blank" rel="noopener" className="view-all-link">
              {t.common.fullDiscography}
            </a>
          </div>
          {loading && <p className="loading-text">{t.common.loading}</p>}
          {!loading && (
            isMobile ? (
              <MobileCarousel>
                {releases.slice(0, 4).map(release => (
                  <ReleaseCard
                    key={release.id}
                    release={release}
                    trackId={`moadb-${release.id}`}
                    artist={ARTIST}
                    project="moadb"
                  />
                ))}
              </MobileCarousel>
            ) : (
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
            )
          )}
        </div>
      </div>
    </section>
  );
}

import { useSpotifyReleases } from '../hooks/useSpotifyReleases';

export default function MoadbSection() {
  const { releases, loading } = useSpotifyReleases();

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
            {!loading && releases.slice(0, 4).map(release => (
              <a key={release.id} href={release.links?.spotify} target="_blank" rel="noreferrer" className="release-item">
                <img src={release.coverUrl} alt={release.title} />
                <div className="release-details">
                  <span className="release-type">{release.type}</span>
                  <h4 className="release-title">{release.title}</h4>
                  <p className="release-year">{release.year}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

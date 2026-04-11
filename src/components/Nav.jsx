import { usePlayer } from '../context/PlayerContext';
import { Link } from 'react-router-dom';

export default function Nav() {
  const { nowPlaying, setPlayingId, setNowPlaying } = usePlayer();

  const handleStop = () => {
    setPlayingId(null);
    setNowPlaying(null);
  };

  return (
    <nav className="fixed-nav">
      <img src="/images/MPM Logo.png" alt="MPM" className="nav-logo" />

      {nowPlaying && (
        <div className="nav-player">
          <div className="nav-player-info">
            <span className="nav-player-title">{nowPlaying.title}</span>
            <span className="nav-player-artist">{nowPlaying.artist}</span>
          </div>
          <div className="nav-player-bars">
            <span /><span /><span /><span />
          </div>
          <button className="nav-player-stop" onClick={handleStop} title="Stop">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="3" width="10" height="10" />
            </svg>
          </button>
        </div>
      )}

      <div className="nav-links">
        <a href="#moadb">MOADB</a>
        <Link to="/state-of-mind">STATE OF MIND</Link>
      </div>
    </nav>
  );
}

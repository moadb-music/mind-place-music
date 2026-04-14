import { usePlayer } from '../context/PlayerContext';
import { useLang } from '../context/LangContext';
import LangSwitcher from './LangSwitcher';

function Soundwave({ isPaused }) {
  const bars = [
    { h: 4,  d: 0 },    { h: 10, d: 0.1 },  { h: 7,  d: 0.2 },
    { h: 14, d: 0.05 }, { h: 9,  d: 0.3 },  { h: 16, d: 0.15 },
    { h: 6,  d: 0.25 }, { h: 13, d: 0.08 }, { h: 8,  d: 0.35 },
    { h: 15, d: 0.18 }, { h: 5,  d: 0.28 }, { h: 11, d: 0.12 },
  ];
  return (
    <svg width="32" height="18" viewBox="0 0 32 18" className="nav-soundwave" xmlns="http://www.w3.org/2000/svg">
      {bars.map((bar, i) => (
        <rect key={i} x={i * 2.5} y={(18 - bar.h) / 2} width="1.5" height={bar.h} rx="0.75"
          fill="rgba(255,255,255,0.5)"
          style={{
            transformOrigin: `${i * 2.5 + 0.75}px 9px`,
            animation: isPaused ? 'none' : `soundBar 0.9s ease-in-out ${bar.d}s infinite alternate`,
          }}
        />
      ))}
    </svg>
  );
}

export default function Nav() {
  const { nowPlaying, isPaused, togglePause, stop, progress } = usePlayer();
  const { t } = useLang();

  return (
    <nav className="fixed-nav">
      <img src="/images/MPM Logo.png" alt="MPM" className="nav-logo" />

      {nowPlaying && (
        <div className="nav-player">
          <Soundwave isPaused={isPaused} />
          <div className="nav-player-info">
            <span className="nav-player-title">{nowPlaying.title}</span>
            <span className="nav-player-artist">{nowPlaying.artist}</span>
          </div>
          <div className="nav-player-timeline">
            <div className="nav-player-bar">
              <div className="nav-player-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button className="nav-player-btn" onClick={togglePause} title={isPaused ? t.nav.resume : t.nav.pause}>
            {isPaused ? (
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3l8 5-8 5V3z" /></svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="3" height="10" /><rect x="9" y="3" width="3" height="10" /></svg>
            )}
          </button>
          <button className="nav-player-btn nav-player-stop" onClick={stop} title={t.nav.close}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>
      )}

      <div className="nav-right">
        <div className="nav-links">
          <a href="#moadb">{t.nav.moadb}</a>
          <a href="#som">{t.nav.som}</a>
          <a href="#jive-mind">{t.nav.jm}</a>
        </div>
        <LangSwitcher />
      </div>
    </nav>
  );
}

import { useState, useEffect } from 'react';

const BG_URL = '/images/hero-bg.jpg';

export default function Hero() {
  const [hasBg, setHasBg] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setHasBg(true);
    img.onerror = () => setHasBg(false);
    img.src = BG_URL;
  }, []);

  const bgStyle = hasBg ? {
    backgroundImage: `url(${BG_URL})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

  return (
    <section className="hero-fullscreen" style={bgStyle}>
      {hasBg && <div className="hero-bg-overlay" />}
      <div className="hero-main-title">
        <h1 className="outline-text">MIND PLACE</h1>
        <h1 className="filled-text">MUSIC</h1>
      </div>
      <p className="hero-sub">ARCHITECTURAL SOUNDSCAPES // 2026</p>
      <p className="hero-tagline">EXPLORE VIBRATIONS</p>
    </section>
  );
}

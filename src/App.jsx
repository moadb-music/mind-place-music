import './App.css';
import Nav from './components/Nav';
import Hero from './components/Hero';
import LatestReleasesSection from './components/LatestReleasesSection';
import MoadbSection from './components/MoadbSection';
import SomSection from './components/SomSection';
import JiveMindSection from './components/JiveMindSection';
import Footer from './components/Footer';
import SectionDivider from './components/SectionDivider';
import { PlayerProvider } from './context/PlayerContext';
import { useTrackVisit } from './hooks/useTrackVisit';
import { useTrackExternalClicks } from './hooks/useTrackExternalClicks';

export default function App() {
  useTrackVisit('Home');
  useTrackExternalClicks();
  return (
    <PlayerProvider>
      <div className="noise"></div>
      <Nav />
      <Hero />
      <SectionDivider />
      <LatestReleasesSection />
      <SectionDivider />
      <MoadbSection />
      <SectionDivider />
      <SomSection />
      <SectionDivider />
      <JiveMindSection />
      <Footer />
    </PlayerProvider>
  );
}

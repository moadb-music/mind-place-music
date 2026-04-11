import './App.css';
import Nav from './components/Nav';
import Hero from './components/Hero';
import MoadbSection from './components/MoadbSection';
import SomSection from './components/SomSection';
import Footer from './components/Footer';
import { PlayerProvider } from './context/PlayerContext';
import { useTrackVisit } from './hooks/useTrackVisit';

export default function App() {
  useTrackVisit('Home');
  return (
    <PlayerProvider>
      <div className="noise"></div>
      <Nav />
      <Hero />
      <MoadbSection />
      <SomSection />
      <Footer />
    </PlayerProvider>
  );
}

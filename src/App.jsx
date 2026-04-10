import './App.css';
import Nav from './components/Nav';
import Hero from './components/Hero';
import MoadbSection from './components/MoadbSection';
import SomSection from './components/SomSection';
import Footer from './components/Footer';

export default function App() {
  return (
    <>
      <div className="noise"></div>
      <Nav />
      <Hero />
      <MoadbSection />
      <SomSection />
      <Footer />
    </>
  );
}

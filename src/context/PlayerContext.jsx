import { createContext, useContext, useState } from 'react';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [playingId, setPlayingId] = useState(null);
  const [nowPlaying, setNowPlaying] = useState(null); // { title, artist }
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100

  // Ao mudar de faixa, reseta pausa e progresso
  const handleSetPlayingId = (id) => {
    setPlayingId(id);
    if (id) setIsPaused(false);
    setProgress(0);
  };

  const togglePause = () => setIsPaused(p => !p);

  const stop = () => {
    handleSetPlayingId(null);
    setNowPlaying(null);
    setIsPaused(false);
    setProgress(0);
  };

  return (
    <PlayerContext.Provider value={{
      playingId,
      setPlayingId: handleSetPlayingId,
      nowPlaying,
      setNowPlaying,
      isPaused,
      setIsPaused,
      togglePause,
      progress,
      setProgress,
      stop,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}

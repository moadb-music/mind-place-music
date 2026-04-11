import { createContext, useContext, useState } from 'react';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [playingId, setPlayingId] = useState(null);
  const [nowPlaying, setNowPlaying] = useState(null); // { title, artist }

  return (
    <PlayerContext.Provider value={{ playingId, setPlayingId, nowPlaying, setNowPlaying }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}

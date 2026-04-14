import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';

function formatTime(sec) {
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Carrega o script da YouTube IFrame API uma única vez
let ytApiReady = false;
let ytApiCallbacks = [];

function loadYTApi() {
  if (ytApiReady) return Promise.resolve();
  return new Promise(resolve => {
    ytApiCallbacks.push(resolve);
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => {
        ytApiReady = true;
        ytApiCallbacks.forEach(cb => cb());
        ytApiCallbacks = [];
      };
    }
  });
}

export default function SimplePlayer({ videoId, startSec, endSec, isPlaying, onToggle, onEnd, label }) {
  const duration = (endSec - startSec) || 30;
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);
  const playerRef = useRef(null); // YT.Player instance
  const { setProgress: setGlobalProgress, setIsPaused, isPaused: globalPaused } = usePlayer();

  // Sincroniza pausa local com o botão do nav
  useEffect(() => {
    if (!isPlaying) return;
    if (globalPaused && !paused) {
      setPaused(true);
      playerRef.current?.pauseVideo?.();
      clearInterval(intervalRef.current);
    } else if (!globalPaused && paused) {
      setPaused(false);
      playerRef.current?.playVideo?.();
      startInterval();
    }
  }, [globalPaused]);

  // Reset quando outro player assume
  useEffect(() => {
    if (!isPlaying) {
      setPaused(false);
      setIsPaused(false);
      setProgress(0);
      setGlobalProgress(0);
      clearInterval(intervalRef.current);
      playerRef.current?.stopVideo?.();
    }
  }, [isPlaying]);

  // Inicializa/destrói o YT.Player quando começa a tocar
  useEffect(() => {
    if (!isPlaying) return;

    loadYTApi().then(() => {
      if (!containerRef.current) return;

      // Destrói player anterior se existir
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        width: '1',
        height: '1',
        videoId,
        playerVars: {
          autoplay: 1,
          start: Math.floor(startSec),
          end: Math.floor(endSec),
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (e) => {
            e.target.playVideo();
            startInterval();
          },
          onStateChange: (e) => {
            // YT.PlayerState.ENDED = 0
            if (e.data === 0) {
              clearInterval(intervalRef.current);
              setProgress(0);
              setGlobalProgress(0);
              if (onEnd) onEnd();
            }
          },
        },
      });
    });

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [isPlaying, videoId, startSec, endSec]);

  function startInterval() {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        const next = p + (100 / (duration * 10));
        if (next >= 100) {
          clearInterval(intervalRef.current);
          return 100;
        }
        setGlobalProgress(next);
        return next;
      });
    }, 100);
  }

  const handleClick = () => {
    if (!isPlaying) {
      // Inicia
      setPaused(false);
      onToggle();
    } else if (paused) {
      // Retoma
      setPaused(false);
      setIsPaused(false);
      playerRef.current?.playVideo?.();
      startInterval();
    } else {
      // Pausa
      setPaused(true);
      setIsPaused(true);
      playerRef.current?.pauseVideo?.();
      clearInterval(intervalRef.current);
    }
  };

  const isActivelyPlaying = isPlaying && !paused;

  return (
    <div className="simple-player">
      {/* Container do YT.Player — invisível */}
      <div style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden', pointerEvents: 'none' }}>
        <div ref={containerRef} />
      </div>

      <div className="simple-player-top">
        <button className="simple-play-btn" onClick={handleClick}>
          {isActivelyPlaying ? (
            <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
              <rect x="4" y="3" width="3" height="10" />
              <rect x="9" y="3" width="3" height="10" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5 3l8 5-8 5V3z" />
            </svg>
          )}
        </button>
        <span className="simple-player-label">{isActivelyPlaying && label ? label : 'Preview'}</span>
      </div>

      <div className="simple-player-timeline">
        <div className="simple-player-bar">
          <div className="simple-player-fill" style={{ width: `${progress}%` }} />
          <div className="simple-player-thumb" style={{ left: `${progress}%` }} />
        </div>
        <div className="simple-player-time">
          <span>{formatTime(startSec + (progress / 100) * duration)}</span>
          <span>{formatTime(endSec)}</span>
        </div>
      </div>
    </div>
  );
}

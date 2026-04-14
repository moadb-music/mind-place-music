/**
 * Singleton loader for YouTube IFrame API.
 * Shared across all components to avoid duplicate script injection
 * and conflicting onYouTubeIframeAPIReady callbacks.
 */
let ytApiReady = false;
let ytApiCallbacks = [];

export function loadYTApi() {
  if (ytApiReady) return Promise.resolve();
  return new Promise(resolve => {
    ytApiCallbacks.push(resolve);
    if (!window.YT && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    window.onYouTubeIframeAPIReady = () => {
      ytApiReady = true;
      ytApiCallbacks.forEach(cb => cb());
      ytApiCallbacks = [];
    };
  });
}

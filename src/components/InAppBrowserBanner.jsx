import { useState } from 'react';
import { isInAppBrowser, isAndroid, isIOS } from '../utils/browserDetect';
import { useLang } from '../context/LangContext';

function openInExternalBrowser() {
  const url = window.location.href;

  if (isAndroid()) {
    // Android: intent:// força abertura no browser padrão
    const intentUrl = url
      .replace('https://', 'intent://')
      .replace('http://', 'intent://');
    window.location.href = intentUrl + '#Intent;scheme=https;action=android.intent.action.VIEW;end';
    return;
  }

  if (isIOS()) {
    // iOS: não há forma programática — mostrar instruções
    return 'show-instructions';
  }

  // Fallback
  window.open(url, '_blank');
}

export default function InAppBrowserBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const { t, lang } = useLang();

  if (!isInAppBrowser() || dismissed) return null;

  const handleOpen = () => {
    const result = openInExternalBrowser();
    if (result === 'show-instructions') {
      setShowInstructions(true);
    }
  };

  const instructions = lang === 'pt'
    ? 'Toca nos 3 pontos (⋯) ou no ícone de partilha e escolhe "Abrir no browser"'
    : 'Tap the 3 dots (⋯) or share icon and choose "Open in browser"';

  return (
    <div className="inapp-banner">
      <div className="inapp-banner-content">
        <span className="inapp-banner-icon">🎵</span>
        <div className="inapp-banner-text">
          {showInstructions ? (
            <span className="inapp-instructions">{instructions}</span>
          ) : (
            <>
              <strong>{t.inapp.title}</strong>
              <span>{t.inapp.desc}</span>
            </>
          )}
        </div>
        {!showInstructions && (
          <button className="inapp-banner-open" onClick={handleOpen}>
            {t.inapp.open}
          </button>
        )}
        <button className="inapp-banner-close" onClick={() => setDismissed(true)} aria-label={t.nav.close}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /Instagram/i.test(ua) ||
    /FBAN|FBAV/i.test(ua) ||
    /TikTok|musical_ly/i.test(ua) ||
    /Twitter/i.test(ua) ||
    /LinkedInApp/i.test(ua) ||
    /Snapchat/i.test(ua) ||
    /Line\//i.test(ua) ||
    /KAKAOTALK/i.test(ua) ||
    /MicroMessenger/i.test(ua)
  );
}

export function isAndroid() {
  return /Android/i.test(navigator.userAgent || '');
}

export function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

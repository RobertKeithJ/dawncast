export function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isWebKit = /WebKit/.test(ua);
  const isInAppBrowser = /CriOS|FxiOS|EdgiOS|GSA|FBAN|FBAV/.test(ua);
  return isIOS && isWebKit && !isInAppBrowser;
}

export function isStandalone(): boolean {
  return (
    (navigator as { standalone?: boolean }).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export function isInAppBrowser(): boolean {
  const ua = navigator.userAgent;
  return /CriOS|FxiOS|EdgiOS|GSA|FBAN|FBAV/.test(ua);
}

export function shouldShowIOSHint(): boolean {
  try {
    if (sessionStorage.getItem("dawncast_ios_hint_shown_session")) return false;
    if (localStorage.getItem("dawncast_install_dismissed_permanent")) return false;
  } catch {
    return false;
  }
  if (!isIOSSafari()) return false;
  if (isStandalone()) return false;
  return true;
}

export function shouldShowIOSOpenInSafari(): boolean {
  if (!isIOSSafari()) return false;
  if (isStandalone()) return false;
  return isInAppBrowser();
}
import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [lastDismissTime, setLastDismissTime] = useState(0);

  useEffect(() => {
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isInWebAppiOS = (window.navigator as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    const checkIfMobile = () => {
      const mobile = window.matchMedia("(max-width: 768px)").matches;
      setIsMobile(mobile);
    };

    checkIfInstalled();
    checkIfMobile();

    const installedHandler = () => setIsInstalled(true);
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", installedHandler);

    return () => mediaQuery.removeEventListener("change", installedHandler);
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const dismissTime = localStorage.getItem("pwa-install-dismissed-time");
    if (dismissed && dismissTime) {
      setIsDismissed(true);
      setLastDismissTime(parseInt(dismissTime, 10));
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const checkInstallability = async () => {
      if (mounted && !deferredPrompt && !isInstalled) {
if (window.matchMedia("(display-mode: browser)").matches) {
        const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
          if (manifestLink) {
            try {
              const response = await fetch(manifestLink.href);
              if (response.ok) {
                const manifest = await response.json();
                const hasIcons = manifest.icons && manifest.icons.length > 0;
                const hasName = manifest.name || manifest.short_name;
                if (hasIcons && hasName && !isInstalled && !isDismissed) {
                  setShowPrompt(true);
                  setIsDismissed(false);
                }
              }
            } catch {
            }
          }
        }
      }
    };

    const interval = setInterval(checkInstallability, 2000);
    setTimeout(checkInstallability, 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [deferredPrompt, isInstalled, isDismissed]);

  useEffect(() => {
    if (deferredPrompt && !isInstalled) {
      setShowPrompt(true);
      setIsDismissed(false);
    }
  }, [deferredPrompt, isInstalled]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && deferredPrompt && !isInstalled) {
        const now = Date.now();
        if (lastDismissTime && now - lastDismissTime < 30 * 60 * 1000) {
          return;
        }
        setShowPrompt(true);
        setIsDismissed(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [deferredPrompt, isInstalled, lastDismissTime]);

  const canInstall = showPrompt;

  const install = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else if (outcome === "dismissed") {
      setIsDismissed(true);
      setShowPrompt(false);
      localStorage.setItem("pwa-install-dismissed", "true");
      localStorage.setItem("pwa-install-dismissed-time", Date.now().toString());
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
    localStorage.setItem("pwa-install-dismissed-time", Date.now().toString());
  }, []);

  const reset = useCallback(() => {
    setIsDismissed(false);
    setShowPrompt(false);
    localStorage.removeItem("pwa-install-dismissed");
    localStorage.removeItem("pwa-install-dismissed-time");
  }, []);

  return {
    canInstall,
    isInstalled,
    isMobile,
    install,
    dismiss,
    reset,
  };
}
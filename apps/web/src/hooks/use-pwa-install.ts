import { useState, useEffect, useCallback, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const SNOOZE_KEY = "dawncast_install_snoozed_until";
const PERMANENT_KEY = "dawncast_install_dismissed_permanent";
const DISMISS_COUNT_KEY = "dawncast_install_dismiss_count";
const IOS_HINT_KEY = "dawncast_ios_hint_shown";
const SNOOZE_DURATION_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_DISMISS_COUNT = 3;

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const hasShownToast = useRef(false);

  const checkSnoozed = useCallback(() => {
    try {
      if (localStorage.getItem(PERMANENT_KEY) === "true") return true;
      const snoozeUntil = localStorage.getItem(SNOOZE_KEY);
      if (snoozeUntil) {
        const expires = parseInt(snoozeUntil, 10);
        if (Date.now() < expires) return true;
        localStorage.removeItem(SNOOZE_KEY);
      }
    } catch (_err) {
      return false;
    }
    return false;
  }, []);

  const checkDismissCount = useCallback(() => {
    try {
      const raw = localStorage.getItem(DISMISS_COUNT_KEY);
      return raw ? parseInt(raw, 10) : 0;
    } catch (_err) {
      return 0;
    }
  }, []);

  useEffect(() => {
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isInWebAppiOS = (window.navigator as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkIfInstalled();

    const installedHandler = () => setIsInstalled(true);
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", installedHandler);

    return () => mediaQuery.removeEventListener("change", installedHandler);
  }, []);

  useEffect(() => {
    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIos) {
      try {
        if (sessionStorage.getItem(IOS_HINT_KEY) !== "true") {
          setShowIosHint(true);
          sessionStorage.setItem(IOS_HINT_KEY, "true");
        }
      } catch (_err) { /* sessionStorage blocked */ }
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
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsInstalled(true);
      try {
        localStorage.setItem(PERMANENT_KEY, "true");
      } catch (_err) { /* localStorage blocked */ }
    };

    window.addEventListener("appinstalled", handleAppInstalled);
    return () => window.removeEventListener("appinstalled", handleAppInstalled);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
    hasShownToast.current = true;
    return outcome;
  }, [deferredPrompt]);

  const dismiss = useCallback(
    (writeDeferral = true) => {
      setDeferredPrompt(null);
      setCanInstall(false);
      hasShownToast.current = true;
      if (!writeDeferral) return;

      try {
        const count = checkDismissCount() + 1;
        if (count >= MAX_DISMISS_COUNT) {
          localStorage.setItem(PERMANENT_KEY, "true");
          localStorage.removeItem(DISMISS_COUNT_KEY);
          localStorage.removeItem(SNOOZE_KEY);
        } else {
          localStorage.setItem(DISMISS_COUNT_KEY, count.toString());
          localStorage.setItem(SNOOZE_KEY, (Date.now() + SNOOZE_DURATION_MS).toString());
        }
      } catch (_err) { /* localStorage blocked */ }
    },
    [checkDismissCount]
  );

  const trigger = useCallback(
    (delay = 1500) => {
      if (!deferredPrompt || isInstalled || checkSnoozed() || hasShownToast.current) {
        return;
      }
      setTimeout(() => {
        if (!hasShownToast.current) {
          setCanInstall(true);
        }
      }, delay);
    },
    [deferredPrompt, isInstalled, checkSnoozed]
  );

  return {
    canInstall,
    isInstalled,
    install,
    dismiss,
    trigger,
    showIosHint,
  };
}
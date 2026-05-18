import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  isIOSSafari,
  isStandalone,
  shouldShowIOSHint,
  shouldShowIOSOpenInSafari,
} from "@/lib/install-utils";

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
const IOS_HINT_SESSION_KEY = "dawncast_ios_hint_shown_session";
const POST_INSTALL_TOAST_ID = "pwa-installed-toast";

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [showOpenInSafari, setShowOpenInSafari] = useState(false);
  const hasShownToast = useRef(false);

  useEffect(() => {
    setIsInstalled(isStandalone());
    const installedHandler = () => setIsInstalled(true);
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", installedHandler);
    return () => mediaQuery.removeEventListener("change", installedHandler);
  }, []);

  useEffect(() => {
    const isIos = isIOSSafari();
    const canShowHint = shouldShowIOSHint();
    const canShowOpenInSafari = shouldShowIOSOpenInSafari();

    if (canShowOpenInSafari) {
      setShowOpenInSafari(true);
      return;
    }

    if (isIos && canShowHint) {
      setShowIosHint(true);
      try {
        sessionStorage.setItem(IOS_HINT_SESSION_KEY, "true");
      } catch {
        /* blocked */
      }
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
      } catch {
        /* blocked */
      }
      toast.success("Dawncast added to your home screen", {
        id: POST_INSTALL_TOAST_ID,
        duration: 4000,
      });
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

  const dismiss = useCallback(() => {
    setDeferredPrompt(null);
    setCanInstall(false);
    hasShownToast.current = true;

    try {
      localStorage.setItem(PERMANENT_KEY, "true");
    } catch {
      /* blocked */
    }
  }, []);

  const dismissIOSHint = useCallback(() => {
    setShowIosHint(false);
    try {
      sessionStorage.setItem(IOS_HINT_SESSION_KEY, "true");
      localStorage.setItem(PERMANENT_KEY, "true");
    } catch {
      /* blocked */
    }
  }, []);

  const dismissOpenInSafari = useCallback(() => {
    setShowOpenInSafari(false);
  }, []);

  const trigger = useCallback(
    (delay = 1500) => {
      if (!deferredPrompt || isInstalled || hasShownToast.current) return;

      try {
        if (localStorage.getItem(PERMANENT_KEY) === "true") return;
        const snoozeUntil = localStorage.getItem(SNOOZE_KEY);
        if (snoozeUntil) {
          const expires = parseInt(snoozeUntil, 10);
          if (Date.now() < expires) return;
          localStorage.removeItem(SNOOZE_KEY);
        }
      } catch {
        return;
      }

      setTimeout(() => {
        if (!hasShownToast.current) {
          setCanInstall(true);
        }
      }, delay);
    },
    [deferredPrompt, isInstalled]
  );

  return {
    canInstall,
    isInstalled,
    install,
    dismiss,
    trigger,
    showIosHint,
    showOpenInSafari,
    dismissIOSHint,
    dismissOpenInSafari,
  };
}
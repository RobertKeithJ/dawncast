import React from "react";
import { useEffect, useRef } from "react";
import { X, AppWindow, SquareArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@dawncast/ui/components/sheet";
import { Button } from "@dawncast/ui/components/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { SafariShareIcon } from "@/components/safari-share-icon";

const INSTALL_TOAST_ID = "pwa-install-toast";
const IOS_HINT_TOAST_ID = "ios-install-hint-toast";
const OPEN_SAFARI_TOAST_ID = "open-safari-toast";

export function PwaInstallPrompt() {
  const {
    canInstall,
    install,
    dismiss,
    showIosHint,
    showOpenInSafari,
    dismissIOSHint,
    dismissOpenInSafari,
  } = usePwaInstall();

  const prevCanInstall = useRef(canInstall);
  const prevIosHint = useRef(showIosHint);
  const prevOpenInSafari = useRef(showOpenInSafari);
  const isMobile = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 768px)").matches
      : false
  );

  useEffect(() => {
    if (showOpenInSafari && !prevOpenInSafari.current) {
      toast(
        <div className="flex items-start gap-3 w-full">
          <SquareArrowUpRight className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">For the best experience, open this in Safari</span>
            <Button
              size="sm"
              variant="outline"
              className="w-fit h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                window.open(location.href, "_blank");
                dismissOpenInSafari();
                toast.dismiss(OPEN_SAFARI_TOAST_ID);
              }}
            >
              Open in Safari
            </Button>
          </div>
        </div>,
        {
          id: OPEN_SAFARI_TOAST_ID,
          duration: Infinity,
          dismissible: true,
        }
      );
    } else if (!showOpenInSafari && prevOpenInSafari.current) {
      toast.dismiss(OPEN_SAFARI_TOAST_ID);
    }
    prevOpenInSafari.current = showOpenInSafari;
  }, [showOpenInSafari, dismissOpenInSafari]);

  useEffect(() => {
    if (showIosHint && !prevIosHint.current) {
      toast(
        <div className="flex items-start gap-3 w-full">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">
                  Add Dawncast to your Home Screen
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Tap Safari&apos;s <SafariShareIcon /> button below, then
                  &apos;Add to Home Screen&apos;
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissIOSHint();
                  toast.dismiss(IOS_HINT_TOAST_ID);
                }}
                aria-label="Dismiss install hint"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Use Safari&apos;s browser bar — not the share button in the app
            </span>
          </div>
        </div>,
        {
          id: IOS_HINT_TOAST_ID,
          duration: Infinity,
          dismissible: true,
          onDismiss: () => dismissIOSHint(),
        }
      );
    } else if (!showIosHint && prevIosHint.current) {
      toast.dismiss(IOS_HINT_TOAST_ID);
    }
    prevIosHint.current = showIosHint;
  }, [showIosHint, dismissIOSHint]);

  useEffect(() => {
    if (canInstall && !isMobile.current) {
      if (!prevCanInstall.current) {
        toast(
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                <AppWindow className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  Add Dawncast to your home screen
                </span>
                <span className="text-xs text-muted-foreground">
                  Your daily quote, one tap away
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                className="h-8 px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  install();
                }}
                aria-label="Install Dawncast app"
              >
                Install
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-muted-foreground underline underline-offset-2"
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                  toast.dismiss(INSTALL_TOAST_ID);
                }}
                aria-label="Not now"
              >
                Not now
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                  toast.dismiss(INSTALL_TOAST_ID);
                }}
                aria-label="Dismiss install prompt"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>,
          {
            id: INSTALL_TOAST_ID,
            duration: Infinity,
            dismissible: true,
            onDismiss: () => dismiss(),
          }
        );
      }
    } else if (!canInstall) {
      toast.dismiss(INSTALL_TOAST_ID);
    }

    prevCanInstall.current = canInstall;
  }, [canInstall, install, dismiss]);

  if (!canInstall) return null;

  if (isMobile.current) {
    return (
      <Sheet open onOpenChange={() => {}}>
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <AppWindow className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <SheetTitle className="text-xl">
                  Add Dawncast to your home screen
                </SheetTitle>
                <SheetDescription className="text-sm">
                  Your daily quote, one tap away
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <SheetFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                dismiss();
              }}
              className="w-full sm:w-auto"
            >
              Not now
            </Button>
            <Button
              onClick={install}
              className="w-full sm:w-auto gap-2"
              aria-label="Install Dawncast app"
            >
              Install App
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return null;
}
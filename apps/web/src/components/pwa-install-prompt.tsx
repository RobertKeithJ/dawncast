import { useEffect, useRef } from "react";
import { Download, X, AppWindow, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@project-dailyquotes/ui/components/sheet";
import { Button } from "@project-dailyquotes/ui/components/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const TOAST_ID = "pwa-install-toast";

export function PwaInstallPrompt() {
  const { canInstall, install, dismiss, showIosHint } = usePwaInstall();
  const prevCanInstall = useRef(canInstall);
  const prevIosHint = useRef(showIosHint);
  const isMobile = useRef(
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
  );

  useEffect(() => {
    if (showIosHint && !prevIosHint.current) {
      toast(
        <div className="flex items-center gap-3">
          <Smartphone className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm">Add to Home Screen via Safari's Share button (↑)</span>
        </div>,
        {
          id: "ios-install-hint",
          duration: 7000,
        }
      );
    }
    prevIosHint.current = showIosHint;
  }, [showIosHint]);

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
                <span className="font-medium text-sm">Add Dawncast to your home screen</span>
                <span className="text-xs text-muted-foreground">Your daily quote, one tap away</span>
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
                  toast.dismiss(TOAST_ID);
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
                  toast.dismiss(TOAST_ID);
                }}
                aria-label="Dismiss install prompt"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>,
          {
            id: TOAST_ID,
            duration: Infinity,
            dismissible: false,
          }
        );
      }
    } else if (!canInstall) {
      toast.dismiss(TOAST_ID);
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
                <SheetTitle className="text-xl">Add Dawncast to your home screen</SheetTitle>
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
              <Download className="h-4 w-4" aria-hidden="true" />
              Install App
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return null;
}
import { useEffect, useState, useRef } from "react";
import { Download, X, AppWindow } from "lucide-react";
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
  const { canInstall, isMobile, install, dismiss, reset } = usePwaInstall();
  const [open, setOpen] = useState(false);
  const prevCanInstall = useRef(canInstall);

  useEffect(() => {
    if (canInstall && !isMobile) {
      if (!prevCanInstall.current) {
        toast(
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                <AppWindow className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">Install DailyQuotes</span>
                <span className="text-xs text-muted-foreground">
                  Add to home screen for the best experience
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="sm"
                className="h-8 px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  install();
                }}
              >
                Install
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
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>,
          {
            id: TOAST_ID,
            duration: 15000,
            dismissible: false,
          }
        );
      }
    } else if (!canInstall) {
      toast.dismiss(TOAST_ID);
    }

    prevCanInstall.current = canInstall;
  }, [canInstall, isMobile, install, dismiss]);

  useEffect(() => {
    if (canInstall && isMobile) {
      setOpen(true);
    }
  }, [canInstall, isMobile]);

  if (!canInstall) return null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <AppWindow className="h-6 w-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">Install DailyQuotes</SheetTitle>
                <SheetDescription className="text-sm">
                  Add to home screen for the best experience
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <SheetFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={dismiss} className="w-full sm:w-auto">
              Not now
            </Button>
            <Button onClick={install} className="w-full sm:w-auto gap-2">
              <Download className="h-4 w-4" />
              Install App
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return null;
}

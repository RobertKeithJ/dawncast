import { useEffect, useState } from "react";
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

export function PwaInstallPrompt() {
  const { canInstall, isMobile, install, dismiss } = usePwaInstall();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (canInstall) {
      if (isMobile) {
        setOpen(true);
      } else {
        toast.promise(
          new Promise<"installed">((resolve) => {
            setTimeout(() => resolve("installed"), 3000);
          }),
          {
            loading: "Checking for app...",
            success: (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AppWindow className="h-5 w-5" />
                  <div className="flex flex-col">
                    <span className="font-medium">Install DailyQuotes</span>
                    <span className="text-xs text-muted-foreground">
                      Add to home screen for the best experience
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      install();
                    }}
                  >
                    Install
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismiss();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ),
            duration: 10000,
            dismissible: false,
          }
        );
      }
    }
  }, [canInstall, isMobile, install, dismiss]);

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
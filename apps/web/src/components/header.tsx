import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications not supported on this browser.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          // Note: In production you need to specify `applicationServerKey` (VAPID key)
          const subscription = await registration.pushManager.getSubscription();

          if (!subscription) {
            // VAPID key not yet configured — subscribing is a no-op until Phase 5.
            // TODO (Phase 5): implement real VAPID push subscription here.
            console.info("[notifications] No active push subscription found; VAPID flow not yet implemented.");
          } else {
            const subJson = subscription.toJSON();
            if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
              await api.api.subscribe.post({
                endpoint: subJson.endpoint,
                keys: {
                  p256dh: subJson.keys.p256dh,
                  auth: subJson.keys.auth
                }
              });
            }
          }
          toast.success("Notifications enabled!", {
            description: "You'll receive daily motivational quotes."
          });
        }
      } catch (error) {
        console.error("Error setting up notifications", error);
        toast.error("Failed to subscribe to notifications.");
      }
    } else {
      toast.info("Notifications were denied.");
    }
  };

  return (
    <header className="z-40 w-full animate-[dc-enter_400ms_ease_both]">
      <div className="container mx-auto max-w-md flex flex-row items-center justify-between px-6 py-4">
        <nav className="flex items-center gap-4">
          <Link to="/" className="text-xl font-semibold tracking-[-0.03em] font-sans hover:opacity-70 transition-opacity">
            Dawncast
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <button
            className="dc-btn dc-btn-ghost !p-2 rounded-full border-none hover:bg-foreground/5"
            onClick={requestNotificationPermission}
            aria-label="Enable notifications"
          >
            <Bell className="h-[1.15rem] w-[1.15rem] text-muted-foreground" />
          </button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

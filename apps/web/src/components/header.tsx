import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications not supported on this browser.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Notifications enabled!", {
        description: "You'll receive daily motivational quotes."
      });
    } else {
      toast.info("Notifications were denied.");
    }
  };

  return (
    <header className="z-40 w-full animate-[dc-enter_400ms_ease_both]">
      <div className="flex flex-row items-center justify-between px-6 py-4">
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

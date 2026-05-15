import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@project-dailyquotes/ui/components/button";

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
      // Further SW registration logic here
    } else {
      toast.info("Notifications were denied.");
    }
  };

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-4 py-3">
        <nav className="flex gap-4 text-lg font-semibold tracking-tight">
          <Link to="/">DailyQuotes</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={requestNotificationPermission} aria-label="Enable notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <ModeToggle />
        </div>
      </div>
      <hr />
    </div>
  );
}

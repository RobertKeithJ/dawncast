import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@project-dailyquotes/ui/components/dropdown-menu";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={(props) => (
        <button 
          {...props} 
          className="dc-btn dc-btn-ghost dc-btn-icon relative"
        >
          <Sun className="h-[1.15rem] w-[1.15rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90 text-muted-foreground" />
          <Moon className="absolute h-[1.15rem] w-[1.15rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0 text-muted-foreground" />
          <span className="sr-only">Toggle theme</span>
        </button>
      )}>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")} className="focus:bg-primary/10">Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="focus:bg-primary/10">Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="focus:bg-primary/10">System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

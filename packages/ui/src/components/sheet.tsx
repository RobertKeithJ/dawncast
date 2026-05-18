"use client";

import { X } from "lucide-react";
import { cn } from "@dawncast/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const SheetContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

function useSheetContext() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used within a Sheet provider");
  }
  return context;
}

const sheetVariants = cva(
  "fixed z-50 bg-background p-6 shadow-lg transition-transform duration-300 ease-in-out",
  {
    variants: {
      side: {
        bottom: "bottom-0 left-0 right-0 border-t translate-y-full data-[open=true]:translate-y-0",
        top: "top-0 left-0 right-0 border-b -translate-y-full data-[open=true]:translate-y-0",
        left: "left-0 top-0 bottom-0 w-3/4 border-r -translate-x-full data-[open=true]:translate-x-0 sm:max-w-sm",
        right: "right-0 top-0 bottom-0 w-3/4 border-l translate-x-full data-[open=true]:translate-x-0 sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "bottom",
    },
  }
);

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

interface SheetContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "bottom", className, children, ...props }, ref) => {
    const { open, onOpenChange } = useSheetContext();

    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onOpenChange(false);
      };
      if (open) {
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
      }
    }, [open, onOpenChange]);

    return (
      <>
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/80 animate-in fade-in"
            onClick={() => onOpenChange(false)}
          />
        )}
        <div
          ref={ref}
          data-open={open}
          className={cn(sheetVariants({ side }), className)}
          {...props}
        >
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          {children}
        </div>
      </>
    );
  }
);
SheetContent.displayName = "SheetContent";

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

interface SheetTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const SheetTitle = React.forwardRef<HTMLHeadingElement, SheetTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  )
);
SheetTitle.displayName = "SheetTitle";

interface SheetDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const SheetDescription = React.forwardRef<HTMLParagraphElement, SheetDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
SheetDescription.displayName = "SheetDescription";

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { onOpenChange } = useSheetContext();
  return (
    <button
      ref={ref}
      onClick={(e) => {
        onClick?.(e);
        onOpenChange(true);
      }}
      {...props}
    />
  );
});
SheetTrigger.displayName = "SheetTrigger";

const SheetClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { onOpenChange } = useSheetContext();
  return (
    <button
      ref={ref}
      onClick={(e) => {
        onClick?.(e);
        onOpenChange(false);
      }}
      {...props}
    />
  );
});
SheetClose.displayName = "SheetClose";

const SheetPortal = ({ children }: { children: React.ReactNode }) => children;
const SheetOverlay = ({ className }: { className?: string }) => null;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
import React, { useRef } from "react";
import { toast } from "sonner";
import { Copy, X } from "lucide-react";

interface ShareModalProps {
  text: string;
  author: string;
  onClose: () => void;
}

export function ShareModal({ text, author, onClose }: ShareModalProps) {
  const shareText = `"${text}" — ${author}`;
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Quote copied to clipboard!");
    } catch {
      toast.error("Could not copy — try selecting the text manually.");
    }
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Share quote"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl animate-[dc-enter_300ms_ease_both]">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Share Quote
          </h2>
          <button
            onClick={onClose}
            aria-label="Close share dialog"
            className="dc-btn dc-btn-ghost !p-1.5 rounded-full border-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <blockquote className="text-base leading-relaxed text-foreground border-l-2 border-primary pl-4 italic">
          &ldquo;{text}&rdquo;
          <footer className="mt-1 not-italic text-sm text-muted-foreground">
            — {author}
          </footer>
        </blockquote>

        <button onClick={handleCopy} className="dc-btn dc-btn-primary w-full">
          <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
        </button>
      </div>
    </div>
  );
}

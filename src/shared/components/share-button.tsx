"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import { cn } from "@/shared/lib/utils";

type ShareButtonProps = {
  // Relative path (e.g. "/necesidades/ABC123") — resolved against
  // location.origin at click time so no server-rendered page needs to know
  // its own absolute URL just to pass it down as a prop.
  path: string;
  title: string;
  text: string;
  className?: string;
};

// navigator.share opens the OS share sheet (WhatsApp, SMS, etc. included)
// on mobile and most modern desktop browsers. Where it's unavailable —
// still common on desktop Chrome/Firefox — falls back to copying the link,
// which covers the same intent ("let me hand this to someone else").
export function ShareButton({ path, title, text, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}${path}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // AbortError when the user dismisses the native share sheet — not
        // an error worth surfacing.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, insecure context); the
      // link itself is still visible/copyable manually from the browser.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-semibold transition-colors hover:bg-muted",
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="size-4 shrink-0 text-verified" aria-hidden="true" />
          Enlace copiado
        </>
      ) : (
        <>
          <Share2 className="size-4 shrink-0" aria-hidden="true" />
          Compartir
        </>
      )}
    </button>
  );
}

"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/shared/lib/utils";

type CopyLinkButtonProps = {
  // Relative path — resolved against location.origin at click time, same
  // reasoning as ShareButton: no server-rendered page needs to compute its
  // own absolute URL just to hand it down as a prop.
  path: string;
  className?: string;
};

// Deliberately its own component, not a reuse of ShareButton: this link
// carries a manage_token (RF-4.4 — "nunca aparece en ninguna vista
// pública"). navigator.share() would route it through the OS share sheet,
// which invites sending it to someone else; copying to a clipboard the
// person controls does not.
export function CopyLinkButton({ path, className }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, insecure context); the
      // link itself is still visible/copyable manually right above this
      // button.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-sm font-bold text-primary transition-colors hover:bg-primary/15",
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
          <Copy className="size-4 shrink-0" aria-hidden="true" />
          Copiar enlace
        </>
      )}
    </button>
  );
}

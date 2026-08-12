import type { ReactNode } from "react";

import { SiteFooter } from "@/shared/components/site-footer";
import { SiteHeader } from "@/shared/components/site-header";

// Every public-facing page lives under this route group so it shares one
// nav + footer. /moderacion sits outside it deliberately — it's a staff
// tool with its own header (sign-out, internal nav), not a public page.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

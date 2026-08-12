import Link from "next/link";
import type { Metadata } from "next";

import { listAdminAlerts } from "@/modules/moderation/queries-alerts";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

export const metadata: Metadata = {
  title: "Alertas | Centro de Ayuda Manizales",
  robots: { index: false, follow: false },
};

function isExpired(expiresAt: string | null): boolean {
  return expiresAt !== null && new Date(expiresAt) <= new Date();
}

// RF-6.9 — shows every alert, published or not, expired or not: the
// public home page (getActiveAlerts()) is the filtered surface, this is
// its "shows hidden/expired too" counterpart, same as the help_requests
// inbox vs. the public board.
export default async function AdminAlertsPage() {
  const alerts = await listAdminAlerts();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl">Alertas</h1>
        <Button asChild className="min-h-12 px-5">
          <Link href="/moderacion/alertas/nueva">Nueva alerta</Link>
        </Button>
      </header>

      <p className="text-sm text-muted-foreground">
        {alerts.length === 1 ? "1 alerta" : `${alerts.length} alertas`}
      </p>

      <ul className="flex flex-col gap-3">
        {alerts.map((alert) => {
          const expired = isExpired(alert.expiresAt);
          return (
            <li
              key={alert.alertId}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={alert.isPublished ? "default" : "outline"}>
                  {alert.isPublished ? "Publicada" : "Sin publicar"}
                </Badge>
                {expired ? (
                  <Badge className="bg-closed-surface text-closed-foreground">
                    Vencida
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 font-semibold">{alert.title}</p>
              <p className="text-sm text-muted-foreground">
                Fuente: {alert.source}
              </p>
              <Link
                href={`/moderacion/alertas/${alert.alertId}`}
                className="mt-2 inline-flex min-h-12 w-fit items-center text-sm font-semibold underline underline-offset-4"
              >
                Gestionar
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

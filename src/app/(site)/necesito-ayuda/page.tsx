import type { Metadata } from "next";
import { HandHeart } from "lucide-react";

import { PublishForm } from "@/modules/help-requests/components/publish-form";
import { listComunas, listNeighborhoods } from "@/modules/help-requests/queries";

export const metadata: Metadata = {
  title: "Publicar una necesidad | Centro de Ayuda Manizales",
  description:
    "Publica una necesidad de ayuda para que otras personas puedan verla y responder.",
};

export default async function NecesitoAyudaPage() {
  const [comunas, neighborhoods] = await Promise.all([
    listComunas(),
    listNeighborhoods(),
  ]);

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="border-b-2 border-emergency bg-card">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center gap-2">
            <HandHeart className="size-6 shrink-0 text-emergency" aria-hidden="true" />
            <p className="label-caps text-muted-foreground">
              Centro de Ayuda Manizales
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl">Publicar una necesidad</h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Cuéntanos qué necesitas para que otras personas puedan verlo y
            responder. No necesitas crear una cuenta.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
        <PublishForm comunas={comunas} neighborhoods={neighborhoods} />
      </div>
    </main>
  );
}

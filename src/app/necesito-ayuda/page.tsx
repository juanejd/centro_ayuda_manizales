import type { Metadata } from "next";

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
    <main className="bg-background text-foreground min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <header>
          <p className="label-caps text-muted-foreground">
            Centro de Ayuda Manizales
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl">Publicar una necesidad</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuéntanos qué necesitas para que otras personas puedan verlo y
            responder. No necesitas crear una cuenta.
          </p>
        </header>

        <PublishForm comunas={comunas} neighborhoods={neighborhoods} />
      </div>
    </main>
  );
}

import Link from "next/link";

import { createServerSupabaseClient } from "@/shared/supabase/server";

export const revalidate = 300;

type EmergencyLine = {
  name: string;
  phone: string;
};

const entryPoints = [
  {
    href: "/necesito-ayuda",
    title: "NECESITO AYUDA",
    description: "Publica una necesidad para que otras personas puedan verla.",
    className: "border-red-200 bg-red-50 text-red-950 hover:bg-red-100",
  },
  {
    href: "/quiero-ayudar",
    title: "QUIERO AYUDAR",
    description: "Cuéntanos qué puedes aportar y encuentra dónde hace falta.",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-950 hover:bg-emerald-100",
  },
  {
    href: "/informacion",
    title: "BUSCO INFORMACIÓN",
    description: "Consulta albergues, atención médica y recursos oficiales.",
    className: "border-blue-200 bg-blue-50 text-blue-950 hover:bg-blue-100",
  },
] as const;

async function getEmergencyLines(): Promise<EmergencyLine[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("info_resources")
      .select("name, phones")
      .eq("category", "lineas_atencion")
      .eq("is_published", true)
      .order("name");

    if (error) {
      throw error;
    }

    const resources = (data ?? []) as Array<{
      name: string;
      phones: string[] | null;
    }>;
    const lines = resources.flatMap(({ name, phones }) =>
      (phones ?? [])
        .map((phone) => ({ name, phone }))
        .filter(({ phone }) => phone.replace(/[^\d+]/g, "").length > 0),
    );

    if (lines.length > 0) {
      return lines;
    }
  } catch (error) {
    console.error("Unable to load emergency lines from the directory.", error);
  }

  return [{ name: "Línea de emergencias", phone: "123" }];
}

export default async function HomePage() {
  const emergencyLines = await getEmergencyLines();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <header>
          <p className="text-sm font-semibold tracking-wide text-slate-600 uppercase">
            Centro de Ayuda Manizales
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            ¿Qué necesitas hacer?
          </h1>
        </header>

        <nav aria-label="Acciones principales">
          <ul className="grid gap-3">
            {entryPoints.map((entryPoint) => (
              <li key={entryPoint.href}>
                <Link
                  href={entryPoint.href}
                  className={`flex min-h-24 flex-col justify-center rounded-xl border px-5 py-3 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 ${entryPoint.className}`}
                >
                  <span className="text-base font-bold tracking-wide">
                    {entryPoint.title}
                  </span>
                  <span className="mt-1 text-sm leading-snug">
                    {entryPoint.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section
          aria-labelledby="emergency-lines-title"
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950"
        >
          <h2 id="emergency-lines-title" className="text-sm font-bold">
            ¿Es una emergencia inmediata?
          </h2>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {emergencyLines.map(({ name, phone }) => (
              <li key={`${name}-${phone}`}>
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex min-h-12 items-center font-bold underline decoration-2 underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-950"
                >
                  {name}: {phone}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed">
            Esta plataforma no reemplaza las líneas oficiales de emergencia.
          </p>
        </section>

        <nav aria-label="Acciones secundarias">
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
            <li>
              <Link
                href="/necesidades"
                className="inline-flex min-h-12 items-center underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
              >
                Ver todas las necesidades
              </Link>
            </li>
            <li>
              <Link
                href="/mi-publicacion"
                className="inline-flex min-h-12 items-center underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
              >
                Gestionar mi publicación
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </main>
  );
}

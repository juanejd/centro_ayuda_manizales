import type { Metadata } from "next";
import {
  Building2,
  Clock,
  FileText,
  HardHat,
  Handshake,
  Home,
  MessageCircle,
  Scale,
  Shield,
} from "lucide-react";

import { toWhatsAppHref } from "@/modules/info-resources/domain";

export const metadata: Metadata = {
  title: "Asesoría jurídica gratuita | Centro de Ayuda Manizales",
  description:
    "Asesoría jurídica gratuita para personas afectadas por el sismo en Manizales: seguros, arrendamientos, propiedad horizontal, constructoras y más.",
};

const COMPANY_WHATSAPP = "3117517264";
const WHATSAPP_MESSAGE =
  "Hola, fui afectado por el sismo en Manizales y quiero asesoría jurídica gratuita.";

const SERVICE_AREAS = [
  {
    icon: Shield,
    title: "Seguros",
    description:
      "Reclamaciones, indemnizaciones, negativas y revisión de pólizas.",
  },
  {
    icon: Home,
    title: "Arrendamientos",
    description:
      "Daños en el inmueble, negociación y posible terminación del contrato.",
  },
  {
    icon: Building2,
    title: "Propiedad horizontal",
    description:
      "Responsabilidades por daños en apartamentos y zonas comunes.",
  },
  {
    icon: HardHat,
    title: "Constructoras",
    description: "Garantías y posibles defectos de construcción.",
  },
  {
    icon: FileText,
    title: "Contratos",
    description:
      "Análisis de fuerza mayor, incumplimientos y renegociación de obligaciones.",
  },
  {
    icon: Handshake,
    title: "Conciliación y negociación",
    description:
      "Acompañamiento para buscar soluciones sin llegar a un proceso judicial.",
  },
  {
    icon: Clock,
    title: "Términos y reclamaciones",
    description: "Orientación para evitar perder derechos por vencimiento de plazos.",
  },
] as const;

// Content sourced from serviciogratuitojuridico.md (project root) — the
// owner of IA CONEXIONES S.A.S. is a lawyer offering this free of charge to
// people affected by the earthquake.
export default function AsesoriaJuridicaPage() {
  const whatsappHref = toWhatsAppHref(COMPANY_WHATSAPP, WHATSAPP_MESSAGE);

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="border-b-2 border-primary bg-card">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center gap-2">
            <Scale className="size-6 shrink-0 text-primary" aria-hidden="true" />
            <p className="label-caps text-muted-foreground">
              Centro de Ayuda Manizales · Servicio gratuito
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl">
            Asesoría jurídica para afectados por el sismo
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Si tu vivienda, negocio o propiedad resultó afectada por el
            sismo en Manizales, ponemos nuestros servicios jurídicos a tu
            disposición, sin costo, para ayudarte a proteger tus derechos y
            actuar a tiempo.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <section aria-labelledby="areas-title" className="flex flex-col gap-3">
          <h2 id="areas-title" className="text-lg font-bold">
            Te asesoramos en
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {SERVICE_AREAS.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="contact-title"
          className="flex flex-col items-start gap-3 rounded-2xl border-2 border-primary bg-primary/5 px-5 py-5 shadow-sm sm:px-6"
        >
          <h2 id="contact-title" className="text-lg font-bold">
            ¿Fuiste afectado y no sabes qué hacer?
          </h2>
          <p className="text-sm text-foreground/90">
            Cuéntanos tu caso y te orientamos sobre la ruta jurídica más
            adecuada. Cada situación requiere una evaluación particular.
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-[#25D366] px-6 text-base font-bold text-white shadow-lg transition-[filter] hover:brightness-95"
          >
            <MessageCircle className="size-5 shrink-0" aria-hidden="true" />
            Escribir por WhatsApp
          </a>
        </section>
      </div>
    </main>
  );
}

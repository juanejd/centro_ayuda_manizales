import Link from "next/link";
import {
  BookOpenText,
  ClipboardList,
  Globe,
  Phone,
  Scale,
  ShieldCheck,
} from "lucide-react";

const FOOTER_LINKS = [
  { href: "/informacion", label: "Centro de información", icon: BookOpenText },
  { href: "/lineas-atencion", label: "Líneas de emergencia", icon: Phone },
  { href: "/asesoria-juridica", label: "Asesoría jurídica gratuita", icon: Scale },
  { href: "/mi-publicacion", label: "Gestionar mi publicación", icon: ClipboardList },
  { href: "/aviso-de-privacidad", label: "Aviso de privacidad", icon: ShieldCheck },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15 text-lg">
                🤝
              </span>
              <div className="flex flex-col leading-tight">
                <span className="font-heading text-base font-bold">
                  Centro de Ayuda Manizales
                </span>
                <span className="text-xs text-primary-foreground/70">
                  Una iniciativa de IA CONEXIONES S.A.S.
                </span>
              </div>
            </div>
            <a
              href="https://iaconexiones.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-primary-foreground/10 px-3 text-sm font-semibold transition-colors hover:bg-primary-foreground/15"
            >
              <Globe className="size-4 shrink-0" aria-hidden="true" />
              iaconexiones.com
            </a>
          </div>

          <nav aria-label="Enlaces del pie de página">
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {FOOTER_LINKS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-primary-foreground/10"
                  >
                    <Icon className="size-4 shrink-0 text-primary-foreground/70" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="border-t border-primary-foreground/15 pt-4 text-xs text-primary-foreground/60">
          Esta plataforma no reemplaza las líneas oficiales de emergencia.
          Verifica siempre la información antes de desplazarte o entregar
          dinero o bienes.
        </p>
      </div>
    </footer>
  );
}

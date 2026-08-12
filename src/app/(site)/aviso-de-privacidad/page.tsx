import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de privacidad | Centro de Ayuda Manizales",
  description:
    "Quién es responsable del tratamiento de tus datos personales en esta plataforma, para qué se usan, y cómo ejercer tus derechos.",
};

// RF-6.8 / RNF-5.3. Static legal content — no data access, no client
// interactivity. D-1 (responsable) and the contact channel are organizational
// facts supplied by IA CONEXIONES S.A.S., not something derived from code.
export default function AvisoDePrivacidadPage() {
  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <header>
          <p className="label-caps text-muted-foreground">
            Centro de Ayuda Manizales
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl">Aviso de privacidad</h1>
        </header>

        <section className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">Responsable del tratamiento</h2>
          <p className="text-sm text-foreground/90">
            <strong>IA CONEXIONES S.A.S.</strong> es responsable del
            tratamiento de los datos personales recogidos por esta
            plataforma, conforme a la Ley 1581 de 2012 y sus decretos
            reglamentarios.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">Finalidad</h2>
          <p className="text-sm text-foreground/90">
            Tus datos se recogen para gestionar tu solicitud de ayuda durante
            la emergencia en Manizales: registrarla, verificarla, y
            publicarla para que otras personas y organizaciones puedan
            ofrecerte apoyo. Esta es una finalidad distinta de la
            divulgación pública, por eso el formulario pide dos
            autorizaciones separadas.
          </p>
        </section>

        <section className="flex flex-col gap-1.5 rounded-xl border border-destructive/40 bg-card p-4">
          <h2 className="text-lg font-semibold">
            Tu nombre, teléfono y foto son públicos
          </h2>
          <p className="text-sm text-foreground/90">
            Si autorizas la publicación, tu nombre, tu número de teléfono y
            la foto que adjuntes se muestran en el tablero público de
            necesidades y{" "}
            <strong>
              son visibles por cualquier persona en internet
            </strong>
            , sin necesidad de iniciar sesión. No los publiques si no quieres
            que sean de acceso público.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">Conservación</h2>
          <p className="text-sm text-foreground/90">
            Cuando tu solicitud vence o es atendida, deja de mostrarse en el
            tablero público, pero el registro se conserva de forma
            indefinida en la base de datos de la plataforma, salvo que
            solicites su supresión por alguno de los canales de este aviso.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">
            Ejerce tus derechos (habeas data)
          </h2>
          <p className="text-sm text-foreground/90">
            Puedes conocer, actualizar, rectificar o suprimir tus datos, y
            revocar la autorización que diste, escribiendo a{" "}
            <a
              href="mailto:iaconexiones.sas@gmail.com"
              className="font-semibold text-primary underline underline-offset-4"
            >
              iaconexiones.sas@gmail.com
            </a>{" "}
            o llamando/escribiendo al{" "}
            <a
              href="tel:3117517264"
              className="font-semibold text-primary underline underline-offset-4"
            >
              311 751 7264
            </a>
            .
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">Canal alternativo de retiro</h2>
          <p className="text-sm text-foreground/90">
            También puedes retirar tu propia publicación en cualquier
            momento, sin escribirnos, desde{" "}
            <Link
              href="/mi-publicacion"
              className="font-semibold text-primary underline underline-offset-4"
            >
              Gestionar mi publicación
            </Link>{" "}
            con el radicado y el enlace de gestión que recibiste al publicar.
          </p>
        </section>

        <Link
          href="/"
          className="mt-2 inline-flex min-h-12 w-fit items-center text-sm font-semibold underline underline-offset-4"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}

import Link from "next/link";

import { toTelHref } from "@/modules/info-resources/domain";

type Scenario = {
  title: string;
  steps: readonly string[];
  action: { label: string; phone: string };
};

const SCENARIOS: readonly Scenario[] = [
  {
    title: "Si aparece una grieta, aunque parezca pequeña",
    steps: [
      "No determine por su cuenta que la vivienda es segura solo porque la grieta sea pequeña.",
      "Si la grieta apareció después del sismo o hay cualquier otra señal nueva de daño, evite ingresar o permanecer en el área que le genere duda.",
      "No retire elementos estructurales, no golpee muros y no intente “probar” la estabilidad.",
      "No regrese a una vivienda con daños hasta que personal competente haya evaluado las condiciones.",
      "Si hay colapso parcial, desprendimientos activos, deformaciones evidentes o personas atrapadas, llame de inmediato.",
    ],
    action: { label: "Solicitar revisión", phone: "119" },
  },
  {
    title:
      "Si hay grietas en columnas o vigas, pared inclinada, escalera dañada o desprendimientos",
    steps: [
      "Evacúe preventivamente hacia una zona segura si puede hacerlo sin exponerse.",
      "No use ascensor.",
      "Aléjese de fachadas, vidrios, muros y elementos que puedan caer.",
      "No permita el reingreso hasta revisión competente.",
    ],
    action: { label: "Reportar", phone: "119" },
  },
  {
    title: "Si huele a gas",
    steps: [
      "No encienda fósforos, velas ni llamas.",
      "No accione interruptores o equipos que puedan generar chispas.",
      "Si es seguro hacerlo, abra puertas y ventanas y cierre las válvulas.",
      "Si el olor es fuerte o persiste, evacúe inmediatamente.",
    ],
    action: { label: "Llamar a Efigas", phone: "164" },
  },
  {
    title: "Si hay cables caídos o infraestructura eléctrica dañada",
    steps: [
      "Mantenga distancia.",
      "No toque el cable ni objetos que estén en contacto con él.",
      "Evite charcos o superficies húmedas cercanas.",
    ],
    action: { label: "Reportar a CHEC", phone: "115" },
  },
  {
    title: "Si hay una fuga de agua",
    steps: [
      "Evite zonas inundadas si hay riesgo eléctrico o estructural.",
    ],
    action: { label: "Reportar a Aguas de Manizales", phone: "116" },
  },
  {
    title: "Si hay una persona herida",
    steps: [
      "Siga las indicaciones del personal de teleasistencia.",
      "No movilice a una persona con posible trauma grave salvo que exista un peligro inmediato que obligue a hacerlo.",
    ],
    action: { label: "Llamar a urgencias médicas", phone: "123 opción 2" },
  },
  {
    title: "Si hay una persona atrapada",
    steps: [
      "Entregue ubicación exacta, número aproximado de personas y tipo de estructura.",
      "No ingrese a una estructura inestable para realizar un rescate no especializado.",
    ],
    action: { label: "Pedir rescate", phone: "119" },
  },
  {
    title: "Si ocurre una réplica",
    steps: [
      "Protéjase de objetos que puedan caer.",
      "Aléjese de ventanas, fachadas y elementos suspendidos.",
      "Si se encuentra en una edificación afectada y la evacuación es segura, siga las instrucciones oficiales para salir. No utilice ascensores.",
      "Espere instrucciones antes de regresar a estructuras con daños.",
    ],
    action: { label: "Si necesita ayuda", phone: "123" },
  },
  {
    title: "Si está con niños, adultos mayores o personas con discapacidad",
    steps: [
      "Manténgalos acompañados.",
      "Priorice medicación esencial, ayudas técnicas, documentos y elementos de movilidad solo si están al alcance sin ponerse en riesgo.",
      "Evite separaciones innecesarias.",
    ],
    action: { label: "Si necesita apoyo para evacuarlos", phone: "123" },
  },
  {
    title: "Si está con mascotas",
    steps: [
      "No ingrese a una estructura insegura únicamente para recuperar un animal.",
      "Mantenga a los animales asegurados con correa o guacal cuando sea posible para evitar pérdidas durante réplicas o evacuaciones.",
    ],
    action: { label: "Emergencia animal", phone: "123 opción 5" },
  },
] as const;

export default function ActionGuidePage() {
  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <Link
          href="/"
          className="inline-flex min-h-12 w-fit items-center text-sm text-muted-foreground underline underline-offset-4"
        >
          Volver al inicio
        </Link>

        <header>
          <p className="label-caps text-muted-foreground">
            Centro de Ayuda Manizales
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl">¿Qué debo hacer?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Esta guía retransmite instrucciones oficiales. No reemplaza el
            criterio de personal competente sobre la seguridad de una
            vivienda.
          </p>
        </header>

        <ul className="flex flex-col gap-3">
          {SCENARIOS.map((scenario) => (
            <li
              key={scenario.title}
              className="rounded-xl border border-border bg-card px-4 py-3"
            >
              <h2 className="text-base font-bold">{scenario.title}</h2>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-foreground/90">
                {scenario.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
              <a
                href={toTelHref(scenario.action.phone)}
                className="mt-2 inline-flex min-h-12 items-center font-bold text-primary underline decoration-2 underline-offset-4"
              >
                {scenario.action.label}: {scenario.action.phone}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

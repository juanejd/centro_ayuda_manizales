export type Alert = {
  title: string;
  description: string;
  expiresAt: string | null;
  source: string;
};

export const ALERTS: readonly Alert[] = [
  {
    title: "Toque de queda",
    description:
      "Está vigente un toque de queda en Manizales desde las 10:00 p. m. del 10 de agosto hasta las 5:00 a. m. del 11 de agosto de 2026. Permanezca en el lugar seguro donde se encuentre, atienda instrucciones oficiales y evite desplazamientos innecesarios.",
    expiresAt: "2026-08-11T05:00:00-05:00",
    source:
      "https://centrodeinformacion.manizales.gov.co/vicepresidente-jose-manuel-restrepo-conoce-balance-de-afectaciones-por-sismo-en-manizales/",
  },
  {
    title: "No regrese a una vivienda con daños sin revisión",
    description:
      "No regrese a una vivienda que presente daños o sobre la cual existan dudas de seguridad hasta que sea revisada por personal competente. No intente determinar por fotografías o por el tamaño de una grieta si el inmueble es seguro. Si tiene dudas, solicite revisión por la línea 119.",
    expiresAt: null,
    source:
      "Comunicado oficial de la Alcaldía de Manizales y lineamientos del Cuerpo Oficial de Bomberos",
  },
  {
    title: "No llevar alimentos a los albergues por ahora",
    description:
      "Hay alimentos suficientes para atender a la población albergada. No lleve más alimentos hasta nuevo aviso oficial.",
    expiresAt: null,
    source:
      "https://centrodeinformacion.manizales.gov.co/comunicado-de-prensa-sobre-no-llevar-alimentos-a-los-albergues-por-ahora/",
  },
  {
    title: "Cable Aéreo fuera de servicio",
    description:
      "Las tres líneas del Cable Aéreo de Manizales están fuera de servicio mientras se realizan inspecciones técnicas.",
    expiresAt: null,
    source:
      "https://centrodeinformacion.manizales.gov.co/cable-aereo-manizales-adelanta-evaluacion-tecnica-tras-afectacion-en-el-sistema/",
  },
] as const;

export function getActiveAlerts(now: Date): readonly Alert[] {
  return ALERTS.filter(
    (alert) => alert.expiresAt === null || new Date(alert.expiresAt) > now,
  );
}

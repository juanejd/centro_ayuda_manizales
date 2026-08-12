import {
  CircleHelp,
  Droplet,
  Flame,
  Gift,
  HardHat,
  HeartPulse,
  Landmark,
  Package,
  Phone,
  PawPrint,
  ShieldCheck,
  Stethoscope,
  Tent,
  TrafficCone,
  UserSearch,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { ResourceCategory } from "@/modules/info-resources/domain";

// Purely presentational, mirrors help-requests/components/category-icon.tsx.
export const RESOURCE_CATEGORY_ICONS: Record<ResourceCategory, LucideIcon> = {
  albergues: Tent,
  hospitales: Stethoscope,
  centros_medicos: Stethoscope,
  donacion_sangre: Droplet,
  puntos_donacion: Gift,
  centros_acopio: Package,
  atencion_mascotas: PawPrint,
  personas_desaparecidas: UserSearch,
  evaluacion_viviendas: HardHat,
  servicios_publicos: Zap,
  bomberos: Flame,
  defensa_civil: ShieldCheck,
  cruz_roja: HeartPulse,
  alcaldias: Landmark,
  gobernacion: Landmark,
  lineas_atencion: Phone,
  cierres_viales: TrafficCone,
  otros: CircleHelp,
};

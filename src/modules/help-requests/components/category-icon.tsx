import {
  Accessibility,
  Brain,
  Car,
  CircleHelp,
  Droplet,
  HardHat,
  Home,
  PawPrint,
  Stethoscope,
  Tent,
  UserSearch,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { HelpRequestCategory } from "@/modules/help-requests/domain/validation";

// Purely presentational — kept out of domain/validation.ts on purpose,
// since that module is framework-agnostic by its own doc comment.
export const CATEGORY_ICONS: Record<HelpRequestCategory, LucideIcon> = {
  salud: Stethoscope,
  vivienda: Home,
  albergue: Tent,
  alimentos: UtensilsCrossed,
  agua: Droplet,
  sangre: Droplet,
  mascotas: PawPrint,
  movilidad: Accessibility,
  servicios_publicos: Zap,
  personas_desaparecidas: UserSearch,
  atencion_psicologica: Brain,
  transporte: Car,
  remocion_escombros: HardHat,
  otros: CircleHelp,
};

[Índice](./README.md) · Siguiente: [Fase 1 — Datos](./fase-1-datos.md)

# Fase 0 — Andamiaje

Crea una base mínima y reproducible para empezar el MVP. No anticipa dominios, rutas futuras ni automatización de entrega.

| Tema | Decisión |
| --- | --- |
| Entrega | Next.js con App Router, TypeScript estricto, Tailwind, shadcn y Supabase solo de servidor |
| Depende de | — |
| Requisitos del TRD | §5.1, §5.2, §5.3, RNF-4.1 |

## Ruta rápida

1. Generar el proyecto `frontend` con el comando oficial de Next.js.
2. Inicializar shadcn con sus rutas alineadas a `src/shared/`.
3. Añadir clientes de Supabase exclusivos del servidor y validar sus variables de entorno.
4. Confirmar `lint`, `typecheck` y `build` localmente.

## Unidades de trabajo

| ID | Entrega | Comprobación |
| --- | --- | --- |
| 0.1 | Proyecto oficial Next.js, TypeScript estricto y Tailwind | La aplicación compila sin modificar los archivos generados innecesariamente |
| 0.2 | shadcn y una primitiva `Button` en `src/shared/ui` | El componente se importa desde el alias configurado |
| 0.3 | Variables y clientes de Supabase solo de servidor | No existe ninguna credencial bajo un prefijo público |
| 0.4 | Guía breve de contribución | Una persona puede instalar, configurar y verificar el proyecto con los comandos documentados |

### Mantener el andamiaje pequeño

Las carpetas de módulos aparecen cuando una fase implementa ese dominio. Crear directorios vacíos, rutas futuras o capas sin consumidor aumenta el costo de navegación sin entregar valor.

Las credenciales de Supabase permanecen en módulos marcados con `server-only`. La clave secreta nunca se importa desde un Client Component ni usa un prefijo que la exponga al navegador.

## Verificación

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
```

Comprobación manual:

- `pnpm dev` muestra la ruta principal sin errores.
- La documentación enumera exactamente las variables requeridas.
- El código cliente no contiene claves de Supabase.

## Definición de terminado

- [ ] El proyecto se llama `frontend` y proviene del generador oficial.
- [ ] TypeScript estricto, Tailwind y App Router están activos.
- [ ] shadcn genera sus componentes en `src/shared/ui`.
- [ ] Los clientes de Supabase solo pueden ejecutarse en el servidor.
- [ ] No existen carpetas de dominios futuros ni rutas vacías.
- [ ] `lint`, `typecheck` y `build` terminan correctamente.
- [ ] La configuración necesaria está documentada sin exponer secretos.

## Frontera de reversión

La fase se retira eliminando el andamiaje de Next.js y `src/shared/`. No incluye infraestructura de entrega ni carpetas adicionales.

## Siguiente paso

[Fase 1 — Datos](./fase-1-datos.md)

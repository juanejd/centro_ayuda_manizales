[← Índice](./README.md) · Siguiente: [Fase 1 — Datos](./fase-1-datos.md)

# Fase 0 — Andamiaje

Deja el repositorio en un estado donde las dos formas más fáciles de romper esta plataforma —filtrar una clave de Supabase al navegador y engordar el JavaScript— **rompen la compilación**. No entrega ninguna pantalla al usuario; entrega el suelo sobre el que las demás fases no pueden equivocarse en silencio.

| | |
| --- | --- |
| **Entrega** | Proyecto Next.js con TypeScript estricto, clientes de Supabase solo de servidor, arnés de pruebas y CI con dos guardas |
| **Depende de** | Nada |
| **Requisitos del TRD** | §4.1, §4.2, §4.3, §4.4, §7.2, RNF-5.1 |
| **Tamaño estimado** | ~250 líneas · un solo PR |

## Ruta rápida

1. Crear el proyecto Next.js sin sobrescribir `README.md`, el documento MVP ni `docs/`.
2. Escribir la prueba que falla porque no existe el guardián de variables de entorno, y luego escribirlo.
3. Confirmar que `pnpm build` falla si se expone una clave o si se supera el presupuesto de peso.

---

## Unidades de trabajo

| ID | Commit | Entrega | Prueba primero |
| --- | --- | --- | --- |
| 0.1 | `chore(setup): scaffold Next.js app with strict TypeScript and Tailwind` | Proyecto base, `tsconfig` estricto, estructura de carpetas de §4.4 | `pnpm typecheck` y `pnpm build` pasan en verde |
| 0.1b | `chore(setup): pin pnpm as the package manager` | Campo `packageManager` en `package.json`, `.npmrc`, lockfile versionado | CI falla si alguien commitea `package-lock.json` o `yarn.lock` |
| 0.2 | `feat(config): add server-only Supabase clients and env contract` | `shared/supabase/{server,service-role}.ts`, esquema Zod de variables de entorno | Test unitario: el esquema rechaza un entorno sin `SUPABASE_URL`, y **rechaza cualquier clave con prefijo `NEXT_PUBLIC_SUPABASE_`** |
| 0.3 | `feat(ci): fail the build when a Supabase key reaches the client bundle` | Script `check:env` que inspecciona el bundle de cliente | Test: con un archivo señuelo que importa la clave desde el cliente, el script sale con código distinto de cero |
| 0.4 | `feat(ci): enforce the per-route weight budget` | Guarda de presupuesto según §7.2, integrada en `build` | Test: una ruta artificial que excede su presupuesto falla la compilación |
| 0.5 | `chore(test): add Vitest and Playwright harness with a disposable database` | Vitest unitario y de integración, Playwright, utilidad que levanta una base de datos desechable | Prueba de humo que crea la base, aplica un `CREATE TABLE` trivial y la destruye |
| 0.6 | `ci: run typecheck, lint, tests and build on every push` | Flujo de CI | El flujo corre en verde sobre el commit anterior |

### 0.1 y 0.1b — pnpm fijado, no sugerido

```bash
pnpm dlx create-next-app@latest . \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-pnpm
```

Tres cosas quedan fijadas para que nadie instale con otro gestor por costumbre:

| Dónde | Qué | Por qué |
| --- | --- | --- |
| `package.json` | `"packageManager": "pnpm@<versión>"` | Corepack usa la versión exacta. Elimina el «en mi máquina sí funciona» por diferencias de resolución |
| `.npmrc` | `engine-strict=true` | Falla al instalar con un gestor o una versión de Node distintos |
| CI | Comprobación de lockfile | `pnpm install --frozen-lockfile`, y falla si aparece `package-lock.json` o `yarn.lock` |

`--frozen-lockfile` en CI es lo que convierte el lockfile en una garantía y no en una sugerencia: una dependencia que cambie sin actualizar el lockfile rompe la compilación en lugar de entrar sin que nadie lo note.

### 0.2 — El detalle que importa

Los dos clientes son distintos y no se pueden confundir:

| Archivo | Clave | Uso permitido |
| --- | --- | --- |
| `shared/supabase/server.ts` | `anon` | Lecturas públicas e `INSERT` de los formularios. Respeta RLS. |
| `shared/supabase/service-role.ts` | `service_role` | Solo gestión por token y barridas de caducidad. Salta RLS. |

`service-role.ts` debe llevar `import 'server-only'` en su primera línea. Si alguien lo importa desde un componente de cliente, la compilación falla en lugar de filtrar una clave con permisos totales.

El esquema de variables de entorno **prohíbe activamente** el prefijo `NEXT_PUBLIC_SUPABASE_`. No basta con no usarlo: hay que hacer imposible añadirlo sin que algo se rompa, porque es exactamente el error que un colaborador nuevo cometería siguiendo cualquier tutorial de Supabase.

### 0.3 — Cómo se prueba una guarda

Una guarda que nunca se ha visto fallar no está probada. La prueba crea un archivo temporal que importa la clave desde un Client Component, compila, y verifica que `check:env` la detecta. Después lo borra. Sin ese paso, la guarda podría estar mirando la carpeta equivocada durante meses.

---

## Verificación

```bash
pnpm typecheck && pnpm lint && pnpm test:unit && pnpm build
pnpm check:env                      # esperado: exit 0, sin coincidencias
pnpm test:db -- --run smoke         # esperado: base creada, migrada y destruida
```

Comprobación manual de que la guarda muerde:

```bash
# 1. Exponer una clave a propósito en un Client Component
# 2. pnpm build
# Esperado: la compilación falla y el mensaje nombra el archivo culpable
# 3. Revertir
```

---

## Definición de terminado

- [ ] `README.md`, el documento MVP y `docs/` intactos.
- [ ] `tsconfig.json` con `strict: true` y sin `any` implícitos.
- [ ] Existen `shared/supabase/server.ts` y `shared/supabase/service-role.ts`, el segundo con `import 'server-only'`.
- [ ] Ninguna variable de entorno de Supabase lleva el prefijo `NEXT_PUBLIC_`.
- [ ] El esquema de entorno rechaza ese prefijo con una prueba que lo demuestra.
- [ ] `pnpm build` falla ante una clave expuesta. Demostrado, no supuesto.
- [ ] `pnpm build` falla ante una ruta que excede su presupuesto. Demostrado.
- [ ] La utilidad de base de datos desechable crea, migra y destruye sin residuos.
- [ ] CI corre `typecheck`, `lint`, `test:unit`, `test:db`, `build` en cada push.
- [ ] `.env.example` documenta cada variable, sin ningún valor real.

## Frontera de reversión

Toda la fase se retira borrando los archivos de configuración raíz, `src/shared/`, `.github/workflows/` y el directorio de pruebas. No hay dependencias de otras fases porque es la primera.

## Siguiente paso

[Fase 1 — Datos](./fase-1-datos.md)

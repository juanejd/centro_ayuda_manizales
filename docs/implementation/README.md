# Implementación — Centro de Ayuda Manizales

Nueve fases, cada una desplegable por sí sola. Este documento define las reglas que aplican a todas; cada fase tiene su propio documento con sus unidades de trabajo, pruebas y criterios de cierre.

**Empieza aquí:** [Fase 0 — Andamiaje](./fase-0-andamiaje.md).

La especificación es [`docs/TRD.md`](../TRD.md). Este documento no la repite: la traduce a trabajo ejecutable. Si algo se contradice, manda el TRD.

| | |
| --- | --- |
| **Cobertura** | Municipio de Manizales, urbano y rural. No se pide el municipio en ningún formulario |
| **Eje geográfico** | Comuna. La persona escribe su barrio y el sistema deriva la comuna |
| **Gestor de paquetes** | pnpm, fijado en `package.json` y verificado en CI |

---

## Las nueve fases

| Fase | Entrega | Depende de | Documento |
| --- | --- | --- | --- |
| 0 | Andamiaje, clientes de Supabase solo de servidor, CI con guardas | — | [fase-0-andamiaje.md](./fase-0-andamiaje.md) |
| 1 | Migraciones, vista pública, RLS, buckets, semillas | 0 | [fase-1-datos.md](./fase-1-datos.md) |
| 2 | Pantalla principal y líneas de emergencia | 0 | [fase-2-pantalla-principal.md](./fase-2-pantalla-principal.md) |
| 3 | Busco Información | 1, 2 | [fase-3-directorio.md](./fase-3-directorio.md) |
| 4 | Necesito Ayuda, tablero público y gestión de la publicación | 1, 2 | [fase-4-publicacion-y-tablero.md](./fase-4-publicacion-y-tablero.md) |
| 5 | Motor de emparejamiento | 4, D-3 | [fase-5-emparejamiento.md](./fase-5-emparejamiento.md) |
| 6 | Quiero Ayudar con emparejamiento en vivo | 5 | [fase-6-quiero-ayudar.md](./fase-6-quiero-ayudar.md) |
| 7 | Moderación y aviso de privacidad | 4, 6, D-1 | [fase-7-moderacion.md](./fase-7-moderacion.md) |
| 8 | PWA, conservación de datos y auditorías | todas | [fase-8-endurecimiento.md](./fase-8-endurecimiento.md) |

### Por qué este orden

**El directorio (fase 3) va antes del tablero (fase 4).** Es el único módulo que entrega valor sin requerir masa crítica de usuarios ni un operador humano al otro lado. Si el proyecto se detuviera después de la fase 3, lo entregado seguiría sirviendo.

**La fase 4 es indivisible.** Publicar teléfonos y fotos sin el mecanismo de retiro dejaría a las personas sin forma de revertir su exposición, y sin la limpieza de metadatos publicaría la ubicación exacta de sus viviendas. Se puede partir en varios PR, nunca en varios despliegues.

**El emparejamiento (fase 5) es una fase propia y no parte de la fase 6.** Es lógica pura, sin interfaz, y se prueba exhaustivamente por sí sola. Mezclarla con el formulario haría que un error de correspondencia se descubriera mirando una pantalla en lugar de leyendo un test.

---

## Reglas que aplican a todas las fases

### Desarrollo guiado por pruebas

La prueba se escribe antes del código de producción, siempre. En cada unidad de trabajo, la columna **Prueba primero** dice qué prueba debe existir y fallar antes de escribir la implementación.

| Tipo | Herramienta | Cuándo |
| --- | --- | --- |
| Unitaria | Vitest | Lógica pura: generadores, validadores, emparejamiento, utilidades |
| Integración | Vitest contra una base de datos real y desechable | Migraciones, RLS, privilegios, vistas, Server Actions |
| Extremo a extremo | Playwright | Recorridos de usuario, degradación sin JavaScript, accesibilidad |

**Las pruebas de seguridad no son opcionales ni se dejan para el final.** Toda unidad que toque RLS, privilegios o la vista pública lleva su prueba en el mismo commit. La seguridad de esta plataforma vive en la base de datos, así que probarla exige una base de datos, no un mock.

### Unidades de trabajo y commits

| Regla | Requisito |
| --- | --- |
| Un commit es una unidad de entrega | Un comportamiento, una migración, una corrección. Nunca «añadir modelos» y luego «añadir servicios». |
| Las pruebas viajan con el código | En el mismo commit que el comportamiento que verifican. |
| La documentación viaja con el cambio visible | En el mismo commit que la funcionalidad que explica. |
| El repositorio tiene sentido tras cada commit | Si solo se aplica ese commit, nada queda a medias. |
| Commits convencionales | `feat(scope):`, `fix(scope):`, `test(scope):`, `chore(scope):`, `docs(scope):` |
| Reversión limpia | Cada unidad declara qué se puede quitar sin arrastrar trabajo ajeno. |

### Umbral de 800 líneas

Si una fase supera las 800 líneas modificadas (añadidas más eliminadas, sin contar archivos generados), sus unidades se agrupan en PR encadenados **antes** de empezar a implementar, no después.

Con ese presupuesto, solo la fase 4 lo excede y llega con su corte en tres PR ya propuesto. La fase 7 cabe en un PR; su división en 7-A y 7-B queda como opción de revisión, no como obligación.

### Evidencia de implementación

Cada unidad de trabajo se cierra registrando tres cosas. Sin ellas, la unidad no está terminada:

1. **Comando de prueba enfocado y su resultado exacto.**
2. **Comprobación en ejecución real y su resultado**, o `N/A` con el motivo cuando la unidad no tiene frontera de ejecución.
3. **Frontera de reversión:** qué archivos o comportamiento se pueden retirar sin tocar nada más.

### Idioma

Interfaz en español de Colombia, registro neutro y llano. Código, identificadores, nombres de archivo, comentarios, mensajes de commit y pruebas en inglés. Sin excepciones, para que el código sea legible por cualquier colaborador.

### Convención de rutas y nombres

```
src/modules/<dominio>/
  domain/      tipos, vocabularios, esquemas Zod, lógica pura — sin dependencias de framework
  actions/     Server Actions — la única puerta de escritura
  queries/     lecturas de servidor
  components/  presentación
```

`domain/` no importa de `actions/`, `queries/` ni `components/`. Es la capa que se prueba sin levantar nada.

---

## Antes de empezar: lo que necesito de la organización

Ninguno de estos puntos bloquea escribir código. Los tres primeros bloquean **publicar**; el cuarto bloquea completar la semilla de la fase 1.

| # | Qué necesito | Bloquea | Fase |
| --- | --- | --- | --- |
| D-1 | La entidad jurídica responsable del tratamiento de datos personales, para el aviso de privacidad | Publicar | 7 |
| D-2 | Quién modera, con qué frecuencia y con qué compromiso de respuesta | Publicar | 7 |
| D-3 | Confirmación de la tabla de emparejamiento del TRD §6, en particular que Sangre y Personas desaparecidas queden fuera | Implementar la fase 5 | 5 |
| **Datos** | **Comunas y corregimientos de Manizales**; **catálogo de barrios con su comuna**, que alimenta el autocompletado; **números de las líneas de emergencia**; **listado inicial de albergues, hospitales y puntos de donación** con su fuente y fecha de verificación | Completar la semilla | 1 |

La fase 1 se puede implementar con una semilla mínima —las once comunas, unos pocos barrios y una línea de emergencia— y completarse después. El catálogo de barrios degrada solo: uno que falte deja la zona sin asignar, que es un caso ya previsto y no un error.

Lo que no se puede es inventar esos datos. En una emergencia, un teléfono equivocado en el directorio hace daño real.

---

## Verificación transversal

Estos comandos deben pasar en cualquier momento del proyecto, no solo al final de una fase.

El gestor de paquetes es **pnpm**, fijado con el campo `packageManager` de `package.json` y verificado en CI con `--frozen-lockfile`. Instalar con npm o yarn falla.

```bash
pnpm install --frozen-lockfile
pnpm typecheck        # tsc --noEmit, modo estricto
pnpm lint             # ESLint
pnpm test:unit        # Vitest, lógica pura
pnpm test:db          # Vitest contra base de datos desechable
pnpm test:e2e         # Playwright
pnpm build            # incluye la guarda de presupuesto de peso
pnpm check:env        # falla si alguna clave de Supabase llega al cliente
```

`pnpm check:env` y la guarda de presupuesto son parte de `build` a propósito: son las dos formas más fáciles de romper la seguridad y el rendimiento de esta plataforma sin darse cuenta, así que deben romper la compilación, no aparecer en un informe que nadie lee.

---

## Siguiente paso

[Fase 0 — Andamiaje](./fase-0-andamiaje.md)

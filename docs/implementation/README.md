# Implementación — Centro de Ayuda Manizales

Siete fases incrementales para entregar un MVP útil durante una emergencia real, sin infraestructura que el proyecto no necesita.

**Empieza aquí:** [Fase 0 — Andamiaje](./fase-0-andamiaje.md).

La especificación es [`docs/TRD.md`](../TRD.md). Si hay contradicción, manda el TRD.

## Qué se está construyendo

Un tablero de publicaciones con dos ámbitos que actúan sobre él, más una sección informativa.

| Ámbito | Qué hace |
| --- | --- |
| **Necesito ayuda** | Escribe la publicación |
| **Quiero ayudar** | Filtra el tablero. No registra a nadie |
| **Centro de información** | Contenido institucional verificado |

Tenerlo presente evita el error más caro de este proyecto: tratar «Quiero ayudar» como un módulo de registro con su tabla, su código de radicado y su bandeja. Es un formulario `GET` sobre el tablero.

| Tema | Decisión |
| --- | --- |
| Cobertura | Municipio de Manizales, urbano y rural. Ningún formulario pide el municipio |
| Eje geográfico | Comuna. La persona escribe su barrio y el sistema deriva la comuna |
| Gestor de paquetes | pnpm, fijado en `package.json` |
| Verificación base | `pnpm lint`, `pnpm typecheck` y `pnpm build` |
| Datos de origen | [`base_verificada_emergencia_sismo_manizales_2026-08-10.md`](../../base_verificada_emergencia_sismo_manizales_2026-08-10.md) |

## Las siete fases

| Fase | Entrega | Depende de | Documento |
| --- | --- | --- | --- |
| 0 | Next.js, shadcn y clientes de Supabase solo de servidor | — | [fase-0-andamiaje.md](./fase-0-andamiaje.md) |
| 1 | Migraciones, vista pública, RLS, buckets y semilla verificada | 0 | [fase-1-datos.md](./fase-1-datos.md) |
| 2 | Pantalla principal y líneas de emergencia | 0, 1 | [fase-2-pantalla-principal.md](./fase-2-pantalla-principal.md) |
| 3 | Centro de información: directorio, alertas, guía de actuación | 1, 2 | [fase-3-centro-de-informacion.md](./fase-3-centro-de-informacion.md) |
| 4 | Necesito ayuda, tablero y gestión de la publicación | 1, 2 | [fase-4-publicacion-y-tablero.md](./fase-4-publicacion-y-tablero.md) |
| 5 | Quiero ayudar: filtro guiado | 4, D-3 | [fase-5-quiero-ayudar.md](./fase-5-quiero-ayudar.md) |
| 6 | Moderación y aviso de privacidad | 4, 5, D-1, D-2 | [fase-6-moderacion.md](./fase-6-moderacion.md) |

### Por qué este orden

**El centro de información (fase 3) va antes del tablero (fase 4).** Entrega valor sin requerir masa crítica de usuarios ni un operador humano, y su contenido ya está verificado y disponible en el repositorio.

**La fase 4 es indivisible.** Publicar teléfonos y fotos sin retiro ni limpieza de metadatos dejaría una exposición irreversible. Puede dividirse para revisión, pero se despliega completa.

**La fase 5 es pequeña.** Un formulario `GET`, una tabla de traducción en código y una consulta.

## Los dos regímenes de información

El error de interfaz más grave que puede cometer este proyecto es que alguien confunda un albergue confirmado por la Alcaldía con uno que un desconocido escribió en un formulario.

| | Institucional | Ciudadana |
| --- | --- | --- |
| Origen | Fuente oficial obligatoria | Cualquiera, sin cuenta |
| Publicación | Solo si hay confirmación | Inmediata |
| Criterio | Precisión sobre velocidad | Velocidad sobre precisión |
| Superficie | Centro de información | Tablero |

Comparten la anatomía de tarjeta del TRD §7.1, pero la franja codifica cosas distintas y la etiqueta siempre lleva texto.

## Reglas para todas las fases

### Implementar solo lo necesario

- Cada fase entrega comportamiento utilizable; no crea carpetas, abstracciones ni configuración para fases futuras.
- La verificación es proporcional al cambio: compilación y comprobaciones locales concretas.
- Las reglas de base de datos se comprueban aplicando las migraciones y consultando con los roles afectados.
- Los recorridos de interfaz se revisan en el navegador, con teclado, zoom al 200 % y JavaScript deshabilitado cuando el TRD lo exige.

### Nunca inventar un dato

El documento de origen lo dice y es una regla de implementación, no una recomendación: cuando un dato no está confirmado se muestra **«No se encontró información oficial confirmada hasta la última verificación»**, nunca una tarjeta vacía ni un valor de relleno.

### Unidades de trabajo

| Regla | Requisito |
| --- | --- |
| Una unidad es una entrega | Un comportamiento, una migración, una corrección o su documentación |
| La documentación acompaña el cambio | Se actualiza junto con la funcionalidad que explica |
| El repositorio queda coherente | Nada queda a medias al cerrar una unidad |
| Commits convencionales | `feat(scope):`, `fix(scope):`, `chore(scope):`, `docs(scope):` |
| Reversión limpia | Cada fase declara qué se puede retirar sin arrastrar trabajo ajeno |

### Evidencia mínima

Cada unidad registra los comandos ejecutados y su resultado, la comprobación manual o de base de datos relevante, y la frontera de reversión.

### Idioma

Interfaz en español de Colombia, registro neutro y llano. Código, identificadores, nombres de archivo, comentarios y mensajes de commit en inglés.

### Estructura

Las carpetas de dominio se crean cuando una fase incorpora lógica que las necesita, no antes.

```text
src/modules/<domain>/
  domain/      tipos, vocabularios, esquemas y lógica pura
  actions/     escrituras de servidor
  queries/     lecturas de servidor
  components/  presentación
```

`domain/` no importa de `actions/`, `queries/` ni `components/`. Un módulo no importa de otro.

## Antes de publicar

| # | Dato necesario | Bloquea | Fase |
| --- | --- | --- | --- |
| D-1 | Entidad jurídica responsable del tratamiento | Publicación | 6 |
| D-2 | Personas responsables de moderar y tiempo de respuesta | Publicación | 6 |
| D-3 | Confirmación de la tabla de traducción del TRD §9 | Fase 5 | 5 |
| Datos | Comunas, corregimientos y catálogo de barrios | Semilla completa | 1 |

## Verificación transversal

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
```

Cuando una fase toca Supabase se aplican sus migraciones y se revisa el esquema resultante. Cuando toca interfaz se inicia `pnpm dev` y se recorre el caso principal en un viewport móvil, con teclado y zoom al 200 %.

## Siguiente paso

[Fase 0 — Andamiaje](./fase-0-andamiaje.md)

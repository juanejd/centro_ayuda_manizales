# Implementación — Centro de Ayuda Manizales

Nueve fases incrementales para entregar un MVP útil sin infraestructura ni herramientas que el proyecto todavía no necesita.

**Empieza aquí:** [Fase 0 — Andamiaje](./fase-0-andamiaje.md).

La especificación es [`docs/TRD.md`](../TRD.md). Estos documentos convierten sus requisitos en trabajo ejecutable; si hay una contradicción, manda el TRD.

| Tema | Decisión |
| --- | --- |
| Cobertura | Municipio de Manizales, urbano y rural. Ningún formulario pide el municipio |
| Eje geográfico | Comuna. La persona escribe su barrio y el sistema deriva la comuna |
| Gestor de paquetes | pnpm, fijado en `package.json` |
| Verificación base | `pnpm lint`, `pnpm typecheck` y `pnpm build` |

## Las nueve fases

| Fase | Entrega | Depende de | Documento |
| --- | --- | --- | --- |
| 0 | Next.js, shadcn y clientes de Supabase solo de servidor | — | [fase-0-andamiaje.md](./fase-0-andamiaje.md) |
| 1 | Migraciones, vista pública, RLS, buckets y semillas | 0 | [fase-1-datos.md](./fase-1-datos.md) |
| 2 | Pantalla principal y líneas de emergencia | 0, 1 para el directorio | [fase-2-pantalla-principal.md](./fase-2-pantalla-principal.md) |
| 3 | Busco Información | 1, 2 | [fase-3-directorio.md](./fase-3-directorio.md) |
| 4 | Necesito Ayuda, tablero público y gestión de la publicación | 1, 2 | [fase-4-publicacion-y-tablero.md](./fase-4-publicacion-y-tablero.md) |
| 5 | Motor de emparejamiento | 4, D-3 | [fase-5-emparejamiento.md](./fase-5-emparejamiento.md) |
| 6 | Quiero Ayudar con emparejamiento en vivo | 5 | [fase-6-quiero-ayudar.md](./fase-6-quiero-ayudar.md) |
| 7 | Moderación y aviso de privacidad | 4, 6, D-1 | [fase-7-moderacion.md](./fase-7-moderacion.md) |
| 8 | PWA, conservación de datos y revisión final | Todas | [fase-8-endurecimiento.md](./fase-8-endurecimiento.md) |

### Por qué este orden

**El directorio (fase 3) va antes del tablero (fase 4).** Entrega valor sin requerir masa crítica de usuarios ni un operador humano al otro lado.

**La fase 4 es indivisible.** Publicar teléfonos y fotos sin retiro ni limpieza de metadatos dejaría una exposición irreversible. Puede dividirse para revisión, pero se despliega completa.

**El emparejamiento (fase 5) es una fase propia.** Es lógica de negocio independiente de la interfaz y debe ser comprensible antes de conectarla al formulario.

## Reglas para todas las fases

### Implementar solo lo necesario

- Cada fase entrega comportamiento utilizable; no crea carpetas, abstracciones ni configuración para fases futuras.
- La verificación es proporcional al cambio: compilación y comprobaciones locales concretas.
- Las reglas de seguridad de base de datos se comprueban aplicando las migraciones y ejecutando consultas con los roles afectados.
- Los recorridos de interfaz se revisan manualmente en el navegador, con teclado, zoom y JavaScript deshabilitado cuando el TRD lo exige.

### Unidades de trabajo

| Regla | Requisito |
| --- | --- |
| Una unidad es una entrega | Un comportamiento, una migración, una corrección o su documentación |
| La documentación acompaña el cambio | Se actualiza junto con la funcionalidad que explica |
| El repositorio queda coherente | Nada queda a medias al cerrar una unidad |
| Commits convencionales | `feat(scope):`, `fix(scope):`, `chore(scope):`, `docs(scope):` |
| Reversión limpia | Cada fase declara qué se puede retirar sin arrastrar trabajo ajeno |

### Evidencia mínima

Cada unidad registra:

1. Los comandos locales ejecutados y su resultado.
2. La comprobación manual o de base de datos relevante.
3. La frontera de reversión.

### Idioma

Interfaz en español de Colombia, con registro neutro y llano. Código, identificadores, nombres de archivo, comentarios y mensajes de commit en inglés.

### Estructura

Las carpetas de dominio se crean cuando una fase incorpora lógica que las necesita, no antes.

```text
src/modules/<domain>/
  domain/      tipos, vocabularios, esquemas y lógica pura
  actions/     escrituras de servidor
  queries/     lecturas de servidor
  components/  presentación
```

`domain/` no importa de `actions/`, `queries/` ni `components/`. Un módulo no importa de otro salvo la excepción de emparejamiento documentada en el TRD.

## Antes de publicar

| # | Dato necesario | Bloquea | Fase |
| --- | --- | --- | --- |
| D-1 | Entidad jurídica responsable del tratamiento de datos | Publicación | 7 |
| D-2 | Personas responsables de moderar y tiempo de respuesta | Publicación | 7 |
| D-3 | Confirmación de la tabla de emparejamiento del TRD §6 | Fase 5 | 5 |
| Datos | Comunas, barrios, líneas de emergencia y directorio inicial con fuente y fecha | Semilla completa | 1 |

## Verificación transversal

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
```

Cuando una fase toca Supabase, se aplican sus migraciones con la CLI y se revisa el esquema resultante. Cuando toca interfaz, se inicia `pnpm dev` y se recorre el caso principal en un teléfono o viewport móvil, con teclado y zoom al 200 %.

## Siguiente paso

[Fase 0 — Andamiaje](./fase-0-andamiaje.md)

[← Fase 4](./fase-4-publicacion-y-tablero.md) · [Índice](./README.md) · Siguiente: [Fase 6 — Quiero Ayudar](./fase-6-quiero-ayudar.md)

# Fase 5 — Motor de emparejamiento

Lógica pura, sin una sola pantalla. Traduce «tengo maquinaria» a «estas necesidades de remoción de escombros y de movilidad te sirven». Es una fase propia y no parte de la fase 6 por una razón concreta: **la correspondencia debe poder revisarse directamente en una tabla pequeña y explícita.**

| | |
| --- | --- |
| **Entrega** | Tabla de correspondencia, resolutor, consulta acotada, Route Handler |
| **Depende de** | Fase 4 y la decisión **D-3** |
| **Requisitos del TRD** | §6 completa, RF-3.5, RNF-1.3, RNF-5.3, RNF-5.4 |
| **Tamaño estimado** | ~220 líneas · un solo PR |

> **Bloqueada por D-3.** La tabla de correspondencia del TRD §6 necesita confirmación de la organización, en particular que Sangre y Personas desaparecidas queden fuera del emparejamiento. Implementar sobre una tabla no confirmada significa rehacer la lógica después.

## Ruta rápida

1. Confirmar las catorce filas de la tabla del TRD §6.
2. Implementar un resolutor legible y recorrer cada correspondencia.
3. La consulta y el endpoint, con tope de filas y límite de tasa.

---

## Unidades de trabajo

| ID | Commit | Entrega | Comprobación |
| --- | --- | --- | --- |
| 5.1 | `feat(matching): add the contribution-to-category resolver` | Tabla en `modules/matching/domain`, función resolutora | **Recorrer cada una de las 14 filas** del TRD §6. Comprobar: Dinero devuelve conjunto vacío. Comprobar: Tiempo como voluntario y Otro devuelven todas las categorías. Comprobar: **Sangre y Personas desaparecidas no son alcanzables por ningún tipo de aporte** |
| 5.2 | `feat(matching): add the bounded matching query` | Consulta contra `public_help_requests` | Comprobar en base de datos: filtra por las categorías resueltas y por comuna. Comprobar: **sin comuna, incluye las necesidades con zona sin asignar**. Comprobar: **devuelve como máximo 20 filas con cualquier entrada**. Comprobar: no incluye retiradas, ocultas ni caducadas |
| 5.3 | `feat(matching): expose the live filter route handler` | `app/api/necesidades/route.ts` con límite de tasa | Comprobar el contrato: parámetros inválidos responden 400 con un cuerpo predecible. Comprobar: la respuesta **no contiene ninguna columna ausente de la vista pública**. Comprobar: la petición 61 en un minuto responde 429 |
| 5.4 | `chore(matching): keep both vocabularies in sync` | Guarda de coherencia | Comprobar: **toda categoría del vocabulario de necesidades aparece en la tabla o está en la lista explícita de exclusiones.** Añadir una categoría nueva sin decidir su correspondencia rompe la compilación |

### 5.1 — Catorce correspondencias explícitas

Cada tipo de aporte debe tener una correspondencia con nombre explícito. Así una revisión muestra directamente qué categorías devuelve cada entrada:

```
✗ maquinaria matches remocion_escombros and movilidad
```

La tabla vive en código, no en base de datos. Es lógica de negocio versionada y revisable en un diff, no un dato editable en producción. Cambiarla exige un PR, y eso es deseable: es la lógica que decide qué ayuda llega a quién.

### 5.4 — La guarda que protege el futuro

Esta es la unidad menos obvia y la más valiosa a largo plazo. Cuando alguien añada una categoría de necesidad nueva —y en una emergencia real ocurrirá— hay dos posibilidades: que decida a qué aportes corresponde, o que la olvide y esa categoría quede invisible para todos los aportantes, sin ningún error.

La guarda obliga a la decisión: toda categoría debe estar en la tabla **o** en la lista explícita de exclusiones, que hoy contiene Sangre y Personas desaparecidas. Olvidarla rompe la compilación.

### 5.3 — El endpoint hereda la seguridad de la vista

El Route Handler consulta la vista pública, nunca la tabla. Eso significa que no puede filtrar una columna sensible aunque se programe mal, porque la columna no existe en su origen. La comprobación también compara el conjunto de claves de la respuesta contra el conjunto de columnas de la vista y falla ante cualquier extra.

Es el único endpoint de API de la plataforma. Todo lo demás son Server Components y Server Actions.

---

## Verificación

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

Comprobaciones manuales:

```bash
# Tope de filas con cualquier parámetro.
curl -s 'localhost:3000/api/necesidades?contribution=alimentos&comuna=tesorito&limit=999' | jq 'length'

# Límite de tasa.
for i in $(seq 1 61); do curl -s -o /dev/null -w '%{http_code} ' \
  'localhost:3000/api/necesidades?contribution=agua&comuna=tesorito'; done
```

El resolutor se recorre con las catorce entradas de la tabla confirmada: cada resultado debe coincidir con el TRD, las exclusiones deben permanecer explícitas y la respuesta de la API no debe contener campos ajenos a la vista pública.

---

## Definición de terminado

- [ ] La tabla del TRD §6 está implementada fila por fila.
- [ ] Dinero no empareja con nada.
- [ ] Tiempo como voluntario y Otro emparejan con todas las categorías.
- [ ] Sangre y Personas desaparecidas no son alcanzables por ningún tipo de aporte, y eso queda explícito en la tabla.
- [ ] Existe la lista explícita de categorías excluidas del emparejamiento.
- [ ] Añadir una categoría nueva sin decidir su correspondencia rompe la compilación.
- [ ] La tabla vive en código, no en base de datos.
- [ ] La consulta devuelve 20 filas como máximo con cualquier entrada.
- [ ] La consulta nunca incluye retiradas, ocultas ni caducadas.
- [ ] El endpoint responde 400 ante parámetros inválidos, con un cuerpo predecible.
- [ ] La respuesta no contiene ninguna clave ausente de la vista pública. Comprobado por comparación de conjuntos.
- [ ] El límite de tasa responde 429 tras 60 lecturas en un minuto.
- [ ] El percentil 95 de latencia es 400 ms o menos.
- [ ] D-3 confirmada por la organización.

## Frontera de reversión

Se retira eliminando `modules/matching/` y `app/api/necesidades/`. Nada depende todavía de esta fase: la 6 es su primer consumidor.

## Siguiente paso

[Fase 6 — Quiero Ayudar](./fase-6-quiero-ayudar.md)

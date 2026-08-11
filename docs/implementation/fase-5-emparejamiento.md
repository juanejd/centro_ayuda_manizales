[← Fase 4](./fase-4-publicacion-y-tablero.md) · [Índice](./README.md) · Siguiente: [Fase 6 — Quiero Ayudar](./fase-6-quiero-ayudar.md)

# Fase 5 — Motor de emparejamiento

Lógica pura, sin una sola pantalla. Traduce «tengo maquinaria» a «estas necesidades de remoción de escombros y de movilidad te sirven». Es una fase propia y no parte de la fase 6 por una razón concreta: **un error de correspondencia debe descubrirse leyendo un test, no mirando una pantalla vacía.**

| | |
| --- | --- |
| **Entrega** | Tabla de correspondencia, resolutor, consulta acotada, Route Handler |
| **Depende de** | Fase 4 y la decisión **D-3** |
| **Requisitos del TRD** | §6 completa, RF-3.5, RNF-1.3, RNF-5.3, RNF-5.4 |
| **Tamaño estimado** | ~220 líneas · un solo PR |

> **Bloqueada por D-3.** La tabla de correspondencia del TRD §6 necesita confirmación de la organización, en particular que Sangre y Personas desaparecidas queden fuera del emparejamiento. Implementar sobre una tabla no confirmada significa reescribir las pruebas después.

## Ruta rápida

1. Un test por cada fila de la tabla del TRD §6. Catorce tests que fallan.
2. El resolutor que los pone en verde.
3. La consulta y el endpoint, con tope de filas y límite de tasa.

---

## Unidades de trabajo

| ID | Commit | Entrega | Prueba primero |
| --- | --- | --- | --- |
| 5.1 | `feat(matching): add the contribution-to-category resolver` | Tabla en `modules/matching/domain`, función resolutora | **Un test por cada una de las 14 filas** del TRD §6. Test: Dinero devuelve conjunto vacío. Test: Tiempo como voluntario y Otro devuelven todas las categorías. Test: **Sangre y Personas desaparecidas no son alcanzables por ningún tipo de aporte** |
| 5.2 | `feat(matching): add the bounded matching query` | Consulta contra `public_help_requests` | Test de integración: filtra por las categorías resueltas y por comuna. Test: **sin comuna, incluye las necesidades con zona sin asignar**. Test: **devuelve como máximo 20 filas con cualquier entrada**. Test: no incluye retiradas, ocultas ni caducadas |
| 5.3 | `feat(matching): expose the live filter route handler` | `app/api/necesidades/route.ts` con límite de tasa | Test de contrato: parámetros inválidos responden 400 con un cuerpo predecible. Test: la respuesta **no contiene ninguna columna ausente de la vista pública**. Test: la petición 61 en un minuto responde 429 |
| 5.4 | `test(matching): assert the two vocabularies stay in sync` | Prueba de coherencia | Test: **toda categoría del vocabulario de necesidades aparece en la tabla o está en la lista explícita de exclusiones.** Añadir una categoría nueva sin decidir su correspondencia rompe la compilación |

### 5.1 — Catorce tests, no uno

La tentación es escribir un test con una tabla de casos y darlo por cubierto. No sirve: cuando falle, el mensaje dirá «la fila 9 no coincide» y habrá que contar filas. Un test por tipo de aporte, con nombre explícito, hace que el fallo se lea solo:

```
✗ maquinaria matches remocion_escombros and movilidad
```

La tabla vive en código, no en base de datos. Es lógica de negocio versionada y revisable en un diff, no un dato editable en producción. Cambiarla exige un PR, y eso es deseable: es la lógica que decide qué ayuda llega a quién.

### 5.4 — La prueba que protege el futuro

Esta es la unidad menos obvia y la más valiosa a largo plazo. Cuando alguien añada una categoría de necesidad nueva —y en una emergencia real ocurrirá— hay dos posibilidades: que decida a qué aportes corresponde, o que la olvide y esa categoría quede invisible para todos los aportantes, sin ningún error.

La prueba obliga a la decisión: toda categoría debe estar en la tabla **o** en la lista explícita de exclusiones, que hoy contiene Sangre y Personas desaparecidas. Olvidarla rompe la compilación.

### 5.3 — El endpoint hereda la seguridad de la vista

El Route Handler consulta la vista pública, nunca la tabla. Eso significa que no puede filtrar una columna sensible aunque se programe mal, porque la columna no existe en su origen. La prueba lo verifica igualmente: compara el conjunto de claves de la respuesta contra el conjunto de columnas de la vista y falla ante cualquier extra.

Es el único endpoint de API de la plataforma. Todo lo demás son Server Components y Server Actions.

---

## Verificación

```bash
pnpm test:unit -- matching        # esperado: 14 tests de correspondencia, todos en verde
pnpm test:db   -- matching
pnpm test:e2e  -- api-necesidades
```

```bash
# Tope de filas, con cualquier parámetro
curl -s 'localhost:3000/api/necesidades?contribution=alimentos&comuna=tesorito&limit=999' | jq 'length'

# Límite de tasa
for i in $(seq 1 61); do curl -s -o /dev/null -w '%{http_code} ' \
  'localhost:3000/api/necesidades?contribution=agua&comuna=tesorito'; done
# esperado: 200 repetido y al menos un 429 al final
```

---

## Definición de terminado

- [ ] La tabla del TRD §6 está implementada fila por fila, con un test por fila.
- [ ] Dinero no empareja con nada.
- [ ] Tiempo como voluntario y Otro emparejan con todas las categorías.
- [ ] Sangre y Personas desaparecidas no son alcanzables por ningún tipo de aporte, y eso está probado.
- [ ] Existe la lista explícita de categorías excluidas del emparejamiento.
- [ ] Añadir una categoría nueva sin decidir su correspondencia rompe la compilación.
- [ ] La tabla vive en código, no en base de datos.
- [ ] La consulta devuelve 20 filas como máximo con cualquier entrada.
- [ ] La consulta nunca incluye retiradas, ocultas ni caducadas.
- [ ] El endpoint responde 400 ante parámetros inválidos, con un cuerpo predecible.
- [ ] La respuesta no contiene ninguna clave ausente de la vista pública. Verificado por comparación de conjuntos.
- [ ] El límite de tasa responde 429 tras 60 lecturas en un minuto.
- [ ] El percentil 95 de latencia es 400 ms o menos.
- [ ] D-3 confirmada por la organización.

## Frontera de reversión

Se retira eliminando `modules/matching/` y `app/api/necesidades/`. Nada depende todavía de esta fase: la 6 es su primer consumidor.

## Siguiente paso

[Fase 6 — Quiero Ayudar](./fase-6-quiero-ayudar.md)

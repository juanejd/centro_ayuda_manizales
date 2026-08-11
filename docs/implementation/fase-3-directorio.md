[← Fase 2](./fase-2-pantalla-principal.md) · [Índice](./README.md) · Siguiente: [Fase 4 — Publicación y tablero](./fase-4-publicacion-y-tablero.md)

# Fase 3 — Busco Información

El primer módulo que entrega valor completo al usuario. Es de solo lectura, no depende de que nadie mire una bandeja ni de que haya masa crítica de usuarios: si el proyecto se detuviera aquí, lo entregado seguiría sirviendo durante una emergencia.

| | |
| --- | --- |
| **Entrega** | Directorio filtrable y buscable, detalle de recurso con punto de encuentro y fotos, vista de líneas de atención |
| **Depende de** | Fases 1 y 2 |
| **Requisitos del TRD** | RF-5.1 a RF-5.10, RNF-1.1, RNF-3.3, RNF-4.7, §4.7 |
| **Tamaño estimado** | ~350 líneas · un solo PR |

## Ruta rápida

1. Dominio y consultas: categorías, filtros y búsqueda, probados sin interfaz.
2. Listado con distintivo de frescura visible en cada tarjeta.
3. Detalle con punto de encuentro, galería y fecha de verificación.

---

## Unidades de trabajo

| ID | Commit | Entrega | Prueba primero |
| --- | --- | --- | --- |
| 3.1 | `feat(directory): add resource domain and read queries` | Vocabulario de categorías, tipos, consultas de listado y detalle | Test de integración: el filtro por categoría y comuna devuelve solo lo esperado. La búsqueda encuentra por derivación de raíces y por escritura parcial. **Un recurso no publicado nunca aparece** |
| 3.2 | `feat(directory): add the filterable resource list` | `app/informacion/page.tsx`, filtros en la URL, tarjetas | E2E: filtrar por categoría cambia el listado y **la URL**, de modo que se pueda compartir. Con JavaScript deshabilitado, los filtros siguen funcionando |
| 3.3 | `feat(directory): show verification freshness on every card` | Distintivo de estado y antigüedad de la verificación | Test: un recurso verificado hace más de 72 horas se marca como potencialmente desactualizado. El estado se comunica con texto, no solo con color |
| 3.4 | `feat(directory): add resource detail with meeting point and photos` | `app/informacion/[slug]/page.tsx`, galería diferida | E2E: se muestran punto de encuentro, teléfonos como `tel:`, dirección que abre el mapa. Cada foto tiene texto alternativo |
| 3.5 | `feat(directory): add the consolidated emergency lines view` | Vista de líneas de atención accesible en un toque | E2E: se llega desde la pantalla principal con una sola interacción |
| 3.6 | `feat(directory): make the directory indexable and cacheable` | `revalidate = 300`, revalidación bajo demanda, `sitemap.xml`, `robots.txt` | Test: el directorio responde **sin** `noindex`, a diferencia del tablero de la fase 4. El sitemap lista los recursos publicados |

### 3.1 — Los recursos cerrados se muestran, no se esconden

RF-5.8 es contraintuitivo y hay que probarlo explícitamente: un albergue con estado `cerrado` **sigue apareciendo** en el listado, claramente marcado. Quien llega a un albergue cerrado necesita saber que cerró, no concluir que nunca existió y seguir buscando.

La prueba que se olvida es la inversa: un recurso con `is_published = false` **nunca** aparece. Son dos conceptos distintos —cerrado es un hecho del mundo, no publicado es un estado editorial— y confundirlos en la consulta es fácil.

### 3.3 — La frescura es el requisito, no un adorno

RP-6 dice que la información desactualizada es peligrosa. Por eso la fecha de verificación va en la tarjeta del listado y no escondida en el detalle: la decisión de ir o no ir a un lugar se toma mirando la lista.

El umbral de 72 horas se calcula en el servidor. Calcularlo en el cliente introduciría dependencia del reloj del dispositivo, que en teléfonos viejos puede estar desajustado por días.

### 3.6 — El directorio sí se indexa

Es la única superficie pública de la plataforma que **debe** aparecer en buscadores: es información institucional, no datos personales. Alguien que busca «albergue Manizales» en Google debe encontrarla.

Esto lo pone en oposición directa al tablero de la fase 4, que lleva `noindex`. La prueba de 3.6 y la del tablero se leen juntas: una afirma presencia de indexación, la otra ausencia. Tenerlas explícitas evita que una configuración global futura las iguale por descuido.

---

## Verificación

```bash
pnpm test:db -- directory
pnpm test:e2e -- directory
pnpm exec playwright test directory --project=no-js
pnpm build                          # ≤ 50 KB de JS, ≤ 200 KB total sin fotos
curl -sI localhost:3000/informacion | grep -i x-robots-tag   # esperado: sin noindex
```

---

## Definición de terminado

- [ ] Listado filtrable por categoría y comuna, ambos poblados desde su catálogo.
- [ ] Búsqueda por texto sobre nombre y descripción, con derivación de raíces en español.
- [ ] «hospi» encuentra «Hospital».
- [ ] Los filtros viven en la URL y la página es compartible.
- [ ] Los filtros funcionan con JavaScript deshabilitado.
- [ ] Cada tarjeta muestra la fecha de última verificación.
- [ ] Un recurso verificado hace más de 72 horas se marca visualmente.
- [ ] El estado se comunica con texto y color, nunca con color solo.
- [ ] Un recurso cerrado sigue visible y marcado.
- [ ] Un recurso no publicado nunca aparece en ninguna vista pública.
- [ ] El detalle muestra punto de encuentro, teléfonos accionables y dirección que abre el mapa.
- [ ] Cada foto de referencia tiene texto alternativo.
- [ ] Las fotos cargan de forma diferida con dimensiones reservadas: la tarjeta no salta al cargar.
- [ ] La vista de líneas de atención se alcanza en un toque desde la pantalla principal.
- [ ] El directorio es indexable y aparece en el sitemap.
- [ ] Presupuesto de peso respetado.

## Frontera de reversión

Se retira eliminando `app/informacion/`, `modules/info-resources/` y el sitemap. La pantalla principal quedaría sin su franja de emergencia, así que revertir exige también retirar la unidad 2.3 o dejarla en su valor de último recurso.

## Siguiente paso

[Fase 4 — Publicación y tablero](./fase-4-publicacion-y-tablero.md)

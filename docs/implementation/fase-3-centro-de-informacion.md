[← Fase 2](./fase-2-pantalla-principal.md) · [Índice](./README.md) · Siguiente: [Fase 4 — Publicación y tablero](./fase-4-publicacion-y-tablero.md)

# Fase 3 — Centro de información

El primer módulo que entrega valor completo. Es de solo lectura, no depende de que nadie mire una bandeja ni de que haya masa crítica de usuarios, y **su contenido ya está verificado y disponible en el repositorio**. Si el proyecto se detuviera aquí, lo entregado seguiría sirviendo durante la emergencia.

| | |
| --- | --- |
| **Entrega** | Directorio filtrable, detalle de recurso, líneas consolidadas, alertas vigentes y guía de actuación |
| **Depende de** | Fases 1 y 2 |
| **Requisitos del TRD** | RF-5.1 a RF-5.13, RI-1 a RI-6, RF-0.5, RF-0.6, §6, §7 |
| **Fuente de contenido** | [`base_verificada_emergencia_sismo_manizales_2026-08-10.md`](../../base_verificada_emergencia_sismo_manizales_2026-08-10.md) |

## Ruta rápida

1. Dominio y consultas: categorías, frescura, filtros y búsqueda.
2. Listado con la tarjeta del TRD §7.1 y la frescura visible en cada una.
3. Detalle con punto de encuentro, teléfonos y galería.
4. Las tres pantallas que no dependen de base de datos: alertas, guía y líneas.

---

## Unidades de trabajo

| ID | Commit | Entrega | Comprobación |
| --- | --- | --- | --- |
| 3.1 | `feat(directory): add resource domain and read queries` | Categorías, frescura, consultas de listado y detalle | En base de datos: el filtro por categoría y comuna devuelve solo lo esperado. La búsqueda encuentra por raíz y por escritura parcial. **Un recurso no publicado nunca aparece** |
| 3.2 | `feat(directory): add the filterable resource list` | `app/informacion/page.tsx`, filtros en la URL, tarjetas | En el navegador: filtrar cambia el listado **y la URL**, de modo que se pueda compartir. Con JavaScript deshabilitado los filtros siguen funcionando |
| 3.3 | `feat(directory): show verification freshness on every card` | Franja y etiqueta de frescura | Un recurso confirmado hace más de 72 horas se marca como potencialmente desactualizado. El estado se comunica con texto, no solo con color |
| 3.4 | `feat(directory): add resource detail with meeting point and photos` | `app/informacion/[slug]/page.tsx`, galería diferida | Punto de encuentro, teléfonos como `tel:`, dirección que abre el mapa. Cada foto tiene texto alternativo |
| 3.5 | `feat(directory): add the consolidated emergency lines view` | `app/lineas-atencion/page.tsx` | Se llega desde la pantalla principal con una sola interacción |
| 3.6 | `feat(alerts): show the active emergency alerts` | Alertas vigentes en la pantalla principal | Una alerta vencida deja de mostrarse. Cada alerta muestra su fuente |
| 3.7 | `feat(guidance): add the citizen action guide` | `app/que-hacer/page.tsx`, estático | Cada escenario termina en un número marcable. Sin consultas a base de datos |
| 3.8 | `feat(directory): make the directory indexable and cacheable` | `revalidate = 300`, `sitemap.xml`, `robots.txt` | El directorio responde **sin** `noindex`, a diferencia del tablero de la fase 4. El sitemap lista los recursos publicados |

### 3.1 — Los recursos cerrados se muestran, no se esconden

RF-5.8 es contraintuitivo y hay que comprobarlo explícitamente: un albergue con estado `cerrado` **sigue apareciendo** en el listado, claramente marcado. Quien llega a un albergue cerrado necesita saber que cerró, no concluir que nunca existió y seguir buscando.

La comprobación inversa también importa: un recurso con `is_published = false` **nunca** aparece. Son dos conceptos distintos —cerrado es un hecho del mundo, no publicado es un estado editorial— y confundirlos en la consulta es fácil.

### 3.3 — La frescura es el requisito, no un adorno

RP-6 dice que la información desactualizada es peligrosa, y el propio documento de origen se identifica con una hora de corte y advierte que todo cambia durante la emergencia. Por eso la fecha de verificación va en la tarjeta del listado y no escondida en el detalle: la decisión de ir o no ir a un lugar se toma mirando la lista.

El umbral de 72 horas se calcula en el servidor. Calcularlo en el cliente introduciría dependencia del reloj del dispositivo, que en teléfonos viejos puede estar desajustado por días.

### 3.5 — El dígito de opción no es parte del número

El directorio municipal lista entradas como «123 opción 2» y «123 opción 5», porque un número se abre en un menú. Concatenar los dígitos produciría `1232`, un número que no existe, mientras la interfaz sigue mostrando el texto correcto.

**El número marcado es el número base; la opción vive en la descripción.** El caso `#767` es el simétrico: quitar el `#` marcaría `767`. En un enlace `tel:` el `#` debe ir como `%23` o termina el número.

Ambos casos están cubiertos por `toDialable` y `toTelHref` en el dominio, y ambos merecen una comprobación explícita en el navegador con un teléfono real.

### 3.6 — Una alerta vencida es desinformación

Las alertas de la §2 del documento de origen son temporales por naturaleza: el toque de queda del 10 de agosto vence a las 5:00 a. m. del día siguiente. Mostrar como vigente una restricción que ya terminó no es un defecto cosmético, es información falsa sobre lo que la autoridad ordena.

Cada alerta lleva su vencimiento y su fuente. El vencimiento se evalúa en servidor, por la misma razón que la frescura.

### 3.7 — La guía es una pantalla de enrutamiento

Los once escenarios de la §12 del documento de origen —grieta, columnas y vigas, gas, cables caídos, fuga de agua, persona herida, persona atrapada, réplica, acompañamiento a niños y adultos mayores, mascotas— **todos terminan en un número**: 119, 123 con su opción, 115, 116 o 164.

No es contenido de relleno: es la conversión de «pasó algo en mi casa» en «llame aquí», que es la acción ciudadana más frecuente después de un sismo. Es HTML estático, sin base de datos y sin exposición legal, así que es también lo más barato de entregar.

RF-1.15 sigue vigente aquí: la guía **retransmite** instrucciones oficiales y nunca emite un juicio propio sobre si una vivienda es segura.

### 3.8 — El centro de información sí se indexa

Es la única superficie pública que **debe** aparecer en buscadores: es información institucional, no datos personales. Alguien que busca «albergue Manizales» en Google debe encontrarla.

Esto lo pone en oposición directa al tablero de la fase 4, que lleva `noindex`. Las comprobaciones de 3.8 y del tablero se leen juntas: una afirma presencia de indexación, la otra ausencia. Tenerlas explícitas evita que una configuración global futura las iguale por descuido.

---

## Reglas de contenido

No son estilo. Vienen del documento de origen y son condiciones de corrección.

| ID | Regla | Cómo se comprueba |
| --- | --- | --- |
| RI-1 | No se publica una ubicación como albergue sin confirmación oficial concreta | Hay tres albergues habilitados y solo el Coliseo Mayor está identificado. Los otros dos no se siembran |
| RI-2 | «Presenta afectaciones» no es «cerrado» | El Hospital Santa Sofía aparece con afectaciones, nunca como cerrado |
| RI-3 | No se publican nombres de personas fallecidas | Ninguna vista los muestra |
| RI-4 | No se publica una vía como cerrada por videos o cadenas de mensajería | Solo las tres líneas del Cable Aéreo, que tienen comunicado |
| RI-5 | Un vacío no se rellena con suposiciones | Se muestra «No se encontró información oficial confirmada hasta la última verificación» |
| RI-6 | Todo recurso guarda fuente y fecha de verificación, ambas visibles | En la tarjeta y en el detalle |

---

## Verificación

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

Comprobaciones manuales:

- Filtrar por categoría y comuna actualiza la URL y funciona sin JavaScript.
- Un recurso cerrado sigue visible; uno no publicado no aparece.
- Marcar «123 opción 2» abre el marcador con **123**, no con 1232.
- Marcar la Policía de Carreteras abre el marcador con **#767**.
- Los teléfonos abren el marcador y cada foto tiene texto alternativo.
- Una alerta con vencimiento pasado no se muestra.
- `curl -sI localhost:3000/informacion` no devuelve `noindex`.
- Con zoom al 200 %, listado y detalle no producen desplazamiento horizontal.

---

## Definición de terminado

- [ ] Listado filtrable por categoría y comuna, ambos poblados desde su catálogo.
- [ ] Búsqueda por texto sobre nombre y descripción, con derivación de raíces en español.
- [ ] «hospi» encuentra «Hospital».
- [ ] Los filtros viven en la URL y la página es compartible.
- [ ] Los filtros funcionan con JavaScript deshabilitado.
- [ ] Cada tarjeta muestra fuente y fecha de última verificación.
- [ ] Un recurso confirmado hace más de 72 horas se marca visualmente.
- [ ] El estado se comunica con texto y color, nunca con color solo.
- [ ] Un recurso cerrado sigue visible y marcado.
- [ ] Un recurso no publicado nunca aparece en ninguna vista pública.
- [ ] Un número con menú marca el número base; la opción va en la descripción.
- [ ] El detalle muestra punto de encuentro, teléfonos accionables y dirección que abre el mapa.
- [ ] Cada foto tiene texto alternativo y carga diferida con dimensiones reservadas.
- [ ] Las líneas de atención se alcanzan en un toque desde la pantalla principal.
- [ ] Las alertas vigentes se muestran con fuente y vencimiento; una vencida desaparece.
- [ ] `/que-hacer` cubre los once escenarios y cada uno termina en un número marcable.
- [ ] Un dato no confirmado muestra el texto de RI-5.
- [ ] El directorio es indexable y aparece en el sitemap.

## Frontera de reversión

Se retira eliminando `app/informacion/`, `app/lineas-atencion/`, `app/que-hacer/`, `modules/info-resources/` y el sitemap. La pantalla principal quedaría sin su franja de emergencia y sin alertas, así que revertir exige también retirar esas unidades de la fase 2 o dejarlas en su valor de último recurso.

## Siguiente paso

[Fase 4 — Publicación y tablero](./fase-4-publicacion-y-tablero.md)

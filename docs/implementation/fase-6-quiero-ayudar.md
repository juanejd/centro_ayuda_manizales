[← Fase 5](./fase-5-emparejamiento.md) · [Índice](./README.md) · Siguiente: [Fase 7 — Moderación](./fase-7-moderacion.md)

# Fase 6 — Quiero Ayudar

Cierra el circuito. Es la única pantalla interactiva de la plataforma: mientras el aportante elige qué puede dar y dónde, ve en vivo cuántas necesidades encajan. También es la única fase donde el JavaScript aporta algo que no se puede conseguir sin él, y por eso se construye al revés de lo que parece natural.

| | |
| --- | --- |
| **Entrega** | Formulario de aporte, emparejamiento en vivo, ramas de dinero y voluntariado |
| **Depende de** | Fase 5 |
| **Requisitos del TRD** | RF-3.1 a RF-3.12, RNF-1.3, RNF-3.2, RNF-4.6, §7.2 |
| **Tamaño estimado** | ~380 líneas · un solo PR |

## Ruta rápida

1. Server Action y formulario **sin JavaScript**, con las coincidencias en la confirmación.
2. Solo entonces, la isla de cliente que mueve esas coincidencias al llenado.
3. Las dos ramas especiales: dinero no captura nada, voluntariado no promete nada.

---

## Unidades de trabajo

| ID | Commit | Entrega | Prueba primero |
| --- | --- | --- | --- |
| 6.1 | `feat(offers): add validation and the register server action` | Esquema Zod, Server Action, límite de tasa | Test: rechaza barrio atribuido a una comuna que no le corresponde, tipo de aporte inválido, envío sin consentimiento. Test de integración: registra y devuelve radicado. Test: el sexto envío en 10 minutos responde 429 |
| 6.2 | `feat(offers): add the contribution form with matches on confirmation` | Formulario `<form>` nativo; la confirmación muestra las coincidencias | E2E **sin JavaScript**: se completa, se envía, y la confirmación lista las necesidades que encajan. Test: los datos del aportante **no aparecen en ninguna vista pública** |
| 6.3 | `feat(offers): show matching needs live while the form is filled` | Isla de cliente, debounce de 300 ms, región `aria-live` | E2E: al elegir tipo de aporte y comuna, el contador cambia sin enviar el formulario. Test: el contador se anuncia en `aria-live="polite"`. Test: **si el endpoint falla, el formulario sigue siendo enviable** |
| 6.4 | `feat(offers): route money contributions to verified organisations` | Rama de dinero | E2E: al elegir Dinero **no aparece ningún campo financiero**, no hay emparejamiento, y se redirige a las entidades verificadas del directorio |
| 6.5 | `feat(offers): register volunteer interest without promising assignment` | Rama de voluntariado | E2E: se registra el contacto, se muestran las coincidencias, y el texto dice explícitamente que el módulo de voluntariado no está disponible |
| 6.6 | `feat(offers): explain the empty state instead of showing nothing` | Estado sin coincidencias | E2E: sin coincidencias, se explica y se ofrece el tablero completo. Nunca una lista vacía sin texto |

### 6.2 antes de 6.3, y el orden importa

Construir primero la versión sin JavaScript garantiza que la degradación de RF-3.7 exista de verdad, en lugar de ser un requisito que alguien intentará añadir al final sobre un componente que ya depende del cliente.

Con el orden inverso, la «degradación» acaba siendo un mensaje de «active JavaScript para continuar». Eso incumple RP-2 y RP-5, y en esta plataforma significa que alguien con un teléfono viejo o una conexión que corta a mitad de carga no puede ofrecer ayuda.

### 6.3 — La isla de cliente es el único JavaScript del proyecto

Presupuesto: 75 KB de JavaScript, 15 KB más que el resto de los formularios. Se implementa **sin librerías de estado ni de peticiones**: `useState`, `fetch` y un debounce escrito a mano. Añadir una dependencia de gestión de estado para un contador y una lista consume el presupuesto entero.

Dos requisitos fáciles de olvidar:

- **`aria-live="polite"`** en el contador. Un número que cambia en silencio es invisible para un lector de pantalla, y sin ese anuncio la función no existe para quien no ve la pantalla.
- **RNF-3.2:** si el emparejamiento falla, el formulario sigue enviándose. Un fallo al mostrar coincidencias nunca puede bloquear el registro de un aporte. La prueba simula el endpoint caído y verifica que el envío llega.

### 6.4 — La rama de dinero no captura nada

RF-3.9 es una prohibición, no una funcionalidad. La prueba se escribe en negativo: **con Dinero seleccionado, el formulario no contiene ningún campo financiero.** Se afirma la ausencia, porque lo que hay que evitar es que alguien añada «número de cuenta» pensando que ayuda.

### 6.5 — No prometer lo que el sistema no hace

Registrar voluntarios y luego no llamarlos destruye la confianza más rápido que no tener el módulo. El texto tiene que decir con claridad que el voluntariado todavía no está disponible, y a la vez mostrar las necesidades que encajan, para que la visita no sea estéril.

### 6.1 — La asimetría es deliberada

Los datos del aportante **no se publican nunca**, a diferencia de los de quien pide ayuda. Quien pide ayuda autoriza expresamente la publicación con una casilla propia; quien la ofrece no. La prueba de 6.2 lo verifica consultando la vista pública y las respuestas de la API para confirmar que ningún dato del aportante aparece.

---

## Verificación

```bash
pnpm test:unit -- offers
pnpm test:db   -- offers
pnpm test:e2e  -- contribute
pnpm exec playwright test contribute --project=no-js
pnpm build                        # ≤ 75 KB de JS, ≤ 200 KB total
pnpm exec playwright test contribute --grep "endpoint caído"
```

Comprobación de accesibilidad del contador en vivo, con lector de pantalla o con Axe:

```bash
pnpm exec playwright test contribute --grep "aria-live"
```

---

## Definición de terminado

- [ ] La primera pregunta es **¿Cómo puedes ayudar?**, como selección de tipo de aporte.
- [ ] Municipio como selección del catálogo.
- [ ] El formulario se completa y envía con JavaScript deshabilitado, y la confirmación muestra las coincidencias.
- [ ] Con JavaScript, el contador y la lista se actualizan al elegir tipo de aporte y comuna, sin enviar.
- [ ] El debounce es de 300 ms.
- [ ] El contador se anuncia en una región `aria-live="polite"`.
- [ ] Si el endpoint de emparejamiento falla, el formulario sigue siendo enviable. Probado con el endpoint caído.
- [ ] Sin coincidencias, se explica y se ofrece el tablero completo.
- [ ] Con Dinero: ningún campo financiero, ningún emparejamiento, redirección a entidades verificadas.
- [ ] Con Tiempo como voluntario: se registra el contacto, se muestran coincidencias y se dice que el módulo no está disponible.
- [ ] Los datos de contacto del aportante no aparecen en ninguna vista pública ni en ninguna respuesta de API.
- [ ] El sexto envío en 10 minutos responde 429.
- [ ] Presupuesto de peso respetado, sin librerías de estado ni de peticiones.
- [ ] Latencia del filtrado en vivo: percentil 95 en 400 ms o menos.

## Frontera de reversión

Se retira eliminando `app/quiero-ayudar/` y `modules/help-offers/`. La fase 5 queda en pie pero sin consumidor, y la tabla `help_offers` sin escrituras. Nada más se rompe.

## Siguiente paso

[Fase 7 — Moderación](./fase-7-moderacion.md)

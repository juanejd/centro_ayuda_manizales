[← Fase 3](./fase-3-centro-de-informacion.md) · [Índice](./README.md) · Siguiente: [Fase 5 — Quiero ayudar](./fase-5-quiero-ayudar.md)

# Fase 4 — Publicación, tablero y gestión

La fase con más consecuencia del proyecto. A partir de aquí la plataforma publica en internet abierto el nombre, el teléfono y la foto de personas que acaban de sufrir una emergencia.

> **Esta fase es indivisible como despliegue.** Publicar teléfonos y fotos sin el mecanismo de retiro deja a las personas sin forma de revertir su exposición, y sin la limpieza de metadatos publica la ubicación exacta de sus viviendas. Se puede partir en tres PR encadenados; no se puede desplegar por partes.

| | |
| --- | --- |
| **Entrega** | Formulario de publicación, tablero público, gestión de la propia publicación, caducidad automática |
| **Depende de** | Fases 1 y 2 |
| **Requisitos del TRD** | RF-1.1 a RF-1.14, RF-2.1 a RF-2.10, RF-4.1 a RF-4.7, §8.2 completa |
| **Tamaño estimado** | ~900 líneas · excede el presupuesto de 800 · **tres PR encadenados** |

## Cortes de PR

Superamos las 800 líneas, así que el corte se decide antes de escribir código.

| PR | Unidades | Entrega verificable por sí sola |
| --- | --- | --- |
| 4-A | 4.1 a 4.4 | Núcleo sin interfaz: generador de radicados, validación, canalización de imagen, Server Action. Comprobado contra PostgreSQL |
| 4-B | 4.5 a 4.7 | Formulario, confirmación y tablero público |
| 4-C | 4.8 a 4.10 | Detalle, gestión de la publicación y caducidad automática |

**Ningún PR se despliega solo.** Los tres se integran y se despliegan juntos. El corte existe para que la revisión sea posible, no para escalonar la salida.

## Ruta rápida

1. Generador de radicados y canalización de imagen: lógica pura, revisada sin depender de la interfaz.
2. Server Action de publicación con límite de tasa, comprobada contra PostgreSQL.
3. Formulario sin JavaScript primero, tablero después, gestión al final.

---

## Unidades de trabajo

### PR 4-A — Núcleo

| ID | Commit | Entrega | Comprobación |
| --- | --- | --- | --- |
| 4.1 | `feat(requests): add reference code generator with collision retry` | Generador base32 de Crockford sin I, L, O ni U | Comprobar: 10 000 códigos generados no contienen letras ambiguas y cumplen el patrón. Comprobar: ante un conflicto simulado, reintenta y termina; tras N intentos, falla con un error explícito en lugar de colgarse |
| 4.2 | `feat(requests): add server-side validation schema` | Esquema Zod compartido por formulario y Server Action | Comprobar: rechaza descripción de menos de 10 caracteres, barrio atribuido a una comuna que no le corresponde, teléfono con letras, y **cualquier envío sin los dos consentimientos** |
| 4.3 | `feat(images): strip all metadata before storing a photo` | Canalización: validar tipo real, comprimir, reescribir sin metadatos | **Comprobar con un archivo real que lleve coordenadas GPS en su EXIF: el resultado no conserva metadatos.** También comprobar que un archivo que dice ser JPEG pero no lo es se rechaza |
| 4.4 | `feat(requests): add the publish server action with rate limiting` | Server Action completa, límite de 5 envíos cada 10 minutos por IP | Comprobar en base de datos: publica y devuelve radicado más token. Comprobar: el sexto envío en 10 minutos responde 429. Comprobar: si el almacenamiento falla, **no queda una necesidad huérfana sin su foto ni una foto sin necesidad** |

### PR 4-B — Interfaz pública

| ID | Commit | Entrega | Comprobación |
| --- | --- | --- | --- |
| 4.5 | `feat(requests): add the publish form` | Formulario de una pantalla, `<form>` nativo, advertencia destacada, dos casillas | Comprobar en el navegador sin JavaScript: se completa y se envía con éxito. Comprobar en el navegador: no se puede enviar sin marcar ambas casillas. Comprobar en el navegador: la advertencia de publicidad es visible antes del campo de teléfono sin desplazarse |
| 4.6 | `feat(requests): add the confirmation screen with the manage link` | Radicado, enlace de gestión con instrucción de guardarlo, líneas de emergencia | Comprobar en el navegador: el radicado y el enlace aparecen. El enlace contiene código y token |
| 4.7 | `feat(board): add the public needs board` | Listado, filtros, distintivos, aviso antifraude, `noindex` | Comprobar en el navegador: una necesidad publicada aparece en menos de 60 s con distintivo «Sin verificar». Comprobar: `X-Robots-Tag: noindex` presente y `robots.txt` excluye la ruta. Comprobar: **el tope de 20 filas no se puede elevar con ningún parámetro** |

### PR 4-C — Ciclo de vida

| ID | Commit | Entrega | Comprobación |
| --- | --- | --- | --- |
| 4.8 | `feat(board): add the need detail page` | Detalle por radicado, mapa con ubicación aproximada, foto | Comprobar: el mapa usa las coordenadas **redondeadas** de la vista, nunca las exactas |
| 4.9 | `feat(requests): let people resolve, correct or withdraw their own post` | Página de gestión por código más token | Comprobar en el navegador: con el enlace, se marca resuelta y se retira. Comprobar: token equivocado deniega. Comprobar: **una necesidad retirada desaparece de inmediato del tablero, del detalle y de la API**. Comprobar: el endpoint responde 429 tras 10 intentos en 10 minutos |
| 4.10 | `feat(requests): expire stale and fulfilled needs automatically` | Tarea programada de caducidad | Comprobar: una necesidad atendida hace 49 horas ya no está en la vista. Comprobar: una sin actividad desde hace 15 días tampoco |

---

## Las tres unidades donde no hay margen

### 4.3 — La limpieza de metadatos es lo que hace legal a la fase

Una foto tomada con un celular lleva las coordenadas GPS exactas en su EXIF. Publicarla sin limpiar **anula por completo** el redondeo de coordenadas de RNF-5.6 y expone la vivienda con precisión de metros, además del modelo del dispositivo y la fecha.

La comprobación usa **un archivo real con GPS en su EXIF**. Un mock del limpiador no demuestra que la librería elimine los metadatos del archivo resultante.

Consecuencia arquitectónica: **ninguna carga puede ir directa del navegador al almacenamiento.** El archivo tiene que pasar por el servidor. Una revisión posterior debe rechazar cualquier carga directa desde el navegador.

### 4.5 — Sin JavaScript es el camino principal, no el de respaldo

El formulario se construye como `<form>` HTML apuntando a una Server Action y se comprueba con JavaScript deshabilitado. Solo después se añade el JavaScript progresivo: compresión en cliente, geolocalización, validación en vivo.

Hacerlo en el otro orden produce siempre un formulario que depende del cliente sin que nadie lo haya decidido.

Las dos casillas de consentimiento son **separadas** y ninguna viene marcada. No es celo: la Ley 1581 exige autorización informada por finalidad determinada, y publicar un teléfono es una finalidad distinta del tratamiento interno. Una sola casilla dejaría la autorización jurídicamente frágil.

### 4.9 — Sin retiro no hay fase

RF-4 es lo que hace que la exposición sea reversible. La comprobación importante no es solo «se puede retirar», sino **«tras retirar, no queda accesible por ninguna vía»**: ni el tablero, ni el detalle directo por radicado, ni la API de filtrado que la fase 5 va a consumir.

El token se valida en la Server Action y **nunca se convierte en una credencial de base de datos**. Por eso esta ruta usa `service_role`, y es una de las dos únicas operaciones que lo hacen.

---

## Verificación

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

Comprobaciones manuales y de servidor:

- Publicar una necesidad con JavaScript deshabilitado devuelve radicado y enlace de gestión.
- Un sexto envío dentro de diez minutos recibe 429.
- Una foto con metadatos de ubicación se almacena sin esos metadatos; un archivo que no sea una imagen real se rechaza.
- `curl -sI localhost:3000/necesidades` devuelve `noindex, nofollow`.
- La API devuelve como máximo 20 filas aunque reciba un límite mayor.
- Tras retirar una publicación, no aparece en tablero, detalle ni API.

---

## Definición de terminado

**Publicación**

- [ ] Se publica una necesidad desde un celular, sin cuenta, en menos de 90 segundos.
- [ ] La confirmación entrega radicado y enlace de gestión, con instrucción de guardarlo.
- [ ] La advertencia de que nombre, teléfono y foto serán públicos es visible antes del campo de teléfono.
- [ ] No se puede enviar sin marcar las dos casillas de consentimiento, ninguna marcada por defecto.
- [ ] Se guarda el momento de cada consentimiento, no un booleano.
- [ ] El formulario se completa y envía con JavaScript deshabilitado.
- [ ] La necesidad nace sin prioridad.
- [ ] El sexto envío en 10 minutos responde 429.

**Fotos**

- [ ] Una foto con GPS en su EXIF se almacena sin ningún metadato. Verificado inspeccionando el archivo resultante.
- [ ] Un archivo que finge ser imagen se rechaza.
- [ ] Ninguna carga va directa del navegador al almacenamiento.
- [ ] Las rutas del bucket no son enumerables.

**Tablero**

- [ ] Una necesidad publicada aparece en menos de 60 segundos con distintivo «Sin verificar».
- [ ] Filtros por categoría y comuna, más la opción «zona sin asignar»; búsqueda sobre la descripción y el barrio escrito.
- [ ] El barrio se captura con autocompletado y un barrio ausente del catálogo no impide publicar.
- [ ] Una necesidad con zona sin asignar aparece en el tablero como cualquier otra.
- [ ] Tope de 20 filas por página, inelevable por parámetro.
- [ ] Distintivos con texto y color.
- [ ] Aviso antifraude permanente y visible.
- [ ] `noindex, nofollow` y exclusión en `robots.txt`.
- [ ] El teléfono se marca con un toque.
- [ ] El mapa del detalle usa coordenadas redondeadas, nunca exactas.

**Ciclo de vida**

- [ ] Con el enlace de gestión y sin cuenta: resolver, corregir y retirar.
- [ ] Un token equivocado deniega, y el endpoint limita a 10 intentos cada 10 minutos.
- [ ] Una necesidad retirada desaparece de inmediato del tablero, del detalle y de la API.
- [ ] Una atendida se ve marcada 48 horas y luego se oculta.
- [ ] Una sin actividad se oculta a los 14 días.
- [ ] Existe la ruta manual de retiro para quien pierda el enlace.

## Frontera de reversión

Los tres PR se revierten juntos. Retirar solo 4-C dejaría teléfonos publicados sin mecanismo de retiro, que es exactamente el estado que esta fase existe para no producir.

## Siguiente paso

[Fase 5 — Quiero ayudar](./fase-5-quiero-ayudar.md)

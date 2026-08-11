[← Fase 4](./fase-4-publicacion-y-tablero.md) · [Índice](./README.md) · Siguiente: [Fase 6 — Moderación](./fase-6-moderacion.md)

# Fase 5 — Quiero ayudar

**Es un filtro sobre el tablero. No registra a nadie.**

Esa frase es toda la fase. No hay tabla de aportantes, ni código de radicado, ni pantalla de confirmación, ni bandeja para contacto proactivo. La persona dice qué puede aportar, ve quién lo necesita y llama. La conexión la hace ella.

| | |
| --- | --- |
| **Entrega** | Filtro guiado que traduce tipo de aporte a categorías y muestra las publicaciones que corresponden |
| **Depende de** | Fase 4, más la decisión D-3 |
| **Requisitos del TRD** | RF-3.1 a RF-3.11, §9 |
| **Tamaño estimado** | ~150 líneas · un solo PR |

## Ruta rápida

1. La tabla de traducción, en código y comprobada fila por fila.
2. El formulario `GET` y la consulta que reutiliza el tablero.
3. Los dos casos que no filtran: Dinero y Tiempo como voluntario.

---

## Unidades de trabajo

| ID | Commit | Entrega | Comprobación |
| --- | --- | --- | --- |
| 5.1 | `feat(help-offers): add the contribution to category translation` | `modules/help-requests/domain`, tabla del TRD §9 | Cada fila de la tabla devuelve exactamente las categorías declaradas. Sangre y Personas desaparecidas no aparecen en ninguna traducción |
| 5.2 | `feat(help-offers): add the guided board filter` | `app/quiero-ayudar/page.tsx`, `<form method="get">` | Seleccionar tipo de aporte cambia los resultados **y la URL**. Con JavaScript deshabilitado funciona igual |
| 5.3 | `feat(help-offers): handle money and volunteering as non-filtering paths` | Rutas de Dinero y Tiempo como voluntario | Dinero no pide ningún dato financiero y remite al centro de información. Voluntariado muestra coincidencias y dice que el módulo no está disponible |

### 5.1 — Los dos vocabularios no coinciden

Quien ayuda piensa en **lo que tiene**: un carro, comida, una motosierra. Quien pide ayuda escribe **lo que le falta**: transporte, alimentos, remoción de escombros. Son listas distintas y no se cruzan por coincidencia de cadenas.

La tabla vive en `domain`, no en base de datos: es lógica de negocio que se revisa en un diff, no un dato editable en producción.

Dos filas merecen comprobación explícita porque son las que revelan un error de traducción:

- **Servicios profesionales** devuelve cinco categorías. Un ingeniero, un veterinario y un psicólogo seleccionan lo mismo. Afinarlo exigiría un subcampo de profesión, que añade fricción contra RP-1.
- **Sangre** y **Personas desaparecidas** no son destino de ninguna fila. Se resuelven presentándose en un punto o reportando información, no aportando un recurso. Aparecen en el tablero y nunca en el filtro.

D-3 confirma exactamente esto antes de implementar.

### 5.2 — Un formulario `GET`, no un cliente interactivo

El filtro es un `<form method="get">` cuyos criterios viven en la URL. De ahí salen tres propiedades sin escribir código adicional: funciona sin JavaScript, la página es compartible por WhatsApp, y el botón atrás del navegador se comporta como la persona espera.

Reutiliza la consulta del tablero de la fase 4 con la lista de categorías traducidas. No es una consulta nueva ni un motor: es el mismo listado con un `WHERE` distinto y el mismo tope de 20 filas.

**Sin comuna seleccionada, el filtro abarca todo Manizales, incluidas las publicaciones con zona sin asignar.** Excluirlas por omisión dejaría fuera precisamente a quien vive donde ningún catálogo llega. Filtrar por comuna acota; nunca es requisito para ver resultados.

Sin coincidencias se explica y se ofrece el tablero completo. Nunca una lista vacía sin explicación (RF-3.7).

### 5.3 — Dinero no toca la plataforma

Si el tipo de aporte es Dinero no se captura ningún dato financiero, no se filtra nada y se remite a las entidades del centro de información. La plataforma no recibe ni custodia dinero, y el documento fuente lo prohíbe explícitamente.

Tiempo como voluntario sí muestra coincidencias, pero informa que el módulo de voluntariado no está disponible. Se registra el interés sin prometer una asignación que el sistema no puede hacer.

---

## Lo que esta fase no construye

Enunciado porque la versión anterior del plan lo tenía y era el error más caro del proyecto:

- Ninguna tabla de aportantes. `help_offers` existe en el esquema pero **ninguna ruta escribe en ella**.
- Ningún código de radicado para quien ayuda.
- Ninguna pantalla de confirmación.
- Ninguna bandeja de moderación de aportes.
- Ningún emparejamiento diferido ni motor con estado.
- Ninguna librería de peticiones ni de estado en cliente.

---

## Verificación

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

Comprobaciones manuales:

- Seleccionar cada tipo de aporte devuelve las categorías de la tabla del TRD §9.
- Con JavaScript deshabilitado, seleccionar y enviar filtra igual.
- La URL resultante, pegada en otra pestaña, reproduce los mismos resultados.
- Sin comuna, aparecen publicaciones con zona sin asignar.
- Dinero no muestra resultados y remite al centro de información.
- Sin coincidencias aparece la explicación y el enlace al tablero.
- Ninguna fila nueva en `help_offers` después de usar la pantalla.

---

## Definición de terminado

- [ ] Cada fila de la tabla del TRD §9 devuelve exactamente sus categorías.
- [ ] Sangre y Personas desaparecidas no son destino de ninguna traducción.
- [ ] Seleccionar tipo de aporte muestra el número de coincidencias y hasta 20 publicaciones.
- [ ] Cada resultado ofrece el teléfono como enlace `tel:` y enlace al detalle.
- [ ] Los criterios viven en la URL y la página es compartible.
- [ ] Funciona con JavaScript deshabilitado.
- [ ] Sin comuna, se incluyen las publicaciones con zona sin asignar.
- [ ] Dinero no captura datos financieros y remite a entidades del centro de información.
- [ ] Tiempo como voluntario muestra coincidencias e informa que el módulo no está disponible.
- [ ] Sin coincidencias se explica y se ofrece el tablero completo.
- [ ] **No se almacena ningún dato de quien ayuda.**
- [ ] Ninguna consulta devuelve más de 20 filas.

## Frontera de reversión

Se retira eliminando `app/quiero-ayudar/` y la tabla de traducción del dominio. No deja datos huérfanos, porque no escribe ninguno. La pantalla principal quedaría con una acción menos.

## Siguiente paso

[Fase 6 — Moderación](./fase-6-moderacion.md)

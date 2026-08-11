[← Fase 5](./fase-5-quiero-ayudar.md) · [Índice](./README.md)

# Fase 6 — Moderación y aviso de privacidad

La moderación de esta plataforma es reactiva por diseño: una publicación se ve al instante y alguien la revisa después. Esta fase construye ese «después». Sin ella, un teléfono publicado por un tercero malintencionado permanece indefinidamente, y una foto inapropiada también.

Es la última fase del MVP.

| | |
| --- | --- |
| **Entrega** | Autenticación del equipo, bandeja de moderación, gestión del contenido institucional, alertas y aviso de privacidad |
| **Depende de** | Fases 4 y 5, y las decisiones **D-1** y **D-2** |
| **Requisitos del TRD** | RF-6.1 a RF-6.9, RNF-5.1 a RNF-5.6, §11.5 |

> **El aviso de privacidad bloquea la publicación.** No se puede publicar legalmente un formulario que recoge y divulga datos personales sin declarar quién es el responsable del tratamiento. Eso es **D-1**, y es de la organización, no técnica.

## Cortes de PR (opcionales)

| PR | Unidades | Entrega verificable por sí sola |
| --- | --- | --- |
| 6-A | 6.1 a 6.4 | Acceso del equipo y moderación de publicaciones |
| 6-B | 6.5 a 6.8 | Gestión del contenido institucional, alertas y aviso de privacidad |

6-A es desplegable solo: da a la organización la capacidad de moderar lo que la fase 4 ya publicó.

## Ruta rápida

1. Autenticación y guarda, confirmando que un usuario ajeno al equipo no entra.
2. Bandeja con sus acciones, cada una registrada en auditoría.
3. Contenido institucional editable, alertas y aviso de privacidad.

---

## Unidades de trabajo

### PR 6-A — Acceso y moderación

| ID | Commit | Entrega | Comprobación |
| --- | --- | --- | --- |
| 6.1 | `feat(moderation): add team authentication and route guard` | Inicio de sesión, guarda de ruta, comprobación de pertenencia | Un usuario **autenticado pero ausente de `staff_members`** recibe denegación. Un anónimo es redirigido. No existe ninguna ruta de registro público |
| 6.2 | `feat(moderation): add the inbox with filters` | Listado con filtros por categoría, comuna, estado, prioridad y **zona sin asignar** | En base de datos: el listado muestra las coordenadas **exactas**, a diferencia de la vista pública. Incluye ocultas y retiradas, que el tablero no muestra |
| 6.3 | `feat(moderation): add moderation actions with an audit trail` | Verificar con fuente, marcar duplicada, ocultar, retirar, asignar prioridad y **asignar comuna** | Verificar **sin indicar fuente es rechazado por la restricción de coherencia**. Cada acción escribe una fila de auditoría con autor y fecha. La auditoría **no admite modificación ni borrado** |
| 6.4 | `feat(moderation): let a moderator retire a photo on its own` | Retiro de foto sin ocultar la publicación | Tras retirar la foto, la publicación **sigue visible** y el detalle ya no la muestra. El archivo deja de ser accesible |

### PR 6-B — Contenido institucional y requisito legal

| ID | Commit | Entrega | Comprobación |
| --- | --- | --- | --- |
| 6.5 | `feat(moderation): add institutional content management` | Crear, editar, publicar y despublicar recursos; estado, **fuente** y fecha de verificación | Al marcar verificado **se exigen fuente y fecha**. Despublicar retira el recurso del centro de información de inmediato |
| 6.6 | `feat(moderation): add photo upload with mandatory alt text` | Carga de fotos de referencia | **No se puede guardar una foto sin texto alternativo.** Los metadatos se eliminan igual que en la fase 4 |
| 6.7 | `feat(moderation): manage active alerts and their expiry` | Publicar, editar y vencer alertas | Una alerta con vencimiento pasado deja de mostrarse en la pantalla principal sin intervención manual |
| 6.8 | `docs(legal): publish the privacy notice` | Aviso de privacidad | Enlazado desde el formulario y desde el pie. Contiene responsable, finalidad, **el carácter público de nombre, teléfono y foto**, conservación y canal de ejercicio de derechos |

### 6.1 — Estar autenticado no basta

La guarda comprueba pertenencia a `staff_members`, no solo sesión válida. Supabase Auth permite registro con correo, así que si la comprobación fuera «tiene sesión», cualquiera que se registrara entraría a la bandeja con todos los datos de contacto de personas afectadas.

El caso que importa es el del medio: **usuario autenticado, con sesión perfectamente válida, ausente de `staff_members`.** No el del usuario anónimo, que es el fácil.

### 6.3 — La auditoría es lo que hace defendible un tablero público

Un tablero público donde alguien puede ocultar una publicación sin dejar rastro es indefendible ante un reclamo: no habría forma de responder quién la ocultó ni por qué.

Por eso `moderation_log` **no tiene política de `UPDATE` ni de `DELETE`** para ningún rol, y se comprueba directamente en sus políticas. Un registro de auditoría que se puede reescribir no es un registro de auditoría.

El campo de autor distingue dos identidades: el identificador del usuario del equipo, o el literal que marca una acción hecha por el propio ciudadano con su token en la fase 4.

### 6.3b — Asignar la zona es la cola de trabajo real

Toda publicación cuyo barrio no coincidió con el catálogo llega aquí con la zona sin asignar. El Moderador la resuelve y **puede añadir ese barrio al catálogo**, para que la próxima vez se resuelva solo.

Es la única parte de la moderación que mejora el sistema en lugar de solo corregirlo.

### 6.4 — Una foto mala no debe costar una publicación

En un canal público sin verificación previa alguien subirá una foto inapropiada. Si la única herramienta fuera ocultar la publicación completa, una necesidad legítima perdería su visibilidad por culpa de su foto. Retirar la foto y dejar la publicación es la acción proporcionada.

### 6.5 — El contenido institucional exige fuente

Es la diferencia entre los dos regímenes del TRD §6. Una publicación ciudadana se acepta sin fuente; un recurso institucional **no se marca como confirmado sin fuente y sin fecha**, porque quien lo lee va a tomar una decisión de desplazamiento basándose en él.

Aquí viven también las reglas RI-1 a RI-6: la interfaz de edición no debe facilitar marcar como abierto un albergue sin confirmación, ni como cerrado un hospital que solo presenta afectaciones.

### 6.7 — Una alerta vencida es desinformación

Las alertas son temporales por naturaleza. El toque de queda del 10 de agosto vencía a las 5:00 a. m. del día siguiente. Mostrar como vigente una restricción que ya terminó no es un defecto cosmético: es información falsa sobre lo que la autoridad ordena.

El vencimiento se evalúa en servidor y no depende de que un Moderador se acuerde de retirarla.

### 6.8 — El aviso no es un trámite

Tiene que declarar de forma expresa que el nombre, el teléfono y la foto son **públicos y visibles por cualquier persona en internet**. Es el punto donde la decisión de producto del TRD §11.1 se hace explícita ante la persona afectada y ante la autoridad.

La Ley 1581 exige autorización informada para una finalidad determinada. Las dos casillas de la fase 4 y este aviso son las dos mitades del mismo requisito: sin el aviso publicado, las casillas no autorizan nada.

---

## Lo que esta fase no construye

- **Exportación a CSV.** Fuera del MVP: nadie ha declarado qué se hace con ese archivo.
- **Bandeja de aportes.** «Quiero ayudar» no registra a nadie (TRD RF-3.11), así que no hay nada que moderar.
- Mapas de calor, gráficas, métricas agregadas y asignación automática de recursos.

---

## Verificación

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

Comprobaciones manuales y de base de datos:

- Una persona autenticada ausente de `staff_members` no entra a moderación.
- Cada acción añade un registro con autor y fecha.
- Retirar una foto no oculta la publicación y el archivo deja de ser accesible.
- Marcar un recurso como confirmado sin fuente se rechaza.
- Una alerta con vencimiento pasado desaparece de la pantalla principal sola.

```sql
-- Esperado: solo SELECT e INSERT; ninguna política de UPDATE ni DELETE.
select policyname, cmd
from pg_policies
where tablename = 'moderation_log'
order by 1;
```

---

## Definición de terminado

- [ ] Un usuario autenticado ausente de `staff_members` no accede. Comprobado.
- [ ] No existe ninguna ruta de registro público.
- [ ] La bandeja filtra por categoría, comuna, estado, prioridad y zona sin asignar.
- [ ] La bandeja muestra coordenadas exactas; la vista pública sigue mostrando las redondeadas.
- [ ] Verificar sin indicar fuente se rechaza.
- [ ] Cada acción escribe una fila de auditoría con autor y fecha.
- [ ] La auditoría no admite modificación ni borrado por ningún rol. Verificado en el catálogo de políticas.
- [ ] Un Moderador asigna la comuna a una publicación sin resolver y puede añadir el barrio al catálogo.
- [ ] Un Moderador retira una foto y la publicación sigue visible.
- [ ] El archivo de una foto retirada deja de ser accesible.
- [ ] Crear, editar, publicar y despublicar recursos institucionales.
- [ ] Marcar un recurso como confirmado exige fuente y fecha.
- [ ] No se puede guardar una foto de referencia sin texto alternativo.
- [ ] Las fotos institucionales también pasan por la limpieza de metadatos.
- [ ] Publicar y vencer alertas; una vencida desaparece sin intervención.
- [ ] El aviso de privacidad está publicado, enlazado, y declara el carácter público de nombre, teléfono y foto.
- [ ] **D-1 resuelta:** el responsable del tratamiento está identificado en el aviso.
- [ ] **D-2 resuelta:** hay personas asignadas a moderar, con frecuencia acordada.

## Frontera de reversión

6-B se retira solo, eliminando la gestión de contenido y el aviso; la plataforma quedaría sin poder publicarse legalmente pero funcionando. 6-A no debería revertirse mientras la fase 4 esté desplegada: dejaría contenido público sin ninguna capacidad de moderación.

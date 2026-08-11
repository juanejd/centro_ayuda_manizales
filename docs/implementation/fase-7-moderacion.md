[← Fase 6](./fase-6-quiero-ayudar.md) · [Índice](./README.md) · Siguiente: [Fase 8 — Endurecimiento](./fase-8-endurecimiento.md)

# Fase 7 — Moderación y aviso de privacidad

La moderación de esta plataforma es reactiva por diseño: una necesidad se publica al instante y alguien la revisa después. Esta fase construye ese «después». Sin ella, un teléfono publicado por un tercero malintencionado permanece indefinidamente, y una foto inapropiada también.

| | |
| --- | --- |
| **Entrega** | Autenticación del equipo, bandeja de moderación, gestión del directorio, exportación, aviso de privacidad |
| **Depende de** | Fases 4 y 6, y la decisión **D-1** |
| **Requisitos del TRD** | RF-6.1 a RF-6.9, RNF-6.1 a RNF-6.7, §8.5 |
| **Tamaño estimado** | ~650 líneas · cabe en el presupuesto de 800 · **un PR, o dos si se prefiere revisar por partes** |

> **El aviso de privacidad bloquea la publicación.** No se puede publicar legalmente un formulario que recoge y divulga datos personales sin declarar quién es el responsable del tratamiento. Eso es la decisión **D-1**, y es de la organización, no técnica.

## Cortes de PR (opcionales)

La fase cabe en un solo PR. Este corte se conserva porque separa dos entregas con valor propio, no porque el tamaño lo obligue.

| PR | Unidades | Entrega verificable por sí sola |
| --- | --- | --- |
| 7-A | 7.1 a 7.5 | Acceso del equipo y moderación de necesidades y aportes |
| 7-B | 7.6 a 7.8 | Gestión del directorio, exportación y aviso de privacidad |

7-A es desplegable solo: da a la organización la capacidad de moderar lo que la fase 4 ya publicó. 7-B añade la gestión de contenido y el requisito legal.

## Ruta rápida

1. Autenticación y guarda de acceso, confirmando que un usuario ajeno al equipo no entra.
2. Bandeja de necesidades con sus acciones, cada una registrada en auditoría.
3. Directorio editable y aviso de privacidad.

---

## Unidades de trabajo

### PR 7-A — Acceso y moderación

| ID | Commit | Entrega | Comprobación |
| --- | --- | --- | --- |
| 7.1 | `feat(moderation): add team authentication and route guard` | Inicio de sesión, guarda de ruta, comprobación de pertenencia | Comprobar: un usuario **autenticado pero ausente de `staff_members`** recibe denegación. Comprobar: un usuario anónimo es redirigido. Comprobar: no existe ninguna ruta de registro público |
| 7.2 | `feat(moderation): add the needs inbox with filters` | Listado con filtros por categoría, comuna, estado y prioridad | Comprobar en base de datos: el listado muestra las coordenadas **exactas**, a diferencia de la vista pública. Comprobar: incluye ocultas y retiradas, que el tablero no muestra |
| 7.3 | `feat(moderation): add moderation actions with an audit trail` | Verificar con fuente, marcar duplicada, ocultar, retirar, asignar prioridad | Comprobar: verificar **sin indicar fuente es rechazado por la restricción de coherencia**. Comprobar: cada acción escribe una fila de auditoría con autor y fecha. Comprobar: la auditoría **no admite modificación ni borrado** |
| 7.4 | `feat(moderation): let a moderator retire a photo on its own` | Retiro de foto sin ocultar la necesidad | Comprobar en el navegador: tras retirar la foto, la necesidad **sigue publicada** y el detalle ya no la muestra. Comprobar: el archivo deja de ser accesible |
| 7.5 | `feat(moderation): add the offers list for proactive contact` | Listado de aportes con sus datos de contacto | Comprobar: el listado muestra teléfono y correo, que ninguna vista pública expone |

### PR 7-B — Contenido y requisito legal

| ID | Commit | Entrega | Comprobación |
| --- | --- | --- | --- |
| 7.6 | `feat(moderation): add directory management` | Crear, editar, publicar y despublicar recursos; estado y fecha de verificación | Comprobar: al marcar verificado **se exige la fecha**. Comprobar en el navegador: despublicar retira el recurso del directorio público de inmediato |
| 7.7 | `feat(moderation): add photo upload with mandatory captions` | Carga de fotos de referencia con descripción | Comprobar en el navegador: **no se puede guardar una foto sin descripción**. Comprobar: los metadatos se eliminan igual que en la fase 4 |
| 7.8 | `feat(moderation): add CSV export of the filtered view` | Exportación | Comprobar: el CSV respeta los filtros activos. Comprobar: escapa comas, comillas y saltos de línea sin corromper columnas |
| 7.9 | `docs(legal): publish the privacy notice` | Página de aviso de privacidad | Comprobar en el navegador: enlazada desde ambos formularios y desde el pie. Comprobar: contiene responsable, finalidad, **el carácter público de nombre, teléfono y foto**, conservación y canal de ejercicio de derechos |

### 7.3 — La auditoría es lo que hace defendible un tablero público

Un tablero público donde alguien puede ocultar una necesidad sin dejar rastro es indefendible ante un reclamo: no habría forma de responder quién la ocultó ni por qué.

Por eso `moderation_log` **no tiene política de `UPDATE` ni de `DELETE`** para ningún rol, y se comprueba directamente en sus políticas. Un registro de auditoría que se puede reescribir no es un registro de auditoría.

El campo de autor distingue dos identidades: el identificador del usuario del equipo, o el literal que marca una acción hecha por el propio ciudadano con su token en la fase 4. Ambas rutas escriben en el mismo registro.

### 7.1 — Estar autenticado no basta

La guarda comprueba pertenencia a `staff_members`, no solo sesión válida. Supabase Auth permite registro con correo, así que si la comprobación fuera «tiene sesión», cualquiera que se registrara entraría a la bandeja con todos los datos de contacto de personas afectadas.

El caso que importa es el del medio: **usuario autenticado, con sesión perfectamente válida, ausente de `staff_members`.** No la del usuario anónimo, que es la fácil.

### 7.4 — Una foto mala no debe costar una necesidad

RF-6.4 existe porque en un canal público sin verificación previa alguien subirá una foto inapropiada. Si la única herramienta fuera ocultar la necesidad completa, una necesidad legítima perdería su visibilidad por culpa de su foto. Retirar la foto y dejar la necesidad publicada es la acción proporcionada.

### 7.9 — El aviso no es un trámite

Tiene que declarar de forma expresa que el nombre, el teléfono y la foto son **públicos y visibles por cualquier persona en internet**. Es el punto donde la decisión de producto de §8.1 se hace explícita ante la persona afectada y ante la autoridad.

La Ley 1581 exige autorización informada para una finalidad determinada. Las dos casillas de la fase 4 y este aviso son las dos mitades del mismo requisito: sin el aviso publicado, las casillas no autorizan nada.

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
- Cada acción de moderación añade un registro con autor y fecha.
- Retirar una foto no oculta la necesidad completa y el archivo deja de ser accesible.
- El CSV respeta los filtros y escapa comas, comillas y saltos de línea.

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
- [ ] La bandeja filtra por categoría, comuna, estado de moderación y prioridad.
- [ ] La bandeja muestra coordenadas exactas; la vista pública sigue mostrando las redondeadas.
- [ ] Verificar sin indicar fuente se rechaza.
- [ ] Cada acción de moderación escribe una fila de auditoría con autor y fecha.
- [ ] La auditoría no admite modificación ni borrado por ningún rol. Verificado en el catálogo de políticas.
- [ ] Un Moderador retira una foto y la necesidad sigue publicada.
- [ ] El archivo de una foto retirada deja de ser accesible.
- [ ] El listado de aportes muestra los datos de contacto que ninguna vista pública expone.
- [ ] Crear, editar, publicar y despublicar recursos del directorio.
- [ ] Marcar un recurso como verificado exige su fecha.
- [ ] No se puede guardar una foto de referencia sin descripción.
- [ ] Las fotos del directorio también pasan por la limpieza de metadatos.
- [ ] El CSV respeta los filtros y escapa correctamente comas, comillas y saltos de línea.
- [ ] El aviso de privacidad está publicado, enlazado desde ambos formularios, y declara el carácter público de nombre, teléfono y foto.
- [ ] **D-1 resuelta:** el responsable del tratamiento está identificado en el aviso.
- [ ] **D-2 resuelta:** hay personas asignadas a moderar, con frecuencia acordada.

## Frontera de reversión

7-B se retira solo, eliminando la gestión del directorio y el aviso; la plataforma quedaría sin poder publicarse legalmente pero funcionando. 7-A no debería revertirse mientras la fase 4 esté desplegada: dejaría contenido público sin ninguna capacidad de moderación.

## Siguiente paso

[Fase 8 — Endurecimiento](./fase-8-endurecimiento.md)

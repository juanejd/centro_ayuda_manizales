[← Fase 0](./fase-0-andamiaje.md) · [Índice](./README.md) · Siguiente: [Fase 2 — Pantalla principal](./fase-2-pantalla-principal.md)

# Fase 1 — Datos

Traslada [`docs/data-model.sql`](../data-model.sql) a migraciones versionadas y **prueba que el modelo de seguridad funciona de verdad**. La seguridad de esta plataforma vive en la base de datos: si RLS o los privilegios por columna están mal, ninguna capa de la aplicación lo compensa.

| | |
| --- | --- |
| **Entrega** | Migraciones, vista pública, RLS, privilegios por columna, buckets, semillas |
| **Depende de** | Fase 0 |
| **Requisitos del TRD** | §8.5, §9 completa, RNF-5.2, RNF-5.6, RNF-5.8, RNF-5.14, RNF-5.15 |
| **Tamaño estimado** | ~380 líneas de SQL más ~250 de pruebas · un PR, cerca del umbral |

El DDL ya está escrito y validado. Esta fase no lo rediseña: lo parte en migraciones ordenadas y le añade la batería de pruebas que el archivo suelto no puede tener.

## Ruta rápida

1. `supabase/migrations/0001_reference_data.sql` con los catálogos de comunas y barrios de Manizales.
2. Escribir la prueba que atribuye un barrio a la comuna equivocada y **espera un rechazo**; luego la migración que lo rechaza.
3. Repetir por tabla, siempre migración más su prueba de seguridad en el mismo commit.

---

## Unidades de trabajo

| ID | Commit | Entrega | Prueba primero |
| --- | --- | --- | --- |
| 1.1 | `feat(db): add comunas y neighborhoods catalogue with foreign key integrity` | `0001_reference_data.sql`, disparador `touch_updated_at`, extensiones | Los 5 casos de la clave foránea compuesta: par válido, barrio de otra comuna, zona sin barrio, sin resolver, y barrio sin comuna |
| 1.2 | `feat(db): add help_requests with coherence constraints` | `0002_help_requests.sql` | Las cinco restricciones de coherencia rechazan: verificado sin fuente, atendida sin fecha, retirada sin marca, duplicado de sí misma, código con letra ambigua |
| 1.3 | `feat(db): expose help requests through a narrow public view` | `0003_public_view.sql` | La vista **no** contiene `manage_token`, `priority`, coordenadas exactas, `request_id` ni marcas de consentimiento. Las coordenadas salen redondeadas a 3 decimales. Las retiradas y caducadas no aparecen |
| 1.4 | `feat(db): lock down anonymous access with RLS and column grants` | `0004_rls_help_requests.sql` | `anon` recibe permiso denegado en `SELECT`, `UPDATE` y `DELETE` sobre la tabla; **y también al insertar suministrando `priority` o `moderation_status`**. `anon` sí puede leer la vista e insertar en las columnas permitidas |
| 1.5 | `feat(db): add help_offers with no anonymous read path` | `0005_help_offers.sql` | `anon` puede insertar y **no** puede leer ni una fila |
| 1.6 | `feat(db): add directory tables with weighted spanish search` | `0006_info_resources.sql` | «albergues» encuentra «albergue» por derivación de raíces; «hospi» encuentra «Hospital» por trigrama; una coincidencia en el nombre ordena por encima de una en la descripción |
| 1.7 | `feat(db): add staff membership and an append-only audit log` | `0007_moderation.sql`, función `is_staff()` | Un usuario autenticado que no está en `staff_members` no lee nada. El registro de auditoría **no admite `UPDATE` ni `DELETE`** ni siquiera para el equipo |
| 1.8 | `feat(storage): create photo buckets with non-enumerable paths` | Buckets y sus políticas | El listado del bucket está deshabilitado. La escritura solo es posible desde el servidor |
| 1.9 | `feat(db): seed comunas y neighborhoods and the initial directory` | `supabase/seed/` | La semilla se aplica dos veces sin duplicar filas (idempotente) |

### 1.4 — La prueba que no se puede omitir

Esta es la unidad de mayor consecuencia de toda la fase. RLS sola **no** impide que el rol anónimo suministre un valor en `priority`: un `WITH CHECK` rechaza la fila, pero solo un privilegio por columna impide que la columna se mencione. Ambas capas deben existir y ambas deben estar probadas.

```
Debe DENEGAR                                    Debe PERMITIR
─────────────────────────────────────────────   ─────────────────────────────────
SELECT  sobre help_requests                     SELECT sobre public_help_requests
UPDATE  sobre help_requests                     INSERT en las columnas permitidas
DELETE  sobre help_requests                     SELECT sobre comunas y neighborhoods activos
SELECT  sobre help_offers                       INSERT en help_offers
SELECT  sobre staff_members                     SELECT sobre info_resources publicados
SELECT  sobre moderation_log
INSERT  suministrando priority
INSERT  suministrando moderation_status
```

Cada línea es un caso de prueba. No se agrupan en uno solo: cuando falle, hay que saber cuál.

### 1.3 — Por qué la vista se prueba por ausencia

La prueba correcta no es «la vista devuelve el teléfono». Es **«la vista no devuelve el token de gestión»**. Se consulta el catálogo de columnas de la vista y se afirma que un conjunto concreto de nombres está ausente. Así, si alguien añade una columna a la tabla y la arrastra a la vista sin pensarlo, la prueba lo detiene.

La vista se declara con `security_invoker = false` y `security_barrier = true`. El primer valor es lo que permite que `anon` lea a través de ella sin tener privilegio sobre la tabla. Ponerlo en `true` —como hacen algunas plantillas de Supabase— rompe el tablero por completo. La prueba de 1.4 lo detecta, porque `anon` dejaría de poder leer la vista.

### 1.9 — Datos que no se pueden inventar

La semilla necesita información real de la organización: el listado de comunas y corregimientos de Manizales, el **catálogo de barrios con su comuna** —que es lo que alimenta el autocompletado—, los números de las líneas de emergencia, y el listado inicial de albergues, hospitales y puntos de donación con su fuente y su fecha de verificación.

La fase se puede cerrar con una semilla mínima —las once comunas, un puñado de barrios, una línea— y completarse cuando lleguen los datos. El autocompletado degrada solo: un barrio ausente deja la zona sin asignar, que es un caso ya contemplado. Lo que no se puede es rellenarla con valores plausibles: un teléfono equivocado en el directorio de una emergencia hace daño real.

---

## Orden de las migraciones

El orden no es negociable, lo imponen las claves foráneas:

```
0001_reference_data      comunas y neighborhoods, touch_updated_at, extensiones
0002_help_requests       depende de comunas y neighborhoods
0003_public_view         depende de help_requests y comunas y neighborhoods
0004_rls_help_requests   depende de la vista, porque concede SELECT sobre ella
0005_help_offers         depende de comunas y neighborhoods
0006_info_resources      depende de comunas y neighborhoods; incluye fotos
0007_moderation          staff_members, moderation_log, is_staff()
```

`is_staff()` va en 0007 aunque las políticas de 0004 la usen. Se resuelve declarándola en 0001 junto al resto de helpers, o dividiendo las políticas del equipo a 0007. Elegir una y ser consistente; la primera opción produce migraciones más limpias.

---

## Verificación

```bash
pnpm test:db                  # la batería completa contra una base desechable
pnpm db:reset                 # aplica todas las migraciones desde cero
pnpm db:seed                  # aplica la semilla
pnpm db:seed                  # otra vez: debe pasar sin duplicar
```

Comprobación del esquema resultante:

```sql
-- Esperado: 7 tablas, 1 vista, RLS activo en todas
select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r' order by 1;

-- Esperado: vacío. Ninguna columna sensible en la vista.
select column_name from information_schema.columns
where table_name = 'public_help_requests'
  and column_name in ('request_id','manage_token','priority','latitude','longitude',
                      'verified_by','duplicate_of','expires_at',
                      'consent_accepted_at','public_consent_at');
```

---

## Definición de terminado

- [ ] Las siete migraciones se aplican desde cero sin errores.
- [ ] RLS activo en las siete tablas. Ninguna queda sin él.
- [ ] Los ocho casos de denegación de 1.4 pasan como pruebas independientes.
- [ ] Los cinco casos de permiso de 1.4 pasan.
- [ ] La vista no expone ninguna de las columnas prohibidas. Verificado consultando el catálogo, no leyendo el SQL.
- [ ] Las coordenadas de la vista salen redondeadas a tres decimales.
- [ ] Un barrio atribuido a una comuna que no le corresponde se rechaza. Cuatro variantes de escritura libre probadas.
- [ ] Las cinco restricciones de coherencia rechazan sus estados incoherentes.
- [ ] El registro de auditoría no admite modificación ni borrado por ningún rol.
- [ ] La búsqueda en español deriva raíces; el trigrama encuentra escritura parcial.
- [ ] El bucket de fotos no permite listado.
- [ ] La semilla es idempotente.
- [ ] Cada índice de clave foránea existe: `duplicate_of`, `verified_by`, `updated_by`, `resource_id`, `comuna_code` y `neighborhood_code` en las tres tablas, `comuna_code` en `neighborhoods`, y el par polimórfico de auditoría.
- [ ] Una necesidad con la zona sin asignar **sí aparece** en la vista pública. El `JOIN` de geografía es `LEFT`, no interno. Verificado con prueba automatizada.

## Frontera de reversión

Se retira eliminando `supabase/migrations/`, `supabase/seed/` y su carpeta de pruebas. Nada de la aplicación depende todavía del esquema, porque las fases 2 y siguientes aún no existen.

## Siguiente paso

[Fase 2 — Pantalla principal](./fase-2-pantalla-principal.md)

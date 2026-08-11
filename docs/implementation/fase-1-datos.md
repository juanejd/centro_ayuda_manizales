[← Fase 0](./fase-0-andamiaje.md) · [Índice](./README.md) · Siguiente: [Fase 2 — Pantalla principal](./fase-2-pantalla-principal.md)

# Fase 1 — Datos

Traslada [`docs/data-model.sql`](../data-model.sql) a migraciones versionadas sin rediseñar el esquema. La seguridad sigue viviendo en PostgreSQL: RLS, privilegios por columna y vistas acotadas deben quedar visibles y comprobables en el esquema aplicado.

| Tema | Decisión |
| --- | --- |
| Entrega | Migraciones, vista pública, RLS, privilegios, buckets y semillas |
| Depende de | Fase 0 |
| Requisitos del TRD | §8.5, §9 completa, RNF-5.2, RNF-5.6, RNF-5.8, RNF-5.14, RNF-5.15 |

## Ruta rápida

1. Crear migraciones con la CLI oficial de Supabase y conservar el orden de dependencias.
2. Trasladar el DDL existente sin inventar entidades ni datos.
3. Aplicar las migraciones desde cero y revisar las restricciones y políticas en PostgreSQL.
4. Aplicar la semilla dos veces para confirmar que es idempotente.

## Unidades de trabajo

| ID | Entrega | Comprobación |
| --- | --- | --- |
| 1.1 | Catálogos de comunas y barrios, extensiones y `touch_updated_at` | La clave foránea compuesta acepta pares válidos y rechaza un barrio asociado a otra comuna |
| 1.2 | `help_requests` y sus restricciones | PostgreSQL rechaza estados incoherentes, códigos inválidos y relaciones duplicadas imposibles |
| 1.3 | Vista `public_help_requests` | El catálogo confirma que no expone tokens, prioridad, coordenadas exactas ni consentimientos |
| 1.4 | RLS y privilegios de `help_requests` | `anon` solo puede insertar columnas permitidas y leer la vista pública |
| 1.5 | `help_offers` | Se crea con el resto del esquema. **Ninguna ruta del MVP escribe en ella**: «Quiero ayudar» filtra y no registra (TRD RF-3.11) |
| 1.6 | `info_resources` y fotos | La lectura pública se limita a recursos publicados y la búsqueda usa configuración en español |
| 1.7 | Equipo y auditoría | Solo miembros del equipo acceden; la auditoría no permite modificación ni borrado |
| 1.8 | Buckets y políticas | La escritura es de servidor y el listado del bucket está deshabilitado |
| 1.9 | Semilla del documento verificado | Dos aplicaciones consecutivas no duplican filas. Cada fila conserva su fuente y su fecha de verificación |

### Seguridad que debe comprobarse

```text
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

RLS sola no impide que `anon` mencione una columna sensible al insertar. El `WITH CHECK` protege el valor y el privilegio por columna impide que esa columna forme parte de la operación; hacen falta ambas capas.

La vista pública se revisa por ausencia: una columna nueva en la tabla no puede llegar por accidente a internet. Las coordenadas deben salir redondeadas y las filas retiradas o caducadas no deben aparecer.

### 1.9 — La semilla ya existe y está verificada

El contenido del centro de información **no hay que redactarlo**: está en [`base_verificada_emergencia_sismo_manizales_2026-08-10.md`](../../base_verificada_emergencia_sismo_manizales_2026-08-10.md), con fuentes del Servicio Geológico Colombiano y la Alcaldía de Manizales, y hora de corte declarada.

| Sección del documento | Categoría sembrada |
| --- | --- |
| §3 Líneas de emergencia | `lineas_atencion` |
| §4 Albergues | `albergues`, **solo el Coliseo Mayor** |
| §5 Donación de sangre | `donacion_sangre` |
| §6 Hospitales y red médica | `hospitales` |
| §9 Vías y movilidad | `cierres_viales` |
| §10 Servicios públicos | `servicios_publicos` |
| §11 Apoyo psicosocial | `lineas_atencion` |

Reglas de siembra, tomadas del propio documento. No son preferencias:

- **Solo se siembra el Coliseo Mayor como albergue.** El balance oficial dice que hay tres habilitados, pero solo identifica uno por nombre. Sembrar los otros dos con una ubicación plausible sería inventar un refugio (RI-1).
- **El Hospital Santa Sofía se siembra con afectaciones, nunca como cerrado.** «Presenta afectaciones» no es «cerrado» mientras una autoridad no lo confirme (RI-2).
- **Solo el Cable Aéreo entra en cierres viales.** Es el único con comunicado oficial; no existe listado consolidado de vías urbanas cerradas (RI-4).
- **Los dígitos de opción no van en el teléfono.** «123 opción 2» se siembra con teléfono `123` y la opción en la descripción. Concatenar produciría `1232`, un número inexistente.
- Todo lo que la §16 del documento marca como pendiente **no se siembra como confirmado**.

Lo que sigue sin poderse inventar son los catálogos: comunas, corregimientos y barrios de Manizales con su comuna. Esos los aporta la organización.

## Orden de migración

```text
reference_data        comunas, neighborhoods, extensiones y helpers
help_requests         depende de los catálogos
public_view           depende de help_requests y los catálogos
rls_help_requests     depende de la vista
help_offers           depende de los catálogos
info_resources        depende de los catálogos; incluye fotos
moderation            staff_members, moderation_log y políticas del equipo
storage               buckets y políticas
```

La numeración concreta la genera la CLI. No se inventan nombres de archivo manualmente.

## Verificación

```bash
pnpm lint
pnpm typecheck
pnpm build
supabase --version
supabase db reset
supabase migration list --local
```

La semilla se vuelve a aplicar con el comando nativo configurado por el proyecto y el recuento de filas debe permanecer estable.

Consultas mínimas sobre el esquema resultante:

```sql
-- Todas las tablas públicas deben tener RLS activo.
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by 1;

-- Esperado: ninguna fila.
select column_name
from information_schema.columns
where table_name = 'public_help_requests'
  and column_name in (
    'request_id', 'manage_token', 'priority', 'latitude', 'longitude',
    'verified_by', 'duplicate_of', 'expires_at',
    'consent_accepted_at', 'public_consent_at'
  );
```

También se ejecutan manualmente los casos de permiso y denegación de la tabla anterior con los roles `anon` y autenticado.

## Definición de terminado

- [ ] Las migraciones se aplican desde cero sin errores.
- [ ] RLS está activo en todas las tablas expuestas.
- [ ] Los permisos de `anon` coinciden con la matriz de acceso del TRD.
- [ ] La vista no expone columnas sensibles y redondea las coordenadas.
- [ ] Las restricciones rechazan estados incoherentes y geografía inválida.
- [ ] La auditoría es de solo adición.
- [ ] La búsqueda en español y la escritura parcial funcionan.
- [ ] El bucket de fotos no permite listado público.
- [ ] La semilla es idempotente y usa únicamente datos confirmados del documento verificado.
- [ ] Cada recurso sembrado conserva su fuente y su fecha de verificación.
- [ ] Solo se sembró un albergue, porque solo uno está identificado por nombre.
- [ ] Ningún teléfono sembrado incluye el dígito de opción del menú.
- [ ] Los índices de claves foráneas y de caminos de lectura existen.

## Frontera de reversión

Se retira eliminando las migraciones y la semilla añadidas en esta fase. Antes de revertir en un entorno con datos se debe exportar la información y confirmar el impacto.

## Siguiente paso

[Fase 2 — Pantalla principal](./fase-2-pantalla-principal.md)

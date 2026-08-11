[← Fase 7](./fase-7-moderacion.md) · [Índice](./README.md)

# Fase 8 — Endurecimiento

Lo que hace que la plataforma sobreviva a la semana dos: consulta sin conexión, conservación de datos con vencimiento y las auditorías completas de rendimiento, accesibilidad y seguridad. Ninguna de estas piezas se nota cuando está; todas se notan cuando faltan.

| | |
| --- | --- |
| **Entrega** | PWA, política de conservación aplicada, auditorías finales |
| **Depende de** | Todas las fases anteriores |
| **Requisitos del TRD** | RNF-3.4, RNF-3.5, RNF-6.6, §7 completa, §8 completa |
| **Tamaño estimado** | ~300 líneas · un solo PR |

## Ruta rápida

1. Service worker que cachea pantalla principal, directorio y primera página del tablero.
2. Tarea de conservación a 12 meses con anonimización y borrado de fotos.
3. Las tres auditorías, con sus resultados registrados en el repositorio.

---

## Unidades de trabajo

| ID | Commit | Entrega | Prueba primero |
| --- | --- | --- | --- |
| 8.1 | `feat(pwa): cache the read-only surfaces for offline use` | Manifiesto, service worker, estrategia de caché | E2E sin conexión: la pantalla principal, el directorio y la primera página del tablero se muestran. Test: los datos servidos sin conexión llevan su marca de antigüedad visible |
| 8.2 | `feat(pwa): tell the user when a submission cannot be sent` | Manejo explícito de envío sin conexión | E2E sin conexión: el formulario **no simula un envío exitoso**; muestra un error claro más las líneas de emergencia. Test: nada queda encolado |
| 8.3 | `feat(retention): anonymise personal data after twelve months` | Tarea programada de conservación | Test: un registro de 13 meses queda sin nombre, teléfono, correo ni coordenadas, **su foto borrada**, y conserva categoría, comuna y fecha. Test: uno de 11 meses queda intacto |
| 8.4 | `test(perf): audit performance budgets on every route` | Auditoría de rendimiento en CI | Lighthouse en 4G lento sobre las cinco rutas: LCP ≤ 2,0 s, INP ≤ 200 ms. Presupuestos de peso respetados |
| 8.5 | `test(a11y): audit accessibility across every user journey` | Auditoría de accesibilidad en CI | Axe sobre las cinco rutas: cero incidencias graves. Recorrido completo de cada formulario solo con teclado y con lector de pantalla |
| 8.6 | `test(security): assert the full mitigation checklist` | Batería de seguridad consolidada | Cada mitigación de §8.2 con su prueba. Ver la tabla de abajo |

### 8.2 — No encolar es una decisión, no una carencia

RNF-3.5 prohíbe encolar envíos sin conexión. Puede parecer una limitación, y es lo contrario: **un reporte que la persona cree enviado y que nunca llegó es peor que un error visible.** Alguien esperaría ayuda que nadie sabe que hace falta.

La prueba se escribe en negativo: sin conexión, el formulario **no** muestra confirmación y **no** deja nada en cola. Se afirma la ausencia, porque el riesgo real es que un service worker con configuración por defecto añada ese encolado sin que nadie lo pida.

### 8.1 — La caché sin conexión necesita fecha visible

Servir un albergue desde caché sin decir de cuándo es contradice RP-6 directamente. Todo dato servido sin conexión lleva su marca de antigüedad visible, y si supera las 72 horas se marca igual que en el directorio en línea.

### 8.3 — La conservación es un requisito legal con fecha

RNF-6.6 fija 12 meses. La anonimización elimina nombre, teléfono, correo, coordenadas y la foto, y conserva categoría, comuna y fecha, que sirven para estadística y no identifican a nadie.

La prueba necesita los dos lados: un registro que **debe** anonimizarse y otro que **no debe** tocarse. Solo con el primero, una tarea que borre todo pasaría en verde.

### 8.6 — La lista completa de mitigaciones

Cada fila es un caso de prueba. Muchos ya existen de fases anteriores; esta unidad los reúne en una batería que se corre entera antes de cada despliegue.

| Mitigación | Prueba | Fase donde nació |
| --- | --- | --- |
| RNF-5.1 Ninguna clave en el navegador | Inspección del bundle de cliente | 0 |
| RNF-5.2 `anon` sin acceso a la tabla | Permiso denegado en `SELECT` | 1 |
| RNF-5.3 Tope de 20 filas | Ningún parámetro lo eleva | 4, 5 |
| RNF-5.4 Límites de tasa | 429 en escrituras, filtrado y gestión | 4, 5, 6 |
| RNF-5.5 `noindex` en el tablero | Cabecera y `robots.txt` | 4 |
| RNF-5.6 Coordenadas redondeadas | La vista devuelve 3 decimales | 1 |
| RNF-5.7 Metadatos eliminados | Archivo con GPS almacenado limpio | 4 |
| RNF-5.8 Rutas no enumerables | Listado del bucket deshabilitado | 1 |
| RNF-5.9 Caducidad automática | 14 días y 48 horas | 4 |
| RNF-5.10 Retiro autónomo | Tras retirar, inaccesible por toda vía | 4 |
| RNF-5.11 Retiro de foto | La necesidad sobrevive a su foto | 7 |
| RNF-5.12 Aviso antifraude | Visible en el tablero | 4 |
| RNF-5.13 Aportantes no públicos | Ausentes de vista y API | 6 |
| RNF-5.14 RLS en todas las tablas | Catálogo de PostgreSQL | 1 |
| RNF-5.15 Privilegios por columna | `anon` no puede suministrar `priority` | 1 |
| RNF-5.16 Validación en servidor | Esquemas Zod rechazan | 4, 6 |
| RNF-5.17 Topes de longitud | Restricciones rechazan | 1 |
| RNF-5.19 Sin analítica de terceros | Ninguna petición externa en rutas con datos personales | 8 |

---

## Verificación

```bash
pnpm test:unit && pnpm test:db && pnpm test:e2e
pnpm test:security                  # la batería consolidada de 8.6
pnpm audit:perf                     # Lighthouse sobre las cinco rutas
pnpm audit:a11y                     # Axe sobre las cinco rutas
pnpm exec playwright test --project=offline
```

```bash
# Ninguna petición a un tercero en las rutas con datos personales
pnpm exec playwright test --grep "no third-party requests"
```

---

## Definición de terminado

- [ ] Pantalla principal, directorio y primera página del tablero se consultan sin conexión.
- [ ] Todo dato servido sin conexión muestra su marca de antigüedad.
- [ ] Sin conexión, un envío falla de forma visible y no queda nada en cola.
- [ ] Un registro de más de 12 meses queda anonimizado y sin foto.
- [ ] Un registro de menos de 12 meses queda intacto.
- [ ] LCP ≤ 2,0 s e INP ≤ 200 ms en las cinco rutas, en 4G lento.
- [ ] Presupuestos de peso respetados en las cinco rutas.
- [ ] Cero incidencias graves de accesibilidad en las cinco rutas.
- [ ] Cada formulario se completa solo con teclado y con lector de pantalla.
- [ ] Las 18 mitigaciones de la tabla de 8.6 tienen su prueba y pasan.
- [ ] Ninguna petición a terceros en rutas que muestran o capturan datos personales.
- [ ] Los informes de las tres auditorías quedan versionados en el repositorio.

---

## Antes del primer despliegue público

Lista final. Los tres primeros puntos no son técnicos y no los resuelve el equipo de desarrollo.

- [ ] **D-1:** responsable del tratamiento identificado en el aviso de privacidad publicado.
- [ ] **D-2:** personas asignadas a moderar, con frecuencia y compromiso de respuesta acordados.
- [ ] **Datos:** comunas, catálogo de barrios, líneas de emergencia y directorio inicial cargados con su fuente y fecha de verificación reales.
- [ ] La batería de seguridad completa en verde.
- [ ] Las tres auditorías en verde.
- [ ] Probado en un dispositivo real de gama baja, con red móvil real.

Ese último punto no lo sustituye ningún emulador. La plataforma se usa desde un teléfono barato, en la calle, con mala señal y con prisa. Si ahí funciona, funciona.

## Volver

[Índice de implementación](./README.md) · [TRD](../TRD.md)

[← Fase 7](./fase-7-moderacion.md) · [Índice](./README.md)

# Fase 8 — Endurecimiento

Cierra el MVP con consulta sin conexión, conservación de datos y una revisión manual completa antes de publicar. No incorpora infraestructura de entrega ni automatización del navegador.

| Tema | Decisión |
| --- | --- |
| Entrega | PWA, conservación a 12 meses y revisión final de rendimiento, accesibilidad y seguridad |
| Depende de | Todas las fases anteriores |
| Requisitos del TRD | RNF-3.4, RNF-3.5, RNF-6.6, §7 completa, §8 completa |

## Ruta rápida

1. Cachear solo la pantalla principal, el directorio y la primera página del tablero.
2. Mostrar la antigüedad de los datos servidos sin conexión y nunca encolar formularios.
3. Aplicar la conservación a 12 meses con anonimización y borrado de fotos.
4. Recorrer localmente los casos críticos antes del primer despliegue.

## Unidades de trabajo

| ID | Entrega | Comprobación |
| --- | --- | --- |
| 8.1 | Manifiesto, service worker y caché de superficies de lectura | Sin conexión, las tres superficies abren y muestran la antigüedad de sus datos |
| 8.2 | Error explícito para envíos sin conexión | El formulario no muestra éxito ni deja una operación en cola |
| 8.3 | Tarea de conservación | Un registro de 13 meses se anonimiza y pierde su foto; uno de 11 meses queda intacto |
| 8.4 | Revisión de rendimiento | Las cinco rutas cumplen los presupuestos del TRD bajo el perfil de red indicado |
| 8.5 | Revisión de accesibilidad | Las rutas se recorren con teclado, lector de pantalla y zoom al 200 % sin bloqueos graves |
| 8.6 | Revisión de seguridad | Cada mitigación de §8.2 se comprueba en su frontera real |

### No encolar es una decisión de seguridad

RNF-3.5 prohíbe encolar envíos sin conexión. Un reporte que la persona cree enviado y que nunca llegó es peor que un error visible. La interfaz debe informar el fallo, mantener los datos disponibles para corrección y mostrar las líneas oficiales.

### La caché necesita fecha visible

Servir un albergue desde caché sin decir de cuándo es contradice RP-6. Todo dato servido sin conexión muestra su antigüedad y, cuando supera 72 horas, el mismo aviso de desactualización del directorio en línea.

### La conservación tiene dos límites

RNF-6.6 fija 12 meses. La tarea elimina nombre, teléfono, correo, coordenadas y foto, y conserva categoría, comuna y fecha para estadísticas. La revisión usa un registro que debe anonimizarse y otro reciente que debe permanecer intacto.

### Lista de mitigaciones

| Mitigación | Comprobación | Fase |
| --- | --- | --- |
| RNF-5.1 Ninguna clave en el navegador | Revisar el código servido al cliente | 0 |
| RNF-5.2 `anon` sin acceso a la tabla | Ejecutar `SELECT` con el rol anónimo y confirmar denegación | 1 |
| RNF-5.3 Tope de 20 filas | Intentar elevarlo por parámetro y contar la respuesta | 4, 5 |
| RNF-5.4 Límites de tasa | Repetir escrituras, filtrado y gestión hasta recibir 429 | 4, 5, 6 |
| RNF-5.5 `noindex` en el tablero | Revisar cabecera y `robots.txt` | 4 |
| RNF-5.6 Coordenadas redondeadas | Consultar la vista pública | 1 |
| RNF-5.7 Metadatos eliminados | Inspeccionar una imagen almacenada que originalmente contenía GPS | 4 |
| RNF-5.8 Rutas no enumerables | Intentar listar el bucket con un cliente público | 1 |
| RNF-5.9 Caducidad automática | Revisar registros de 14 días y atendidos de 48 horas | 4 |
| RNF-5.10 Retiro autónomo | Confirmar ausencia en tablero, detalle y API | 4 |
| RNF-5.11 Retiro de foto | Confirmar que la necesidad permanece publicada | 7 |
| RNF-5.12 Aviso antifraude | Revisarlo en el tablero | 4 |
| RNF-5.13 Aportantes no públicos | Revisar vista y respuestas públicas | 6 |
| RNF-5.14 RLS en todas las tablas | Consultar el catálogo de PostgreSQL | 1 |
| RNF-5.15 Privilegios por columna | Intentar insertar `priority` como `anon` | 1 |
| RNF-5.16 Validación en servidor | Enviar valores inválidos directamente a la acción | 4, 6 |
| RNF-5.17 Topes de longitud | Enviar textos que superen las restricciones | 1 |
| RNF-5.19 Sin analítica de terceros | Revisar las peticiones de red en rutas con datos personales | 8 |

## Verificación

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

Con el servidor local:

- Activar el modo sin conexión del navegador y recorrer las superficies cacheadas y los formularios.
- Aplicar la tarea de conservación sobre datos controlados y revisar el resultado en PostgreSQL y Storage.
- Simular el perfil 4G lento del TRD y registrar LCP e INP de cada ruta desde las herramientas del navegador.
- Recorrer toda la interfaz solo con teclado, luego con lector de pantalla y zoom al 200 %.
- Revisar la lista de mitigaciones anterior y registrar fecha, entorno y resultado.

## Definición de terminado

- [ ] Pantalla principal, directorio y primera página del tablero se consultan sin conexión.
- [ ] Todo dato servido sin conexión muestra su antigüedad.
- [ ] Sin conexión, un envío falla de forma visible y no queda en cola.
- [ ] Los datos de más de 12 meses se anonimizan y pierden su foto; los recientes quedan intactos.
- [ ] LCP, INP y presupuestos de peso cumplen el TRD en las cinco rutas.
- [ ] Las rutas y formularios se operan con teclado, lector de pantalla y zoom al 200 %.
- [ ] Las mitigaciones de seguridad se comprobaron en su frontera real.
- [ ] No hay peticiones de terceros en rutas que muestran o capturan datos personales.

## Antes del primer despliegue público

- [ ] **D-1:** responsable del tratamiento identificado en el aviso de privacidad.
- [ ] **D-2:** personas asignadas a moderar, con frecuencia y tiempo de respuesta acordados.
- [ ] **Datos:** comunas, barrios, líneas de emergencia y directorio inicial cargados con fuente y fecha reales.
- [ ] Revisión de seguridad completa.
- [ ] Recorrido en un dispositivo real de gama baja y con red móvil real.

## Volver

[Índice de implementación](./README.md) · [TRD](../TRD.md)

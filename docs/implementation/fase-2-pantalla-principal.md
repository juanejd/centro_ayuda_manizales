[← Fase 1](./fase-1-datos.md) · [Índice](./README.md) · Siguiente: [Fase 3 — Centro de información](./fase-3-centro-de-informacion.md)

# Fase 2 — Pantalla principal

Una pantalla de entrada simple para una persona con prisa, mala señal o un teléfono antiguo. Prioriza acciones claras, enlaces HTML ordinarios y acceso directo a las líneas de emergencia.

| Tema | Decisión |
| --- | --- |
| Entrega | Tres acciones principales, líneas de emergencia, aviso y enlaces secundarios |
| Depende de | Fase 0; la consulta de líneas usa el esquema de la fase 1 |
| Requisitos del TRD | RF-0.1 a RF-0.7, RNF-1.1, RNF-1.4, RNF-4.1 a RNF-4.5, §7.2 |

## Ruta rápida

1. Renderizar la página como Server Component, sin estado de cliente.
2. Mostrar tres enlaces táctiles de al menos 96 px de alto.
3. Leer las líneas publicadas del directorio y degradar a la línea 123 si la consulta falla o no devuelve datos.
4. Revisar la pantalla en un viewport móvil, con teclado, zoom y JavaScript deshabilitado.

## Entrega

| ID | Comportamiento | Comprobación |
| --- | --- | --- |
| 2.1 | **NECESITO AYUDA**, **QUIERO AYUDAR** y **BUSCO INFORMACIÓN** como enlaces HTML | Los tres enlaces son visibles, describen su destino y navegan sin JavaScript |
| 2.2 | Franja de emergencia consultada desde `info_resources` | Los recursos publicados de `lineas_atencion` aparecen como enlaces `tel:` |
| 2.3 | Degradación segura | Una consulta fallida no tumba la página y muestra el 123 como último recurso |
| 2.4 | Aviso y accesos secundarios | El aviso oficial y los enlaces al tablero y a la gestión son visibles y operables con teclado |

### Decisiones de la pantalla

Los números configurables no se duplican en el código: se leen del directorio para que una corrección de datos no requiera desplegar la aplicación. El 123 se conserva únicamente como último recurso cuando el directorio no está disponible.

La página usa HTML semántico y enlaces ordinarios. No necesita componentes de cliente, estado, animaciones ni dependencias adicionales. El color refuerza la jerarquía, pero el texto siempre comunica la acción.

## Verificación

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

Comprobación manual en 360 × 640 y en escritorio:

- Los tres bloques principales miden al menos 96 px de alto.
- Cada enlace y número telefónico tiene un objetivo táctil mínimo de 48 × 48 px.
- Tab, Shift+Tab y Enter recorren y activan todos los enlaces con foco visible.
- Con zoom al 200 %, el contenido no se solapa ni produce desplazamiento horizontal.
- Con JavaScript deshabilitado, los enlaces siguen funcionando.
- Al simular una consulta fallida, la pantalla permanece disponible y muestra el 123.

## Definición de terminado

- [ ] Hay tres bloques principales, sin carrusel, menú complejo ni introducción larga.
- [ ] Cada bloque incluye una frase breve de apoyo.
- [ ] Las líneas publicadas se leen del directorio y se presentan como enlaces `tel:`.
- [ ] La ausencia del directorio no deja la página en blanco.
- [ ] El aviso aclara que la plataforma no reemplaza las líneas oficiales.
- [ ] Existen enlaces a **Ver todas las necesidades** y **Gestionar mi publicación**.
- [ ] La página es un Server Component utilizable sin JavaScript.
- [ ] Los controles cumplen tamaños táctiles, contraste y foco visible.
- [ ] `lint`, `typecheck` y `build` terminan correctamente.

## Frontera de reversión

Se revierte restaurando `src/app/page.tsx`. La fase no crea rutas de destino ni componentes compartidos adicionales.

## Siguiente paso

[Fase 3 — Centro de información](./fase-3-centro-de-informacion.md)

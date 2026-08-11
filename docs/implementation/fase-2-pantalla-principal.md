[← Fase 1](./fase-1-datos.md) · [Índice](./README.md) · Siguiente: [Fase 3 — Directorio](./fase-3-directorio.md)

# Fase 2 — Pantalla principal

Tres bloques táctiles, un aviso y un acceso directo al 123. Es la pantalla más simple del proyecto y la que más tiene que resistir: la ve alguien alterado, en la calle, con mala señal y posiblemente en un teléfono viejo.

| | |
| --- | --- |
| **Entrega** | Pantalla principal, primitivas de interfaz accesibles, franja de líneas de emergencia |
| **Depende de** | Fase 0. La franja de emergencia necesita la fase 1 para leer el directorio |
| **Requisitos del TRD** | RF-0.1 a RF-0.7, RNF-1.1, RNF-1.4, RNF-4.1 a RNF-4.5, §7.2 |
| **Tamaño estimado** | ~280 líneas · un solo PR |

## Ruta rápida

1. Primitivas de interfaz con objetivos táctiles de 48 px y contraste verificado.
2. La página con los tres bloques, renderizada en servidor y **usable sin JavaScript**.
3. La franja de emergencia leída del directorio, no escrita en el código.

---

## Unidades de trabajo

| ID | Commit | Entrega | Prueba primero |
| --- | --- | --- | --- |
| 2.1 | `feat(ui): add accessible base primitives with design tokens` | Tokens de color y espaciado, `Button`, `Card`, `Badge` | Test: cada primitiva interactiva mide 48 × 48 px como mínimo. Test de contraste: cada par texto/fondo de los tokens supera 4.5:1 |
| 2.2 | `feat(home): add the three entry points` | `app/page.tsx` con los tres bloques y las frases de apoyo | E2E: los tres enlaces existen, tienen texto accesible y navegan. **Con JavaScript deshabilitado, los tres siguen navegando** |
| 2.3 | `feat(home): surface official emergency lines from the directory` | Franja con enlaces `tel:` leídos de `info_resources`, categoría líneas de atención | Test de integración: la franja renderiza los números de la semilla. Test: si el directorio no responde, la franja degrada sin tumbar la página |
| 2.4 | `feat(home): add the disclaimer and secondary links` | Aviso de que no reemplaza la línea oficial; enlaces a tablero y a gestión de publicación | E2E: el aviso es visible sin desplazarse en un viewport de 360 × 640 |
| 2.5 | `test(home): verify performance and accessibility budgets` | Auditoría automatizada en CI | Lighthouse en 4G lento: LCP ≤ 2,0 s. Axe: cero incidencias graves |

### 2.1 — El contraste se mide, no se estima

Los tokens de color se definen una vez y se prueban una vez. La prueba calcula la relación de contraste real de cada par declarado y falla si alguno baja de 4.5:1. Es diez líneas de test que evitan una auditoría de accesibilidad fallida en la fase 8, cuando ya haya cincuenta componentes usando esos tokens.

Ningún estado se comunica solo por color (RNF-4.5). Los distintivos de las fases 3 y 4 dependen de esta decisión, así que `Badge` nace con texto obligatorio y color opcional, no al revés.

### 2.3 — Por qué los números no van en el código

RF-0.4 exige que las líneas de emergencia salgan del directorio. Un número escrito en el código exige un despliegue para corregirse; durante una emergencia eso puede significar horas. Leerlo del directorio permite que un Moderador lo arregle en un minuto.

La contrapartida es que la pantalla principal pasa a depender de la base de datos. Se resuelve con la caché de §4.7 y con una degradación explícita: si la consulta falla, la franja muestra el 123 como valor de último recurso y registra el fallo. **Nunca una pantalla principal en blanco por una consulta caída.**

### 2.2 — Sin JavaScript no es un extra

RNF-1.4 obliga a que esta pantalla funcione sin JavaScript. Con tres enlaces y ningún estado, eso sale gratis **si nadie introduce un componente de cliente**. La prueba con JavaScript deshabilitado existe para que ese «si» quede vigilado por CI y no por la disciplina de quien edite la página en el futuro.

---

## Verificación

```bash
pnpm test:unit -- ui
pnpm test:e2e -- home
pnpm build            # el presupuesto de la ruta: ≤ 30 KB de JS, ≤ 120 KB total
pnpm exec playwright test home --project=no-js
```

Comprobación manual en dispositivo real o emulado a 360 × 640, red 4G lenta:

- Los tres bloques se ven sin desplazarse.
- El acceso a la línea de emergencia abre el marcador del teléfono con un toque.
- Con el zoom del navegador al 200 %, nada se solapa ni se recorta.

---

## Definición de terminado

- [ ] Tres bloques táctiles de altura mínima 96 px, cada uno con una frase de apoyo de una línea.
- [ ] Sin carrusel, sin texto introductorio largo, sin menú de navegación.
- [ ] Líneas de emergencia como enlaces `tel:` accionables con un toque, leídas del directorio.
- [ ] Si el directorio falla, la franja degrada y la página sigue en pie. Demostrado con una prueba.
- [ ] Aviso visible de que la plataforma no reemplaza a la línea de emergencia oficial.
- [ ] Enlaces secundarios a **Ver todas las necesidades** y **Gestionar mi publicación**.
- [ ] La página es utilizable con JavaScript deshabilitado. Verificado en CI.
- [ ] LCP ≤ 2,0 s en 4G lento (400 kbps, 400 ms RTT).
- [ ] Auditoría Axe sin incidencias graves.
- [ ] Objetivos táctiles de 48 × 48 px o más, verificado por prueba.
- [ ] Contraste mínimo de 4.5:1 en todos los pares de tokens, verificado por prueba.
- [ ] Presupuesto de peso de la ruta respetado.

## Frontera de reversión

Se retira eliminando `app/page.tsx` y `shared/ui/`. La fase 1 no depende de esta; las fases 3 y siguientes sí reutilizan las primitivas, así que revertir después de la fase 3 arrastraría trabajo ajeno.

## Siguiente paso

[Fase 3 — Directorio](./fase-3-directorio.md)

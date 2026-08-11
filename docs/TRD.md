# TRD — Centro de Ayuda Manizales

**Documento de Requisitos Técnicos**


| Campo             | Valor                                                                              |
| ----------------- | ---------------------------------------------------------------------------------- |
| Documento fuente  | `MVP — Plataforma Inteligente de Respuesta y Coordinación ante Emergencias (1).md` |
| Datos de origen   | `base_verificada_emergencia_sismo_manizales_2026-08-10.md`                         |
| Cobertura         | **Municipio de Manizales**, urbano y rural                                         |
| Modelo de datos   | [docs/data-model.sql](./data-model.sql)                                            |
| Plan de ejecución | [docs/implementation/](./implementation/README.md)                                 |


Fuente de verdad técnica de la plataforma.

---



## Contenido

1. [Qué es la plataforma](#1-qué-es-la-plataforma)
2. [El problema](#2-el-problema)
3. [Contexto de uso y restricciones](#3-contexto-de-uso-y-restricciones)
4. [Actores](#4-actores)
5. [Arquitectura técnica](#5-arquitectura-técnica)
6. [Procedencia de la información](#6-procedencia-de-la-información)
7. [Sistema de interfaz](#7-sistema-de-interfaz)
8. [Requisitos funcionales](#8-requisitos-funcionales)
9. [Traducción de aporte a categoría](#9-traducción-de-aporte-a-categoría)
10. [Requisitos no funcionales](#10-requisitos-no-funcionales)
11. [Seguridad y privacidad](#11-seguridad-y-privacidad)
12. [Modelo de datos](#12-modelo-de-datos)
13. [Decisiones de la organización](#13-decisiones-de-la-organización)
14. [Criterios de aceptación](#14-criterios-de-aceptación)
15. [Plan de implementación](#15-plan-de-implementación)

---



## 1. Qué es la plataforma

**Un tablero de publicaciones con dos ámbitos que actúan sobre él, más una sección informativa.**


| Ámbito                    | Qué hace                                                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Necesito ayuda**        | Escribe una publicación en el tablero y muestra la información relevante para quien la escribe                              |
| **Quiero ayudar**         | Filtra ese mismo tablero: la persona completa unos campos y la plataforma le muestra las publicaciones que le corresponden  |
| **Centro de información** | No es tablero. Es información institucional verificada: líneas, albergues, hospitales, alertas vigentes y guía de actuación |


Las dos consecuencias que se derivan de esa forma, y que definen todo lo demás:

**Quiero ayudar no registra nada. Filtra.** No hay cuenta, ni código de radicado, ni bandeja de aportantes, ni emparejamiento diferido. La persona dice qué puede aportar y ve, en esa misma pantalla, quién lo necesita. La conexión la hace ella llamando.

**El tablero es la única entidad viva.** Una publicación se crea, se lee, se cierra y se retira. Todo lo demás es catálogo o contenido verificado.

### 1.1 Fuera del alcance


| Componente                      | Motivo                                                                    |
| ------------------------------- | ------------------------------------------------------------------------- |
| Manos Amigas (voluntariado)     | Requiere actividades, cupos e inscripciones. Módulo completo por sí solo. |
| Asistente IA                    | Requiere el resto poblado para tener valor.                               |
| Centro de Comando               | Requiere agregaciones y mapas de calor. La moderación no lo sustituye.    |
| Clasificación automática por IA | Depende del Asistente IA. La prioridad es manual.                         |
| Registro de aportantes          | «Quiero ayudar» es un filtro. No se almacena quién ofreció.               |
| Aplicación móvil nativa         | Web responsive.                                                           |
| Recepción o custodia de dinero  | El documento fuente lo prohíbe.                                           |


Nada de esto queda descartado; queda fuera de esta entrega.

---



## 2. El problema

Del documento de datos verificados, §16: la Alcaldía publica un balance agregado y declara explícitamente **doce vacíos que no tiene confirmados**.


| La autoridad tiene                  | La autoridad no tiene                        |
| ----------------------------------- | -------------------------------------------- |
| 4.000+ damnificados                 | Qué barrios, comunas y veredas (§16.6)       |
| 160+ estructuras afectadas          | Cuáles y dónde (§16.5)                       |
| 3 albergues habilitados             | Capacidad disponible ahora (§16.10)          |
| Afectación eléctrica en Cerro Bravo | Balance de cortes de agua, luz y gas (§16.8) |
| Cable Aéreo fuera de servicio       | Listado consolidado de vías cerradas (§16.7) |


**La autoridad tiene el agregado; la ciudadanía tiene el detalle; no hay canal entre ambos.** Esa es la razón de existir del tablero.

La plataforma **no es un despachador de emergencias**. La línea 123 —con sus cinco opciones— y la 119 ya cubren eso y funcionan. La plataforma enruta hacia ellas y nunca las reemplaza.

---



## 3. Contexto de uso y restricciones

Requisitos, no aspiraciones.


| ID   | Restricción                                                     | Implicación                                                                     |
| ---- | --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| RP-1 | Persona en emergencia, en la calle, alterada y con prisa        | Un formulario se completa en menos de 90 segundos                               |
| RP-2 | Celular con red móvil degradada                                 | Renderizado en servidor, peso contenido                                         |
| RP-3 | Perfil heterogéneo, baja alfabetización digital                 | Lenguaje llano, botones grandes, un concepto por pantalla                       |
| RP-4 | Sin registro ni inicio de sesión para el ciudadano              | Aplica a publicar y a leer. La autenticación existe solo para el Moderador      |
| RP-5 | Dispositivos antiguos                                           | Degradación elegante. Todo funciona sin JavaScript                              |
| RP-6 | La información desactualizada es peligrosa                      | La fecha de verificación es un elemento visual de primer nivel                  |
| RP-7 | Una necesidad ya atendida que sigue publicada desperdicia ayuda | Cierre y retiro autónomos, más caducidad automática                             |
| RP-8 | La información cambia durante la emergencia                     | Toda información institucional lleva hora de corte visible; las alertas caducan |


---



## 4. Actores


| Actor                       | Autenticación | Capacidades                                                                                |
| --------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| **Quien necesita ayuda**    | Anónimo       | Publicar. Gestionar su publicación con su enlace: corregir, cerrar o retirar               |
| **Quien quiere ayudar**     | Anónimo       | Filtrar el tablero indicando qué puede aportar. Llamar directamente                        |
| **Quien busca información** | Anónimo       | Consultar líneas, recursos, alertas y guía de actuación                                    |
| **Moderador**               | Autenticado   | Verificar, ocultar, retirar, asignar prioridad y zona. Mantener el contenido institucional |


Un único rol autenticado.

---



## 5. Arquitectura técnica



### 5.1 Stack


| Capa          | Tecnología                        |
| ------------- | --------------------------------- |
| Framework     | Next.js (App Router) + TypeScript |
| Estilos       | Tailwind CSS + shadcn/ui          |
| Base de datos | Supabase (PostgreSQL) con RLS     |
| Archivos      | Supabase Storage                  |
| Autenticación | Supabase Auth, solo Moderador     |
| Despliegue    | Vercel                            |




### 5.2 La clave anónima no llega al navegador

Ninguna variable de Supabase se publica con prefijo `NEXT_PUBLIC_`. Todas las lecturas y escrituras ocurren en servidor.

Consecuencia: no existe endpoint REST público de Supabase. Extraer los datos exige raspar HTML paginado con tope de filas, en vez de una llamada que devuelva miles. No oculta los teléfonos —son públicos por diseño— pero cambia el coste de la extracción masiva en órdenes de magnitud. Es la mitigación estructural más importante.

### 5.3 Qué clave hace qué


| Clave              | Se usa para                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `anon`             | Lecturas públicas y los `INSERT` del formulario. Se usa aun en servidor, para que RLS siga siendo una capa real |
| `service_role`     | Solo dos cosas: gestión de la propia publicación por código más token, y las barridas de caducidad              |
| Sesión autenticada | Moderación, para que la auditoría atribuya la acción a alguien                                                  |




### 5.4 Estructura

```
src/
  app/
    page.tsx                  Pantalla principal
    necesito-ayuda/           Formulario + confirmación
    necesidades/              Tablero + detalle por código
    quiero-ayudar/            Filtro guiado sobre el tablero
    mi-publicacion/           Gestión con código y token
    informacion/              Directorio + detalle
    lineas-atencion/          Líneas consolidadas
    que-hacer/                Guía de actuación
    moderacion/               Protegido
  modules/
    help-requests/            Publicar, listar y gestionar
    info-resources/           Contenido institucional
    moderation/
  shared/
    supabase/ ui/ validation/ images/
```

`app/` importa de `modules/` y `shared/`. `modules/` importa de `shared/`. `shared/` no importa de ninguno.

### 5.5 Caché


| Vista                     | Estrategia                                     |
| ------------------------- | ---------------------------------------------- |
| Centro de información     | `revalidate = 300` más revalidación al editar  |
| Tablero                   | `revalidate = 60`                              |
| Detalle de publicación    | Dinámico. Debe reflejar de inmediato un retiro |
| Filtro de «Quiero ayudar» | Sin caché                                      |


---



## 6. Procedencia de la información

**La plataforma hace circular dos clases de información con criterios opuestos, y la interfaz debe distinguirlas siempre.**


|             | Institucional                 | Ciudadana                     |
| ----------- | ----------------------------- | ----------------------------- |
| Origen      | Fuente oficial obligatoria    | Cualquiera, sin cuenta        |
| Publicación | Solo si hay confirmación      | Inmediata                     |
| Criterio    | **Precisión sobre velocidad** | **Velocidad sobre precisión** |
| Aparece en  | Centro de información         | Tablero                       |


Confundir un albergue confirmado por la Alcaldía con uno que alguien escribió en un formulario es el fallo más grave que puede cometer esta plataforma. La separación no es estética.

### 6.1 Reglas de publicación institucional

Derivadas del documento de datos verificados. Son requisitos.


| ID   | Regla                                                                                                                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| RI-1 | No se publica una ubicación como albergue sin confirmación oficial concreta. Hay tres albergues habilitados y solo uno identificado por nombre |
| RI-2 | «Presenta afectaciones» nunca se traduce como «cerrado» sin confirmación de una autoridad                                                      |
| RI-3 | No se publican nombres de personas fallecidas                                                                                                  |
| RI-4 | No se publica una vía como cerrada a partir de videos, fotos o cadenas de mensajería                                                           |
| RI-5 | Un vacío no se rellena con suposiciones. Se muestra el texto **«No se encontró información oficial confirmada hasta la última verificación»**  |
| RI-6 | Todo recurso institucional guarda su fuente y su fecha de verificación, y ambas son visibles                                                   |




### 6.2 Estado de un recurso institucional

Tres niveles, tomados de la clasificación del documento de origen:


| Estado              | Significado                                           |
| ------------------- | ----------------------------------------------------- |
| **Confirmado**      | Fuente oficial verificada                             |
| **En verificación** | Anunciado pero sin detalle oficial suficiente         |
| **Cerrado**         | Ya no presta el servicio. Permanece visible y marcado |


Un recurso confirmado hace más de 72 horas se marca como potencialmente desactualizado. El umbral se calcula en servidor.

---



## 7. Sistema de interfaz



### 7.1 Una anatomía de tarjeta

Tablero y centro de información comparten la misma tarjeta. Lo único que cambia es qué codifica la franja.

```
┌────────────────────────────────────┐
│▌ ETIQUETA · TIPO · ZONA            │  franja + fila de etiquetas
│  [img]  Título                     │  miniatura opcional
│         Dirección o barrio         │
│         Descripción, dos líneas    │
│         hace 4 horas               │  tiempo o fecha de verificación
└────────────────────────────────────┘
```


| Superficie            | Qué codifica la franja                                         |
| --------------------- | -------------------------------------------------------------- |
| Tablero               | Estado de la publicación: sin verificar, verificada, atendida  |
| Centro de información | Frescura: confirmado, en verificación, desactualizado, cerrado |


Ningún estado se comunica solo con color. La etiqueta siempre lleva texto.

### 7.2 Inventario de pantallas


| Ruta                  | Contenido                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `/`                   | Estado de la ciudad, alertas vigentes, tres acciones, líneas de emergencia, publicaciones recientes |
| `/necesito-ayuda`     | Formulario de una pantalla                                                                          |
| `/necesidades`        | Tablero con filtros y búsqueda                                                                      |
| `/necesidades/[code]` | Detalle de una publicación                                                                          |
| `/quiero-ayudar`      | Filtro guiado sobre el tablero                                                                      |
| `/mi-publicacion`     | Gestión con código y token                                                                          |
| `/informacion`        | Directorio filtrable                                                                                |
| `/informacion/[slug]` | Detalle de un recurso                                                                               |
| `/lineas-atencion`    | Líneas consolidadas                                                                                 |
| `/que-hacer`          | Guía de actuación                                                                                   |
| `/moderacion`         | Protegido                                                                                           |




### 7.3 Paleta

Cada tono está hablado por algo. El rojo marca la vía urgente y **nunca se usa como decoración**: si aparece en un borde o en un fondo por estética, deja de significar urgencia.


| Rol     | Uso                                                                 |
| ------- | ------------------------------------------------------------------- |
| Navy    | Voz institucional, cabeceras, superficies de marca                  |
| Rojo    | La vía urgente: líneas de emergencia y la acción **NECESITO AYUDA** |
| Verde   | Información confirmada recientemente                                |
| Ámbar   | Información que envejeció más allá de lo confiable                  |
| Pizarra | Recurso cerrado: presente, legible, claramente no disponible        |


---



## 8. Requisitos funcionales



### 8.1 RF-0 — Pantalla principal


| ID     | Requisito                                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| RF-0.1 | Tres acciones: **NECESITO AYUDA**, **QUIERO AYUDAR**, **BUSCO INFORMACIÓN**, cada una en un bloque táctil de 96 px de alto mínimo           |
| RF-0.2 | Sin carrusel ni texto introductorio largo                                                                                                   |
| RF-0.3 | Líneas de emergencia como enlaces `tel:` directos, sin pasar por un formulario. Los números vienen del centro de información, no del código |
| RF-0.4 | Aviso permanente: esta plataforma no reemplaza a la línea de emergencia oficial                                                             |
| RF-0.5 | **Alertas vigentes** en primer lugar cuando existan, con su fuente y su vencimiento                                                         |
| RF-0.6 | **Estado de la ciudad**: balance oficial con fuente y hora de corte visibles. Nunca se cuentan publicaciones de la propia plataforma        |
| RF-0.7 | Publicaciones recientes del tablero                                                                                                         |
| RF-0.8 | Enlaces secundarios a **Ver todas las necesidades** y **Gestionar mi publicación**                                                          |




### 8.2 RF-1 — Necesito ayuda


| ID      | Requisito                                                                                                                                                                                                                                 |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF-1.1  | Formulario de una sola pantalla, sin asistente por pasos                                                                                                                                                                                  |
| RF-1.2  | Obligatorios: categoría, descripción, barrio o sector, nombre, teléfono y los dos consentimientos. No se pide municipio                                                                                                                   |
| RF-1.3  | Opcionales: dirección, número de afectados, ubicación en mapa, foto                                                                                                                                                                       |
| RF-1.4  | Categorías: Salud · Vivienda y daños estructurales · Albergue · Alimentos · Agua · Sangre · Mascotas · Movilidad y vías · Servicios públicos · Personas desaparecidas · Atención psicológica · Transporte · Remoción de escombros · Otros |
| RF-1.5  | Advertencia destacada, antes del campo de teléfono, de que el nombre, el teléfono y la foto serán públicos en internet. No es letra pequeña                                                                                               |
| RF-1.6  | Dos casillas de consentimiento separadas y sin marcar: tratamiento de datos, y publicación pública. Sin ambas no se envía                                                                                                                 |
| RF-1.7  | La geolocalización solo se activa por acción explícita. Si se deniega, el barrio en texto basta                                                                                                                                           |
| RF-1.8  | El barrio es texto con autocompletado contra el catálogo. Si coincide, se registra la comuna. **Si no coincide, se guarda el texto y la zona queda sin asignar.** Nunca se rechaza por un barrio ausente                                  |
| RF-1.9  | Foto opcional, un archivo, comprimida en cliente con objetivo de 500 KB. Es pública                                                                                                                                                       |
| RF-1.10 | Advertencia junto al campo de foto: no incluir personas identificables ni documentos                                                                                                                                                      |
| RF-1.11 | Todos los metadatos de la imagen se eliminan en servidor antes de almacenarla                                                                                                                                                             |
| RF-1.12 | Se publica de inmediato con estado «Sin verificar». Sin cola de aprobación                                                                                                                                                                |
| RF-1.13 | La prioridad no se calcula. Nace sin prioridad y solo un Moderador la asigna                                                                                                                                                              |
| RF-1.14 | Confirmación con código de radicado, enlace de gestión e instrucción explícita de guardarlo                                                                                                                                               |
| RF-1.15 | La plataforma no emite juicios sobre daños estructurales, condiciones médicas ni seguridad de un lugar                                                                                                                                    |




### 8.3 RF-2 — Tablero


| ID      | Requisito                                                                                                                                                                     |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF-2.1  | Sin autenticación. Publicaciones más recientes primero                                                                                                                        |
| RF-2.2  | Filtros por categoría y comuna desde su catálogo, más **«zona sin asignar»**. Búsqueda por texto sobre descripción y barrio                                                   |
| RF-2.3  | Tope duro de 20 elementos por página. No existe parámetro que devuelva el conjunto completo                                                                                   |
| RF-2.4  | Cada tarjeta: categoría, estado, antigüedad, barrio escrito y comuna cuando esté resuelta, descripción, afectados, nombre y teléfono como `tel:`                              |
| RF-2.5  | Una publicación con zona sin asignar **aparece igual que las demás**. Quien vive en un asentamiento informal o una vereda sin registrar es de quien menos se puede prescindir |
| RF-2.6  | Estado con color y texto: **Sin verificar · Verificada**, con su fuente **· Atendida · Duplicada**                                                                            |
| RF-2.7  | Las atendidas permanecen visibles 48 horas marcadas y luego se ocultan. Quien va en camino necesita saber que se resolvió, no que desapareció                                 |
| RF-2.8  | Detalle por código de radicado, con ubicación aproximada y foto cuando existan                                                                                                |
| RF-2.9  | Aviso antifraude permanente: nadie legítimo pedirá dinero, datos bancarios ni códigos a cambio de ayudar                                                                      |
| RF-2.10 | Las ocultas y retiradas no aparecen en ninguna vista pública                                                                                                                  |
| RF-2.11 | Tablero y detalle se sirven con `noindex, nofollow` y quedan excluidos en `robots.txt`                                                                                        |




### 8.4 RF-3 — Quiero ayudar

**Es un filtro sobre el tablero. No registra a nadie.**


| ID      | Requisito                                                                                                                                                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF-3.1  | Primera pregunta: **¿Cómo puedes ayudar?**                                                                                                                                                                                                  |
| RF-3.2  | Tipos: Dinero · Alimentos · Agua · Ropa y cobijas · Medicamentos o insumos permitidos · Transporte · Vehículos · Maquinaria · Herramientas · Alojamiento · Alimento para mascotas · Servicios profesionales · Tiempo como voluntario · Otro |
| RF-3.3  | Segundo campo, opcional: comuna, para acotar                                                                                                                                                                                                |
| RF-3.4  | Al seleccionar, la misma pantalla muestra el número de publicaciones que corresponden y una lista de hasta 20, con enlace al detalle y teléfono como `tel:`                                                                                 |
| RF-3.5  | Sin comuna seleccionada, el filtro abarca todo Manizales, **incluidas las de zona sin asignar**. Filtrar por comuna acota; nunca es requisito                                                                                               |
| RF-3.6  | La correspondencia entre tipo de aporte y categoría se resuelve con la tabla de la sección 9. No es coincidencia de cadenas                                                                                                                 |
| RF-3.7  | Sin coincidencias, se dice explícitamente y se ofrece el tablero completo. Nunca una lista vacía sin explicación                                                                                                                            |
| RF-3.8  | **Sin JavaScript el filtro funciona igual**: es un `<form method="get">` y los criterios viven en la URL. La página es compartible                                                                                                          |
| RF-3.9  | Si el tipo es Dinero, no se captura ningún dato financiero, no se filtra y se remite a las entidades del centro de información. La plataforma no recibe ni custodia dinero                                                                  |
| RF-3.10 | Si el tipo es Tiempo como voluntario, se muestran las coincidencias y se informa que el módulo de voluntariado no está disponible. Sin prometer una asignación que el sistema no puede hacer                                                |
| RF-3.11 | **No se almacenan datos de quien ayuda.** No hay registro, código ni bandeja. La conexión la hace la persona llamando                                                                                                                       |




### 8.5 RF-4 — Gestión de la propia publicación


| ID     | Requisito                                                                                                 |
| ------ | --------------------------------------------------------------------------------------------------------- |
| RF-4.1 | Cada publicación genera un `manage_token` opaco. El enlace es `/mi-publicacion?code=<code>&token=<token>` |
| RF-4.2 | Con ese enlace, sin cuenta, la persona la cierra, la retira, o corrige descripción y teléfono             |
| RF-4.3 | Retirarla la excluye de inmediato de toda vista pública                                                   |
| RF-4.4 | Exige código y token. El token es UUID v4 y nunca aparece en ninguna vista pública                        |
| RF-4.5 | Límite de tasa por IP para impedir el sondeo de tokens                                                    |
| RF-4.6 | Un Moderador puede retirar u ocultar sin el token                                                         |
| RF-4.7 | Como perder el enlace es previsible, existe retiro manual por el canal del aviso de privacidad            |


Sin este módulo una persona no puede retirar sus datos de internet.

### 8.6 RF-5 — Centro de información

Solo lectura. El ciudadano no escribe aquí.


| ID      | Requisito                                                                                                                                                                                                                                                                                                                        |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF-5.1  | Listado filtrable por categoría y comuna, con búsqueda sobre nombre y descripción. «hospi» encuentra «Hospital»                                                                                                                                                                                                                  |
| RF-5.2  | Categorías: Albergues · Hospitales · Centros médicos · Donación de sangre · Puntos de donación · Centros de acopio · Atención de mascotas · Personas desaparecidas · Evaluación de viviendas · Servicios públicos · Bomberos · Defensa Civil · Cruz Roja · Alcaldías · Gobernación · Líneas de atención · Cierres viales · Otros |
| RF-5.3  | Cada recurso: nombre, categoría, descripción, dirección, barrio y comuna, punto de encuentro, teléfonos, horario, **fuente** y **fecha de última verificación**                                                                                                                                                                  |
| RF-5.4  | Los teléfonos son enlaces `tel:`. La dirección abre la aplicación de mapas                                                                                                                                                                                                                                                       |
| RF-5.5  | Cuando un número atiende por menú, **el dígito de opción va en la descripción, nunca en el número marcado**. Marcar «123 opción 2» como 1232 llamaría a un número inexistente                                                                                                                                                    |
| RF-5.6  | Estado con color y texto según §6.2. La fecha de verificación es visible en la tarjeta, no solo en el detalle                                                                                                                                                                                                                    |
| RF-5.7  | De 0 a N fotos de referencia con texto alternativo obligatorio, para reconocer el lugar. Carga diferida con dimensiones reservadas                                                                                                                                                                                               |
| RF-5.8  | Los recursos cerrados permanecen visibles y marcados                                                                                                                                                                                                                                                                             |
| RF-5.9  | **Alertas vigentes**: aviso con fuente y vencimiento. Una alerta vencida deja de mostrarse como vigente                                                                                                                                                                                                                          |
| RF-5.10 | **Guía de actuación** en `/que-hacer`: qué hacer ante grieta, gas, cables caídos, fuga de agua, persona herida, persona atrapada, réplica, acompañamiento a niños y adultos mayores, y mascotas. Cada escenario termina en el número que corresponde. Contenido estático, sin base de datos                                      |
| RF-5.11 | Vista consolidada de líneas de atención, accesible en un toque desde la pantalla principal                                                                                                                                                                                                                                       |
| RF-5.12 | A diferencia del tablero, el centro de información **sí es indexable**. Es información institucional, no datos personales                                                                                                                                                                                                        |
| RF-5.13 | Cuando un dato no está confirmado se aplica RI-5, con su texto exacto                                                                                                                                                                                                                                                            |




### 8.7 RF-6 — Moderación


| ID     | Requisito                                                                                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RF-6.1 | Ruta protegida. Solo miembros del equipo. Sin registro público                                                                                                           |
| RF-6.2 | Lista con filtros por categoría, comuna, estado y prioridad, **incluido el filtro de zona sin asignar**, que es la cola de trabajo de RF-6.4                             |
| RF-6.3 | Verificar indicando fuente, marcar duplicada, ocultar, retirar y asignar prioridad                                                                                       |
| RF-6.4 | Asignar la comuna a una publicación cuyo barrio no coincidió, y añadir ese barrio al catálogo                                                                            |
| RF-6.5 | Retirar la foto sin ocultar la publicación. Una foto inapropiada no debe costar la visibilidad de una necesidad legítima                                                 |
| RF-6.6 | Mantener el centro de información: crear, editar, publicar y despublicar recursos, cargar fotos con texto alternativo, actualizar estado, fuente y fecha de verificación |
| RF-6.7 | Publicar y vencer alertas                                                                                                                                                |
| RF-6.8 | Toda modificación registra autor y fecha                                                                                                                                 |
| RF-6.9 | Fuera de alcance: mapas de calor, gráficas, métricas agregadas, exportación y asignación automática                                                                      |


---



## 9. Traducción de aporte a categoría

Los dos vocabularios del documento fuente no coinciden. El filtro de «Quiero ayudar» es imposible sin traducción explícita.


| Tipo de aporte                    | Categorías que atiende                                                  |
| --------------------------------- | ----------------------------------------------------------------------- |
| Alimentos                         | Alimentos                                                               |
| Agua                              | Agua                                                                    |
| Ropa y cobijas                    | Albergue · Vivienda                                                     |
| Medicamentos o insumos permitidos | Salud                                                                   |
| Alojamiento                       | Albergue · Vivienda                                                     |
| Alimento para mascotas            | Mascotas                                                                |
| Transporte                        | Transporte · Movilidad y vías · Salud                                   |
| Vehículos                         | Transporte · Movilidad y vías · Remoción de escombros                   |
| Maquinaria                        | Remoción de escombros · Movilidad y vías                                |
| Herramientas                      | Remoción de escombros · Vivienda                                        |
| Servicios profesionales           | Salud · Vivienda · Atención psicológica · Servicios públicos · Mascotas |
| Tiempo como voluntario            | Todas                                                                   |
| Otro                              | Todas                                                                   |
| Dinero                            | Ninguna — remite a entidades del centro de información                  |


- **Sangre** y **Personas desaparecidas** no tienen aporte que las atienda: se resuelven presentándose en un punto o reportando información. Aparecen en el tablero, nunca en el filtro.
- **Servicios profesionales** es deliberadamente amplio. Afinarlo exige un subcampo de profesión, que añade fricción contra RP-1.
- La tabla vive en código, no en base de datos. Es lógica revisable en un diff.

---



## 10. Requisitos no funcionales



### 10.1 Rendimiento


| ID      | Requisito                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------ |
| RNF-1.1 | Pantalla principal, tablero y centro de información se renderizan en servidor y son utilizables sin JavaScript     |
| RNF-1.2 | Objetivo de Largest Contentful Paint de 2,0 s en 4G lento. Se mide antes de publicar; no es una compuerta de build |
| RNF-1.3 | Sin librerías de estado ni de peticiones en cliente                                                                |




### 10.2 Resiliencia


| ID      | Requisito                                                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-2.1 | Si la base de datos no responde al enviar, el usuario recibe un mensaje claro más las líneas de emergencia. Nunca un error técnico crudo          |
| RNF-2.2 | Si el filtro falla, la pantalla sigue siendo utilizable                                                                                           |
| RNF-2.3 | Tablero y centro de información se sirven desde caché con revalidación. Una caída de base de datos no debe dejar inaccesibles los albergues       |
| RNF-2.4 | Las líneas de emergencia tienen un valor de último recurso en el código: si el directorio no responde, la pantalla principal sigue ofreciendo 123 |




### 10.3 Accesibilidad


| ID      | Requisito                                                               |
| ------- | ----------------------------------------------------------------------- |
| RNF-3.1 | WCAG 2.1 AA como mínimo                                                 |
| RNF-3.2 | Contraste 4,5:1 en texto normal. Objetivos táctiles de 48 × 48 px       |
| RNF-3.3 | Formularios navegables solo con teclado y con lector de pantalla        |
| RNF-3.4 | Errores de validación anunciados y asociados a su campo                 |
| RNF-3.5 | Ningún estado se comunica únicamente por color                          |
| RNF-3.6 | Toda foto lleva texto alternativo obligatorio en la interfaz de edición |
| RNF-3.7 | Con zoom al 200 % no hay desplazamiento horizontal                      |




### 10.4 Idioma

Español de Colombia en la interfaz, registro neutro y llano. Código, identificadores y comentarios en inglés.

---



## 11. Seguridad y privacidad



### 11.1 Qué publica la plataforma

La plataforma publica en internet abierto el nombre, el teléfono, la categoría, el barrio, la ubicación aproximada y la foto de personas que acaban de sufrir una emergencia. Sin autenticación y sin verificación previa.

Es el requisito central: reduce la fricción a cero y permite que un vecino con un carro llame en treinta segundos. La ingeniería lo implementa y lo endurece hasta donde es posible sin contradecirlo.

### 11.2 Mitigaciones


| ID       | Mitigación                                                                                                                                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-4.1  | La clave anónima nunca llega al navegador (§5.2)                                                                                                                                                                                                         |
| RNF-4.2  | El rol `anon` no accede a la tabla de publicaciones, solo a una vista con columnas explícitas filtrada por estado                                                                                                                                        |
| RNF-4.3  | Tope duro de 20 filas por consulta. Sin parámetro que lo eleve                                                                                                                                                                                           |
| RNF-4.4  | Límite de tasa por IP en escritura y en gestión de publicación                                                                                                                                                                                           |
| RNF-4.5  | `noindex, nofollow` y exclusión en `robots.txt` para tablero, detalle y gestión. Impide que los teléfonos queden indexados y encontrables años después                                                                                                   |
| RNF-4.6  | Coordenadas redondeadas a tres decimales, unos 110 metros, en la vista pública                                                                                                                                                                           |
| RNF-4.7  | **Eliminación de todos los metadatos de la imagen en servidor antes de almacenarla.** Una foto de celular lleva coordenadas GPS exactas en su EXIF; publicarla sin limpiar anularía el redondeo anterior y expondría la vivienda con precisión de metros |
| RNF-4.8  | Fotos en rutas basadas en UUID, en un bucket sin listado                                                                                                                                                                                                 |
| RNF-4.9  | Caducidad automática: se oculta a los 14 días sin actividad; las atendidas, a las 48 horas                                                                                                                                                               |
| RNF-4.10 | Retiro autónomo sin cuenta (RF-4). Sin esto la exposición sería irreversible                                                                                                                                                                             |
| RNF-4.11 | El Moderador puede retirar una foto sin ocultar la publicación                                                                                                                                                                                           |
| RNF-4.12 | Aviso antifraude permanente y advertencia destacada antes del campo de teléfono                                                                                                                                                                          |
| RNF-4.13 | **No se almacenan datos de quien ayuda**, porque «Quiero ayudar» no registra                                                                                                                                                                             |
| RNF-4.14 | RLS en todas las tablas. `service_role` nunca llega al cliente                                                                                                                                                                                           |
| RNF-4.15 | Privilegios por columna además de RLS en las escrituras anónimas. Un `WITH CHECK` rechaza una fila, pero solo un privilegio por columna impide que el rol anónimo suministre prioridad o estado                                                          |
| RNF-4.16 | Validación con Zod en servidor en toda escritura                                                                                                                                                                                                         |
| RNF-4.17 | Topes de longitud en todo campo de texto libre                                                                                                                                                                                                           |
| RNF-4.18 | Sin CAPTCHA. Es fricción directa contra RP-1 y RP-3. Riesgo aceptado, mitigado con RNF-4.4 y moderación reactiva                                                                                                                                         |
| RNF-4.19 | Sin analítica de terceros ni píxeles de seguimiento                                                                                                                                                                                                      |




### 11.3 Lo que no queda mitigado

Enunciado para que la aceptación sea informada.

1. **Cualquiera puede leer los teléfonos y ver las fotos.** Es el requisito, no un defecto.
2. **La extracción masiva sigue siendo posible**, solo más costosa.
3. **La exposición no es reversible en la práctica.** El retiro la quita de la plataforma, no de las copias que un tercero ya hizo.
4. **No hay verificación de identidad al publicar.** Cualquiera puede publicar el teléfono de otra persona. La moderación es reactiva, así que el daño precede a la corrección. Es el riesgo más grave y no tiene solución dentro de las restricciones elegidas.
5. **Una foto puede revelar más de lo que su autor pretendía.** La limpieza de metadatos elimina la geolocalización; el contenido visible solo se corrige de forma reactiva.
6. **Las estafas dirigidas son previsibles.** Un listado público de personas vulnerables con teléfono es un objetivo de valor. El aviso advierte; no protege.



### 11.4 Tratamiento de datos personales


| ID      | Requisito                                                                                                                                                                                          |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-5.1 | Dos consentimientos separados y sin marcar. La Ley 1581 de 2012 exige autorización informada por finalidad determinada, y la divulgación pública es una finalidad distinta del tratamiento interno |
| RNF-5.2 | Se almacena el momento de cada consentimiento, no un booleano. Un booleano no prueba cuándo se autorizó                                                                                            |
| RNF-5.3 | Aviso de privacidad con finalidad, responsable, carácter público de los datos, conservación, canal de derechos y canal alternativo de retiro                                                       |
| RNF-5.4 | El responsable debe ser una entidad jurídica identificada                                                                                                                                          |
| RNF-5.5 | Conservación de 12 meses. Después, anonimización y eliminación de la foto, conservando categoría, comuna y fecha                                                                                   |
| RNF-5.6 | Derecho de supresión atendible sin cuenta                                                                                                                                                          |




### 11.5 Matriz de acceso


| Objeto                         | `anon`                                                  | Equipo autenticado                           |
| ------------------------------ | ------------------------------------------------------- | -------------------------------------------- |
| `comunas`, `neighborhoods`     | `SELECT` de los activos                                 | Todo                                         |
| `help_requests` (tabla)        | Sin lectura. `INSERT` restringido a columnas explícitas | `SELECT`, `UPDATE`                           |
| `public_help_requests` (vista) | `SELECT`. Columnas acotadas, coordenadas redondeadas    | `SELECT`                                     |
| `info_resources`               | `SELECT` donde esté publicado                           | Todo                                         |
| `info_resource_photos`         | `SELECT` de recursos publicados                         | Todo                                         |
| `staff_members`                | Sin acceso                                              | `SELECT`                                     |
| `moderation_log`               | Sin acceso                                              | `SELECT`, `INSERT`. Sin `UPDATE` ni `DELETE` |


La gestión de la propia publicación no se resuelve con RLS: una Server Action valida código y token y luego escribe con `service_role`. El token nunca se convierte en credencial de base de datos.

Las políticas del equipo verifican pertenencia a `staff_members`. Estar autenticado no basta.

---



## 12. Modelo de datos

PostgreSQL, nombres en inglés, `snake_case`. El DDL es `[docs/data-model.sql](./data-model.sql)`.

### 12.1 Entidades


| Tabla                          | Propósito                                         | Lectura anónima              |
| ------------------------------ | ------------------------------------------------- | ---------------------------- |
| `comunas`                      | Comunas y corregimientos. Eje de filtrado         | Sí, los activos              |
| `neighborhoods`                | Barrios con su comuna. Alimenta el autocompletado | Sí, los activos              |
| `help_requests`                | Publicaciones del tablero                         | No. Solo por la vista        |
| `public_help_requests` (vista) | Proyección pública acotada                        | Sí. Única superficie pública |
| `info_resources`               | Contenido institucional                           | Sí, donde esté publicado     |
| `info_resource_photos`         | Fotos de referencia                               | Sí, de recursos publicados   |
| `staff_members`                | Pertenencia al rol Moderador                      | No                           |
| `moderation_log`               | Auditoría                                         | No                           |


`help_offers` **queda sin uso en el MVP.** «Quiero ayudar» filtra y no registra a nadie (RF-3.11). La tabla permanece en el esquema porque ya está migrada y eliminarla no aporta nada; ninguna ruta escribe en ella. Si más adelante se decide registrar aportantes, está disponible.

### 12.2 Claves

Clave primaria `BIGINT GENERATED ALWAYS AS IDENTITY`, salvo `staff_members`, cuyo `uuid` viene de `auth.users`.

La opacidad que el sistema necesita está en dos columnas propias:


| Columna          | Naturaleza                                                 | Para qué                                                                     |
| ---------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `reference_code` | `text`, 8 caracteres, base32 de Crockford sin I, L, O ni U | Legible y dictable por teléfono. Identificador de la URL pública             |
| `manage_token`   | `uuid` v4                                                  | Inadivinable. Autoriza la gestión sin cuenta. Nunca aparece en vista pública |


Las claves primarias no se exponen, así que una clave secuencial no filtra nada y da mejor localidad de índice que un UUID aleatorio. El alfabeto excluye I, L y O por ambigüedad al dictarlas, y U para evitar palabras ofensivas accidentales.

### 12.3 Estados

`help_requests` tiene dos columnas de estado, no una:


| Columna              | Valores                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `moderation_status`  | `sin_verificar` · `verificado` · `duplicado` · `oculta` · `retirada` |
| `fulfillment_status` | `abierta` · `atendida`                                               |


Colapsarlas produce estados imposibles de representar: una publicación puede estar verificada y atendida a la vez.

Los conjuntos se modelan como `text` con `CHECK`, no como `ENUM`. Las categorías de una emergencia cambian entre eventos: un `CHECK` se reemplaza en una migración, mientras que de un `ENUM` nunca se puede eliminar un valor.

**La geografía es la excepción:** son tablas de catálogo con clave foránea. La interfaz alimenta su autocompletado desde `neighborhoods` y un Moderador debe poder añadir un barrio sin una migración.

Con texto libre, «La Enea», «la enea» y «Enea» serían tres grupos distintos y el filtro devolvería cero coincidencias sin ningún error que lo explicara. La clave foránea convierte ese fallo silencioso en un rechazo inmediato.

### 12.4 Tres columnas para la geografía


| Columna             | Contenido                                                | Obligatoria |
| ------------------- | -------------------------------------------------------- | ----------- |
| `sector`            | El barrio tal como lo escribió la persona                | Sí          |
| `neighborhood_code` | Solo si el texto coincidió con el catálogo               | No          |
| `comuna_code`       | Derivada de la coincidencia, o asignada por un Moderador | No          |


Quien vive en un asentamiento informal, una vereda o una urbanización nueva escribirá un nombre que no está en ningún catálogo. Rechazarlo no es opción: **el texto se conserva y la zona queda sin asignar hasta que un humano la resuelva**.

De ahí una decisión que parece un detalle y no lo es: la vista pública une la geografía con `LEFT JOIN`. Con un `JOIN` interno, toda publicación sin zona resuelta desaparecería del tablero, ocultando precisamente a quien no figura en ningún mapa. Sería un fallo de equidad.

La coherencia se garantiza con una clave foránea compuesta, sin disparadores. `MATCH SIMPLE` no se comprueba cuando alguna columna es nula, que es exactamente el comportamiento buscado:


| Par                       | Resultado                                |
| ------------------------- | ---------------------------------------- |
| `('la-enea', 'tesorito')` | Aceptado                                 |
| `('la-enea', 'san-jose')` | Rechazado: barrio de otra comuna         |
| `(NULL, 'tesorito')`      | Aceptado: zona asignada por un Moderador |
| `(NULL, NULL)`            | Aceptado: pendiente de moderación        |
| `('la-enea', NULL)`       | Rechazado por un `CHECK`                 |




### 12.5 Búsqueda

Columna generada `search_vector` de tipo `tsvector`, `STORED`, con índice GIN.

Dos detalles determinantes:

1. **Siempre se pasa el idioma:** `to_tsvector('spanish', …)`. La forma de un argumento es `STABLE`, no `IMMUTABLE`, y PostgreSQL la rechaza en una columna generada.
2. `'spanish'`**, no** `'english'`**.** Con configuración inglesa, buscar «albergues» no encontraría «albergue».

En `info_resources` el vector está ponderado: una coincidencia en el nombre pesa más que una en la descripción. Se añade un índice trigrama sobre el nombre, porque la búsqueda de texto completo indexa palabras enteras y «hospi» no encontraría nada.

### 12.6 La vista pública

`public_help_requests` se declara con `security_invoker = false` y `security_barrier = true`, y ambas son explícitas.

`security_invoker = false` hace que la vista se ejecute con los privilegios de su propietario. Por eso `anon` puede leer a través de ella sin tener privilegios sobre la tabla. Ese salto de RLS es el diseño buscado. Ponerlo en `true` rompería el tablero entero: es un detalle de una línea con capacidad de tumbar el módulo.

`security_barrier = true` impide que el planificador empuje una función del usuario por debajo del `WHERE` de la vista.

La vista no expone clave primaria, token de gestión, prioridad, coordenadas exactas, quién verificó, de qué es duplicado, fecha de caducidad ni marcas de consentimiento.

### 12.7 Datos de origen

`base_verificada_emergencia_sismo_manizales_2026-08-10.md` es la fuente de la semilla del centro de información:


| Sección                 | Alimenta                                    |
| ----------------------- | ------------------------------------------- |
| §1 Estado general       | Estado de la ciudad (RF-0.6)                |
| §2 Alertas              | Alertas vigentes (RF-5.9)                   |
| §3 Líneas de emergencia | Categoría `lineas_atencion`                 |
| §4 Albergues            | Categoría `albergues`, respetando RI-1      |
| §5 Donación de sangre   | Categoría `donacion_sangre`                 |
| §6 Hospitales           | Categoría `hospitales`, respetando RI-2     |
| §9 Vías                 | Categoría `cierres_viales`, respetando RI-4 |
| §10 Servicios públicos  | Categoría `servicios_publicos`              |
| §11 Apoyo psicosocial   | Categoría `lineas_atencion`                 |
| §12 Guía ciudadana      | `/que-hacer` (RF-5.10)                      |


Cada fila sembrada conserva su fuente y su fecha de verificación. Ningún dato marcado como pendiente en §16 se siembra como confirmado.

---



## 13. Decisiones de la organización

No bloquean implementar. Bloquean publicar.


| #     | Decisión                                                                          | Por qué importa                                                                                                                 |
| ----- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| D-1   | **Responsable del tratamiento de datos.** Qué entidad jurídica figura en el aviso | Con publicación abierta de teléfonos y fotos, alguien asume la responsabilidad ante la Superintendencia de Industria y Comercio |
| D-2   | **Quién modera, con qué frecuencia y con qué compromiso**                         | La moderación es reactiva por diseño. Sin nadie revisando, un teléfono publicado por un tercero permanece indefinidamente       |
| D-3   | **Confirmación de la tabla de la sección 9**                                      | Es la lógica que decide qué ve quien quiere ayudar                                                                              |
| Datos | Comunas, corregimientos y catálogo de barrios de Manizales                        | No se pueden inventar                                                                                                           |


---



## 14. Criterios de aceptación

**Tablero**

- [ ] Una persona publica desde un celular, sin cuenta, en menos de 90 segundos, y recibe código y enlace de gestión
- [ ] Aparece en el tablero en menos de 60 segundos con estado «Sin verificar»
- [ ] El formulario advierte de forma destacada, antes del teléfono, que los datos serán públicos
- [ ] No se envía sin marcar ambas casillas
- [ ] Cualquiera filtra por categoría y comuna y llama con un toque
- [ ] Un barrio ausente del catálogo no impide publicar; la zona queda sin asignar y la publicación aparece igual
- [ ] Un barrio atribuido a otra comuna se rechaza en la base de datos
- [ ] El tablero responde `noindex` y `robots.txt` lo excluye

**Quiero ayudar**

- [ ] Al seleccionar tipo de aporte se muestran las publicaciones que corresponden, con su teléfono
- [ ] Sin comuna seleccionada se incluyen las de zona sin asignar
- [ ] La correspondencia respeta la tabla de la sección 9
- [ ] **Funciona con JavaScript deshabilitado y los criterios viven en la URL**
- [ ] Un aporte de tipo Dinero no solicita datos financieros y remite a entidades verificadas
- [ ] Sin coincidencias se explica y se ofrece el tablero completo
- [ ] **No se almacena ningún dato de quien ayuda**

**Gestión y ciclo de vida**

- [ ] Con su enlace y sin cuenta, una persona cierra y retira su publicación
- [ ] Una retirada desaparece de inmediato de toda vista pública
- [ ] Una atendida se ve marcada 48 horas y luego se oculta
- [ ] Una sin actividad se oculta a los 14 días

**Centro de información**

- [ ] Se consulta, filtra y busca, con fecha de verificación visible en cada tarjeta
- [ ] «hospi» encuentra «Hospital»
- [ ] Un recurso verificado hace más de 72 horas se marca como potencialmente desactualizado
- [ ] Un recurso cerrado sigue visible y marcado
- [ ] **Un número con menú marca el número base, nunca el número con el dígito de opción pegado**
- [ ] Las alertas vigentes se muestran con fuente y vencimiento; una vencida deja de mostrarse
- [ ] `/que-hacer` cubre los escenarios de RF-5.10 y cada uno termina en un número
- [ ] Un dato no confirmado muestra el texto de RI-5
- [ ] El centro de información es indexable y aparece en el sitemap

**Seguridad**

- [ ] Ninguna variable de Supabase se expone al navegador
- [ ] Un cliente anónimo no puede leer la tabla de publicaciones, solo la vista
- [ ] La vista no expone token, prioridad ni coordenadas exactas
- [ ] El rol anónimo no puede suministrar prioridad ni estado al insertar
- [ ] Ninguna consulta pública devuelve más de 20 filas
- [ ] Una foto con GPS en su EXIF se almacena sin ningún metadato
- [ ] Un usuario ajeno al equipo no accede a moderación
- [ ] Toda acción de moderación queda registrada y el registro no admite modificación

**Transversales**

- [ ] Auditoría de accesibilidad AA sin incidencias graves
- [ ] Las líneas de emergencia son accesibles desde la pantalla principal en un toque
- [ ] Con zoom al 200 % no hay desplazamiento horizontal
- [ ] Aviso de privacidad publicado con el responsable de D-1 identificado

---


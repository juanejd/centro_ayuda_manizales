# TRD — Centro de Ayuda Manizales

**Documento de Requisitos Técnicos**

| Campo | Valor |
| --- | --- |
| Documento fuente | `MVP — Plataforma Inteligente de Respuesta y Coordinación ante Emergencias (1).md` |
| Alcance | Tres módulos del documento fuente, con las necesidades y los aportes acoplados por un tablero público |
| Cobertura territorial | **Municipio de Manizales**, urbano y rural |
| Artefacto acompañante | [`docs/data-model.sql`](./data-model.sql) — DDL completo |
| Plan de ejecución | [`docs/implementation/`](./implementation/README.md) — nueve fases con sus unidades de trabajo |

Este documento es la fuente de verdad técnica de la plataforma. Define qué se construye, con qué tecnología, sobre qué modelo de datos y bajo qué criterios se considera terminado.

---

## Contenido

1. [Alcance](#1-alcance)
2. [Contexto de uso y restricciones de producto](#2-contexto-de-uso-y-restricciones-de-producto)
3. [Actores](#3-actores)
4. [Arquitectura técnica](#4-arquitectura-técnica)
5. [Requisitos funcionales](#5-requisitos-funcionales)
6. [Tabla de emparejamiento](#6-tabla-de-emparejamiento)
7. [Requisitos no funcionales](#7-requisitos-no-funcionales)
8. [Seguridad y privacidad](#8-seguridad-y-privacidad)
9. [Modelo de datos](#9-modelo-de-datos)
10. [Decisiones de la organización](#10-decisiones-de-la-organización)
11. [Criterios de aceptación](#11-criterios-de-aceptación)
12. [Plan de implementación](#12-plan-de-implementación)
13. [Trazabilidad con el documento fuente](#13-trazabilidad-con-el-documento-fuente)

---

## 1. Alcance

### 1.1 Principio de diseño

Una necesidad publicada es visible para cualquier persona. Quien puede ayudar encuentra por sí mismo la necesidad que corresponde a lo que ofrece, sin intermediario, sin cuenta y sin esperar a que un funcionario haga la conexión.

De ese principio se derivan todas las decisiones de este documento, incluidas las de seguridad de la sección 8.

### 1.2 Módulos

| # | Módulo | Naturaleza |
| --- | --- | --- |
| 1 | **Necesito Ayuda** | Escritura pública — publicar una necesidad |
| 2 | **Tablero de necesidades** | Lectura pública — ver y filtrar necesidades |
| 3 | **Quiero Ayudar** | Escritura y lectura — registrar un aporte con emparejamiento en vivo |
| 4 | **Busco Información** | Lectura — directorio informativo |
| 5 | **Moderación** | Escritura autenticada — verificar, ocultar y mantener el directorio |

Más la pantalla principal.

El tablero de necesidades no existe en el documento fuente. Es la pieza que permite acoplar los módulos 1 y 3: sin una superficie pública de lectura, una necesidad publicada no puede llegar a quien la resuelve.

### 1.3 Cobertura territorial

La plataforma cubre **únicamente el municipio de Manizales**, en su zona urbana y rural. No se pide el municipio en ningún formulario: sería un campo con una sola respuesta posible, y en un formulario que debe completarse en 90 segundos eso es un toque a cambio de nada.

El eje geográfico es, por tanto, un nivel más abajo: la **comuna** —once urbanas más los corregimientos rurales— es lo que filtra el tablero, el directorio y el emparejamiento. La persona escribe su **barrio**, que es lo que conoce, y el sistema deriva la comuna.

Extender la plataforma a otro municipio es una migración conocida y acotada: añadir una tabla de municipios y una clave foránea en `comunas`. Una sola tabla, no tres. No se construye ahora porque sería estructura especulativa.

### 1.4 Fuera del alcance

| Componente | Motivo |
| --- | --- |
| **Manos Amigas** (voluntariado) | Requiere gestión de actividades, cupos e inscripciones. Es un módulo completo por sí solo. |
| **Asistente IA** | Requiere el resto de la información poblada para tener valor. |
| **Centro de Comando** (dashboard) | Requiere agregaciones, mapas de calor y métricas. La moderación no lo sustituye. |
| Clasificación automática por IA (categoría, prioridad, resumen, duplicados) | Depende del Asistente IA. La prioridad es un campo manual. |
| Aplicación móvil nativa | Web responsive. El documento fuente ya lo excluye. |
| Recepción o custodia de dinero | El documento fuente lo prohíbe explícitamente. |

Ningún elemento de esta lista queda descartado; queda fuera de esta entrega.

---

## 2. Contexto de uso y restricciones de producto

Requisitos, no aspiraciones. Toda decisión técnica se subordina a ellos.

| ID | Restricción | Implicación técnica |
| --- | --- | --- |
| RP-1 | La persona está en una emergencia, posiblemente en la calle, alterada y con prisa | Un formulario debe completarse en menos de 90 segundos. |
| RP-2 | Acceso desde celular, con red móvil degradada o saturada | Presupuesto de peso estricto (§7.2). Renderizado en servidor. |
| RP-3 | Perfil de usuario heterogéneo, incluida baja alfabetización digital | Lenguaje llano, botones grandes, un concepto por pantalla. |
| RP-4 | Sin registro ni inicio de sesión para el ciudadano | Aplica tanto a publicar como a leer. La autenticación existe solo para el Moderador. |
| RP-5 | Dispositivos antiguos y de gama baja | Degradación elegante. Sin APIs recientes en rutas críticas. |
| RP-6 | La información desactualizada es peligrosa | La fecha de verificación es un elemento visual de primer nivel, en el tablero y en el directorio. |
| RP-7 | Una necesidad ya atendida que sigue publicada desperdicia ayuda | Obliga al cierre y retiro autónomo de la propia publicación, y a la caducidad automática. |

---

## 3. Actores

| Actor | Autenticación | Capacidades |
| --- | --- | --- |
| **Ciudadano o entidad que necesita ayuda** | Anónimo | Publicar una necesidad. Gestionar su propia publicación con su enlace de gestión: corregirla, marcarla como resuelta o retirarla. Consultar el tablero y el directorio. |
| **Ciudadano o entidad que quiere ayudar** | Anónimo | Ver y filtrar el tablero. Registrar su aporte y ver en vivo las necesidades que coinciden. Consultar el directorio. |
| **Moderador** | Autenticado | Verificar, marcar como duplicada u ocultar necesidades. Asignar prioridad. Retirar una foto. Gestionar los aportes registrados. Mantener el directorio y su estado de verificación. Exportar CSV. |

Un único rol autenticado cubre tanto la moderación de necesidades como el mantenimiento del directorio.

---

## 4. Arquitectura técnica

### 4.1 Stack

| Capa | Tecnología | Justificación |
| --- | --- | --- |
| Framework | **Next.js (App Router) + TypeScript** | Renderizado en servidor (RP-2). Server Actions eliminan la necesidad de una capa de API propia para los formularios. |
| Estilos | **Tailwind CSS** | Sin CSS en tiempo de ejecución. Coste cero en JavaScript. |
| Base de datos | **Supabase (PostgreSQL)** | RLS por fila y vistas, que son el mecanismo central de la sección 8. |
| Almacenamiento de archivos | **Supabase Storage** | Fotos de necesidades y del directorio. |
| Autenticación | **Supabase Auth** | Solo para el Moderador. El ciudadano nunca se autentica (RP-4). |
| Despliegue | **Vercel** | Sin infraestructura que operar durante una emergencia. |

### 4.2 La clave anónima no llega al navegador

Ninguna variable de entorno de Supabase se publica con el prefijo `NEXT_PUBLIC_`. Todas las lecturas y escrituras ocurren en el servidor: Server Components para el renderizado, Server Actions para los formularios y un único Route Handler para el filtrado en vivo.

Consecuencia: no existe un endpoint REST público de Supabase alcanzable por un tercero, porque nadie fuera del servidor tiene la clave. Extraer los datos exige raspar páginas HTML paginadas y con límite de tasa, en lugar de una sola llamada que devuelva miles de filas.

Esto no oculta los datos de contacto —son públicos por diseño— pero cambia el coste de la extracción masiva en varios órdenes de magnitud. Es la mitigación estructural más importante del sistema.

### 4.3 Qué clave hace qué

Dentro del servidor, la elección de clave es en sí misma una frontera de seguridad.

| Clave | Se usa para | No se usa para |
| --- | --- | --- |
| `anon` | Lecturas públicas (tablero, directorio) y los `INSERT` de ambos formularios públicos. Se usa aun ejecutándose en el servidor, para que RLS siga siendo una segunda capa real y no decorativa. | Nada que requiera saltarse RLS. |
| `service_role` | Exactamente dos operaciones: la gestión de la propia publicación por `reference_code` más `manage_token`, que no puede expresarse como política RLS porque el token nunca es una credencial de base de datos; y las barridas programadas de caducidad. | Moderación. Ninguna otra cosa. |
| Sesión del usuario autenticado | Moderación, de modo que la comprobación de pertenencia al equipo y el registro de auditoría se apliquen de verdad. | — |

Que la moderación no use `service_role` es deliberado: si lo hiciera, el registro de auditoría no podría atribuir la acción a nadie.

### 4.4 Estructura de directorios

Organización por dominio. Cada módulo es una vertical autocontenida.

```
src/
  app/
    page.tsx                      # Pantalla principal
    necesito-ayuda/
      page.tsx                    # Formulario
      enviado/page.tsx            # Confirmación con radicado
    necesidades/
      page.tsx                    # Tablero público
      [code]/page.tsx             # Detalle de una necesidad
    mi-publicacion/
      page.tsx                    # Gestión con código y token
    quiero-ayudar/
      page.tsx                    # Formulario con emparejamiento en vivo
    informacion/
      page.tsx                    # Directorio
      [slug]/page.tsx
    api/
      necesidades/route.ts        # Filtrado en vivo, solo lectura
    moderacion/                   # Protegido
      page.tsx
      login/page.tsx
  modules/
    help-requests/                # Publicar, listar y gestionar necesidades
      domain/                     # Tipos, categorías, validación Zod
      actions/                    # Server Actions
      queries/                    # Lecturas del tablero
      components/
    help-offers/                  # Aportes
      domain/ actions/ components/
    matching/                     # Motor de emparejamiento (§6)
      domain/                     # Tabla de correspondencia, tipos
      queries/
    info-resources/               # Directorio
      domain/ queries/ components/
    moderation/
      domain/ actions/ queries/ components/
  shared/
    supabase/                     # Clientes de servidor y service-role. Ninguno de navegador.
    ui/
    validation/
    rate-limit/
    images/                       # Compresión y limpieza de metadatos
supabase/
  migrations/
  seed/
docs/
  TRD.md
  data-model.sql
```

**Regla de dependencias:** `app/` importa de `modules/` y `shared/`. `modules/` importa de `shared/`. `shared/` no importa de ninguno de los anteriores. Un módulo no importa de otro módulo, con una única excepción declarada: `matching/` importa los vocabularios de `help-requests/domain` y `help-offers/domain`, porque su razón de existir es traducir entre ambos.

### 4.5 Flujo de publicación de una necesidad

```
Formulario (Server Component + <form> nativo)
  → Server Action
      → Validación Zod en servidor
      → Límite de tasa por IP
      → Limpieza de metadatos de la foto (§8.2)
      → Generación de reference_code y manage_token
      → INSERT con moderation_status = 'sin_verificar'
  → Confirmación con radicado y enlace de gestión
  → Visible en el tablero de inmediato
```

El formulario funciona sin JavaScript. Es un `<form>` HTML apuntando a una Server Action. El JavaScript progresivo solo agrega comodidades: compresión de imagen, geolocalización y validación en vivo.

### 4.6 Flujo de emparejamiento en vivo

```
Formulario Quiero Ayudar (Client Component mínimo)
  → el usuario selecciona tipo de aporte y comuna
  → debounce de 300 ms
  → GET /api/necesidades?contribution=<t>&comuna=<c>
       → Route Handler (servidor)
           → traduce tipo de aporte a categorías (§6)
           → consulta la vista pública, tope de 20 filas
           → límite de tasa por IP
  → renderiza el contador y la lista de coincidencias
  → el usuario registra su aporte (Server Action)
```

Sin JavaScript, el bloque de coincidencias no se renderiza durante el llenado y la pantalla de confirmación muestra las necesidades coincidentes tras enviar. La funcionalidad no se pierde, se desplaza.

### 4.7 Estrategia de caché

| Vista | Estrategia | Motivo |
| --- | --- | --- |
| Directorio | Server Component, `revalidate = 300`, más revalidación bajo demanda al editar | Cambia poco. Se sirve casi como HTML estático. |
| Tablero | Server Component, `revalidate = 60` | Una necesidad publicada debe verse en menos de un minuto. |
| Detalle de necesidad | Dinámico, sin caché | Debe reflejar de inmediato un retiro o un cierre. |
| Filtrado en vivo | Sin caché, con límite de tasa | Refleja el estado real del tablero. |

---

## 5. Requisitos funcionales

### 5.1 RF-0 — Pantalla principal

| ID | Requisito |
| --- | --- |
| RF-0.1 | Muestra tres acciones: **NECESITO AYUDA**, **QUIERO AYUDAR**, **BUSCO INFORMACIÓN**. |
| RF-0.2 | Cada acción es un bloque táctil de altura mínima 96 px con una frase de apoyo de una línea. |
| RF-0.3 | Sin carrusel, sin texto introductorio largo, sin navegación compleja. |
| RF-0.4 | Acceso a las líneas de emergencia oficiales como enlaces `tel:` directos, sin pasar por ningún formulario. Los números provienen del directorio, categoría «líneas de atención», y no están escritos en el código. |
| RF-0.5 | Aviso permanente y visible: esta plataforma no reemplaza a la línea de emergencia oficial. |
| RF-0.6 | Enlace secundario a **Ver todas las necesidades**, para quien quiere mirar el tablero sin llenar el formulario de aporte. |
| RF-0.7 | Enlace secundario a **Gestionar mi publicación**. |

### 5.2 RF-1 — Necesito Ayuda

| ID | Requisito |
| --- | --- |
| RF-1.1 | Formulario de una sola pantalla, sin asistente por pasos. |
| RF-1.2 | Campos obligatorios: categoría, descripción, **barrio o sector**, nombre de contacto, teléfono de contacto, consentimiento de tratamiento y consentimiento de publicación. No se pide el municipio: la plataforma cubre solo Manizales. |
| RF-1.3 | Campos opcionales: sector, barrio o vereda; dirección; número de personas afectadas; ubicación en mapa; foto. |
| RF-1.4 | Categorías: Salud · Vivienda y daños estructurales · Albergue · Alimentos · Agua · Sangre · Mascotas · Movilidad y vías · Servicios públicos · Personas desaparecidas · Atención psicológica · Transporte · Remoción de escombros · Otros. |
| RF-1.5 | El formulario advierte, antes del campo de teléfono y de forma visualmente destacada, que el nombre, el teléfono y la foto serán visibles públicamente para cualquier persona en internet. No es texto legal en letra pequeña: es una advertencia de primer nivel. |
| RF-1.6 | Dos casillas de consentimiento separadas, ambas sin marcar por defecto: tratamiento de datos personales, y publicación del nombre, el teléfono y la foto en un tablero público. Sin ambas no se envía. |
| RF-1.7 | La ubicación se captura con la geolocalización del navegador solo mediante una acción explícita del usuario. Nunca automáticamente. Si se deniega, el barrio o sector en texto es suficiente. |
| RF-1.7b | El campo de barrio es **texto con autocompletado** contra el catálogo de barrios de Manizales. Si el texto coincide con un barrio, se registra también su comuna y la necesidad queda filtrable por zona. **Si no coincide, se guarda el texto tal cual y la zona queda sin asignar**, para que un Moderador la resuelva. Nunca se rechaza un envío por un barrio ausente del catálogo. |
| RF-1.8 | La foto es opcional, un solo archivo, comprimida en cliente con objetivo de 500 KB y tope de 5 MB sin compresión. Es **pública** una vez publicada la necesidad. |
| RF-1.9 | Junto al campo de foto, advertencia de no incluir personas identificables ni documentos de identidad. |
| RF-1.10 | Todos los metadatos de la imagen se eliminan en el servidor antes de almacenarla (§8.2). |
| RF-1.11 | La necesidad se publica en el tablero de inmediato, con estado de moderación «sin verificar». Sin cola de aprobación. |
| RF-1.12 | La prioridad no se calcula automáticamente. Toda necesidad nace sin prioridad y solo un Moderador la asigna. |
| RF-1.13 | Al guardar: pantalla de confirmación con el código de radicado, el enlace de gestión y las líneas de emergencia oficiales. El enlace de gestión se presenta con instrucción explícita de guardarlo. |
| RF-1.14 | La plataforma no emite ningún juicio sobre daños estructurales, condiciones médicas ni seguridad de un lugar. |

La prioridad manual es consecuencia de que no haya clasificación automática. No se sustituye por heurísticas propias: una priorización automática mal hecha en una emergencia es peor que ninguna.

### 5.3 RF-2 — Tablero de necesidades

| ID | Requisito |
| --- | --- |
| RF-2.1 | Accesible sin autenticación. Lista las necesidades publicadas, más recientes primero. |
| RF-2.2 | Filtros por categoría y **comuna**, ambos poblados desde su catálogo, más una opción explícita **«zona sin asignar»**. Búsqueda por texto sobre la descripción y sobre el barrio escrito. |
| RF-2.3 | Paginación con tope duro de 20 elementos por página. No existe vista ni parámetro que devuelva el conjunto completo. |
| RF-2.4 | Cada tarjeta muestra categoría, distintivo de moderación, antigüedad relativa, **barrio tal como lo escribió la persona y su comuna cuando esté resuelta**, descripción, número de afectados, nombre de contacto y teléfono como enlace `tel:`. |
| RF-2.4b | Una necesidad con la zona sin asignar **aparece en el tablero igual que las demás**, con su barrio en texto. No se oculta ni se posterga: quien vive en un asentamiento informal o en una vereda sin registrar es de quien menos se puede prescindir. |
| RF-2.5 | Distintivo de moderación con color y texto: **Sin verificar** · **Verificado**, con la fuente que verificó · **Atendida** · **Duplicada**. |
| RF-2.6 | Las necesidades atendidas permanecen visibles 48 horas marcadas como tales y luego se ocultan. Quien va en camino necesita saber que ya fue resuelta, no que desapareció. |
| RF-2.7 | Vista de detalle por código de radicado, con la ubicación aproximada en mapa y la foto cuando existan. |
| RF-2.8 | Aviso antifraude permanente y visible: nadie legítimo pedirá dinero, datos bancarios ni códigos de verificación a cambio de ayudar. |
| RF-2.9 | Las necesidades ocultas y retiradas no aparecen en ninguna vista pública ni en la API de filtrado. |
| RF-2.10 | El tablero y las vistas de detalle se sirven con `noindex, nofollow` y quedan excluidos en `robots.txt`. |

### 5.4 RF-3 — Quiero Ayudar

| ID | Requisito |
| --- | --- |
| RF-3.1 | Primera pregunta: **¿Cómo puedes ayudar?**, como selección de tipo de aporte. |
| RF-3.2 | Tipos de aporte: Dinero · Alimentos · Agua · Ropa y cobijas · Medicamentos o insumos permitidos · Transporte · Vehículos · Maquinaria · Herramientas · Alojamiento · Alimento para mascotas · Servicios profesionales · Tiempo como voluntario · Otro. |
| RF-3.3 | Campos obligatorios: tipo de aportante (persona, empresa u organización), nombre, tipo de aporte y teléfono, más el consentimiento de tratamiento. La comuna es opcional y sirve para acotar el emparejamiento. |
| RF-3.4 | A medida que el usuario selecciona tipo de aporte y, si quiere, comuna, y antes de enviar nada, la misma pantalla muestra el número de necesidades coincidentes y una lista de hasta 20, con enlace al detalle. Se actualiza con debounce de 300 ms. |
| RF-3.4b | Sin comuna seleccionada, el emparejamiento abarca todo Manizales, **incluidas las necesidades con zona sin asignar**. Filtrar por comuna es una forma de acotar, nunca un requisito para ver resultados. |
| RF-3.5 | La correspondencia entre tipo de aporte y categorías de necesidad se resuelve con la tabla de la sección 6. No es coincidencia literal de cadenas: los dos vocabularios son distintos. |
| RF-3.6 | Si no hay coincidencias, se dice explícitamente y se ofrece ver el tablero completo. Nunca una lista vacía sin explicación. |
| RF-3.7 | Sin JavaScript, el bloque en vivo no se renderiza y la pantalla de confirmación muestra las necesidades coincidentes tras enviar. |
| RF-3.8 | Campos opcionales: descripción, cantidad o capacidad disponible, disponibilidad horaria, correo electrónico y sector. |
| RF-3.9 | Si el tipo de aporte es Dinero, la plataforma no captura ningún dato financiero, no muestra emparejamiento y redirige a la lista de entidades verificadas del directorio. La plataforma no recibe ni custodia dinero. |
| RF-3.10 | Si el tipo de aporte es Tiempo como voluntario, se registra el contacto, se muestran las necesidades coincidentes y se informa que el módulo de voluntariado aún no está disponible. Sin prometer una asignación que el sistema no puede hacer. |
| RF-3.11 | Los datos de contacto del aportante no se publican en ninguna vista pública. La asimetría con RF-1 es deliberada: quien pide ayuda autoriza expresamente la publicación; quien la ofrece no. |
| RF-3.12 | Al guardar: confirmación con código de radicado. |

### 5.5 RF-4 — Gestión de la propia publicación

| ID | Requisito |
| --- | --- |
| RF-4.1 | Cada necesidad genera un `manage_token` opaco. El enlace de gestión es `/mi-publicacion?code=<reference_code>&token=<manage_token>`. |
| RF-4.2 | Con ese enlace, y sin cuenta ni inicio de sesión, la persona puede marcar la necesidad como resuelta, retirarla por completo, o corregir su descripción y su teléfono. |
| RF-4.3 | Retirarla la excluye de inmediato de toda vista pública y de la API de filtrado. |
| RF-4.4 | El acceso exige código y token. El token es un UUID versión 4 y nunca se muestra en el tablero ni en ninguna vista pública. |
| RF-4.5 | El endpoint de gestión tiene límite de tasa por IP para impedir el sondeo de tokens. |
| RF-4.6 | Un Moderador puede retirar u ocultar cualquier necesidad sin el token. |
| RF-4.7 | Como la pérdida del enlace es previsible, existe una ruta alternativa: solicitar el retiro por el canal de contacto del aviso de privacidad, resuelto manualmente por un Moderador. |

Sin este módulo una persona no puede retirar sus datos de contacto de internet, y el tablero se llena de necesidades ya resueltas.

### 5.6 RF-5 — Busco Información

Módulo de solo lectura. El ciudadano no escribe nada aquí.

| ID | Requisito |
| --- | --- |
| RF-5.1 | Listado filtrable por categoría y comuna, con búsqueda por texto sobre nombre y descripción. |
| RF-5.2 | Categorías: Albergues · Hospitales · Centros médicos · Donación de sangre · Puntos de donación · Centros de acopio · Atención de mascotas · Personas desaparecidas · Evaluación de viviendas · Servicios públicos · Bomberos · Defensa Civil · Cruz Roja · Alcaldías · Gobernación · Líneas de atención · Cierres viales · Otros. |
| RF-5.3 | Cada recurso muestra nombre, categoría, descripción, dirección, barrio y comuna, punto de encuentro, teléfonos, horario, fuente, estado de verificación y fecha y hora de última verificación. |
| RF-5.4 | Los teléfonos son enlaces `tel:`. La dirección abre la aplicación de mapas del dispositivo. |
| RF-5.5 | Estado como distintivo visual: **Verificado · Pendiente de validar · Desactualizado · Cerrado**. Color y texto; el color nunca es el único portador de la información. |
| RF-5.6 | La fecha de última verificación es visible en la tarjeta del listado, no solo en el detalle. Si supera 72 horas, se marca visualmente como potencialmente desactualizada. |
| RF-5.7 | Cada recurso admite de 0 a N fotos de referencia, cada una con descripción, para reconocer el lugar físicamente: fachada, entrada, punto de encuentro. Carga diferida con dimensiones reservadas. |
| RF-5.8 | Los recursos cerrados permanecen visibles y marcados. Quien llega a un albergue cerrado necesita saber que cerró, no que no existe. |
| RF-5.9 | Vista consolidada de líneas de atención accesible en un toque desde la pantalla principal. |
| RF-5.10 | A diferencia del tablero, el directorio sí es indexable por buscadores. Es información institucional, no datos personales. |

### 5.7 RF-6 — Moderación

| ID | Requisito |
| --- | --- |
| RF-6.1 | Ruta protegida. Solo usuarios registrados como miembros del equipo. Sin registro público. |
| RF-6.2 | Lista de necesidades con filtros por categoría, comuna, estado de moderación y prioridad, **incluido un filtro para las que tienen la zona sin asignar**, que es la cola de trabajo de RF-6.3b. |
| RF-6.3 | Sobre una necesidad, el Moderador puede marcarla verificada indicando la fuente, marcarla duplicada de otra, ocultarla, retirarla y asignarle prioridad. |
| RF-6.3b | El Moderador **asigna la comuna** a una necesidad cuyo barrio no coincidió con el catálogo, y puede añadir ese barrio al catálogo para que la próxima vez se resuelva solo. |
| RF-6.4 | El Moderador puede retirar la foto de una necesidad sin ocultar la necesidad completa. Una foto inapropiada no debe costar la visibilidad de una necesidad legítima. |
| RF-6.5 | Lista de aportes registrados con sus datos de contacto, para contacto proactivo. |
| RF-6.6 | Gestión del directorio: crear, editar, publicar y despublicar recursos, cargar fotos con descripción y actualizar el estado y la fecha de verificación. |
| RF-6.7 | Toda modificación registra autor y fecha. |
| RF-6.8 | Exportación a CSV de la vista filtrada. |
| RF-6.9 | Fuera de este módulo: mapas de calor, gráficas, métricas agregadas y asignación automática de recursos. |

---

## 6. Tabla de emparejamiento

El documento fuente define dos vocabularios distintos: categorías de necesidad y tipos de aporte. No coinciden. El emparejamiento en vivo es imposible sin una traducción explícita entre ambos.

| Tipo de aporte | Categorías de necesidad que atiende |
| --- | --- |
| Alimentos | Alimentos |
| Agua | Agua |
| Ropa y cobijas | Albergue · Vivienda |
| Medicamentos o insumos permitidos | Salud |
| Alojamiento | Albergue · Vivienda |
| Alimento para mascotas | Mascotas |
| Transporte | Transporte · Movilidad y vías · Salud |
| Vehículos | Transporte · Movilidad y vías · Remoción de escombros |
| Maquinaria | Remoción de escombros · Movilidad y vías |
| Herramientas | Remoción de escombros · Vivienda |
| Servicios profesionales | Salud · Vivienda · Atención psicológica · Servicios públicos · Mascotas |
| Tiempo como voluntario | Todas |
| Otro | Todas |
| Dinero | Ninguna — redirige a entidades verificadas |

Notas de diseño:

- **Sangre** y **Personas desaparecidas** no tienen ningún tipo de aporte que las atienda. Son necesidades que se resuelven presentándose en un punto o reportando información, no aportando un recurso. Aparecen en el tablero pero nunca en un emparejamiento.
- **Servicios profesionales** es deliberadamente amplio: un ingeniero, un veterinario y un psicólogo seleccionan el mismo tipo. Afinarlo exige un subcampo de profesión, que añade fricción contra RP-1.
- La tabla vive en código, en `modules/matching/domain`, no en base de datos. Es lógica de negocio versionada y revisable en un diff, no un dato editable en producción.

---

## 7. Requisitos no funcionales

### 7.1 Rendimiento

| ID | Requisito |
| --- | --- |
| RNF-1.1 | Largest Contentful Paint menor o igual a 2,0 s en 4G lento (400 kbps, 400 ms RTT), en pantalla principal, tablero y directorio. |
| RNF-1.2 | Interacción a siguiente pintado menor o igual a 200 ms. |
| RNF-1.3 | El filtrado en vivo responde en 400 ms o menos en el percentil 95. |
| RNF-1.4 | Pantalla principal, tablero y directorio se renderizan en servidor y son utilizables sin JavaScript. |

### 7.2 Presupuesto de peso

| Ruta | JavaScript (gzip) | Total inicial |
| --- | --- | --- |
| Pantalla principal | ≤ 30 KB | ≤ 120 KB |
| Necesito Ayuda | ≤ 60 KB | ≤ 180 KB |
| Quiero Ayudar | ≤ 75 KB | ≤ 200 KB |
| Tablero | ≤ 50 KB | ≤ 200 KB sin fotos |
| Directorio | ≤ 50 KB | ≤ 200 KB sin fotos |

Superar el presupuesto es un fallo de build, no una advertencia. Quiero Ayudar tiene 15 KB adicionales sobre el resto de los formularios porque es el único cliente interactivo de la aplicación, y debe implementarse sin librerías de estado ni de peticiones.

### 7.3 Disponibilidad y resiliencia

| ID | Requisito |
| --- | --- |
| RNF-3.1 | Si la base de datos no responde al enviar un formulario, el usuario recibe un mensaje claro más las líneas de emergencia oficiales. Nunca un error técnico crudo. |
| RNF-3.2 | Si el emparejamiento en vivo falla, el formulario sigue siendo enviable. Un fallo de coincidencias nunca bloquea el registro de un aporte. |
| RNF-3.3 | El directorio y el tablero se sirven desde caché con revalidación. Una caída de base de datos no debe dejar inaccesible la información de albergues. |
| RNF-3.4 | PWA con service worker que cachea la pantalla principal, el directorio y la primera página del tablero para consulta sin conexión. |
| RNF-3.5 | Los envíos de formulario no se encolan sin conexión. Un reporte que el usuario cree enviado y que no llegó es peor que un error visible. |

### 7.4 Accesibilidad

| ID | Requisito |
| --- | --- |
| RNF-4.1 | WCAG 2.1 nivel AA como mínimo. |
| RNF-4.2 | Contraste mínimo de 4,5:1 en texto normal. Objetivos táctiles de 48 × 48 px o más. |
| RNF-4.3 | Los formularios son navegables y completables solo con teclado y con lector de pantalla. |
| RNF-4.4 | Los errores de validación se anuncian y se asocian programáticamente a su campo. |
| RNF-4.5 | Ningún estado se comunica únicamente por color. |
| RNF-4.6 | El contador de coincidencias en vivo se anuncia en una región `aria-live="polite"`. Un cambio silencioso de contenido es invisible para un lector de pantalla. |
| RNF-4.7 | Toda foto de referencia del directorio tiene texto alternativo obligatorio en la interfaz de edición. |

### 7.5 Idioma

Español de Colombia en toda la interfaz, con registro neutro y llano, sin jerga técnica ni institucional. El código, los identificadores y los comentarios en inglés.

---

## 8. Seguridad y privacidad

### 8.1 Qué publica la plataforma

La plataforma publica en internet abierto el nombre, el teléfono, la categoría de necesidad, el barrio, la comuna, la ubicación aproximada y la foto de personas que acaban de sufrir una emergencia. Sin autenticación, sin barrera y sin verificación previa.

Es el requisito central del producto: reduce la fricción a cero y permite que un vecino con un carro llame en treinta segundos. La ingeniería lo implementa y lo endurece hasta donde es posible sin contradecirlo.

Las mitigaciones están en §8.2. Lo que ninguna mitigación resuelve está en §8.3, y debe constar en el aviso de privacidad.

### 8.2 Mitigaciones

| ID | Mitigación | Qué reduce |
| --- | --- | --- |
| RNF-5.1 | La clave anónima nunca se publica al navegador (§4.2). | Elimina el endpoint REST público. La extracción masiva pasa de una llamada a raspar HTML paginado. |
| RNF-5.2 | El rol `anon` no accede a la tabla de necesidades. Accede solo a una vista que expone columnas explícitas y filtra por estado. | Evita que un cambio futuro exponga columnas internas o registros retirados. |
| RNF-5.3 | Tope duro de 20 filas por consulta, en el tablero y en la API de filtrado. Sin parámetro que lo eleve. | Hace el coste de extracción proporcional al número de peticiones. |
| RNF-5.4 | Límite de tasa por IP: 5 escrituras cada 10 minutos en formularios; 60 lecturas por minuto en el filtrado; 10 intentos cada 10 minutos en gestión de publicación. | Raspado automatizado y sondeo de tokens. |
| RNF-5.5 | `noindex, nofollow` y exclusión en `robots.txt` para tablero, detalle y gestión. | Impide que los teléfonos queden indexados y sigan siendo encontrables en buscadores años después. Es la mitigación con mejor relación entre valor y esfuerzo. |
| RNF-5.6 | Coordenadas redondeadas a tres decimales, unos 110 metros, en la vista pública. Las exactas quedan solo para el Moderador. | La ubicación precisa de una vivienda deja de ser pública sin perder utilidad para llegar al sector. |
| RNF-5.7 | **Eliminación de todos los metadatos de la imagen en el servidor antes de almacenarla.** Se reescribe el archivo conservando solo los píxeles. | Una foto tomada con un celular lleva coordenadas GPS exactas en su EXIF. Publicarla sin limpiar anularía por completo el redondeo de RNF-5.6 y expondría la vivienda con precisión de metros, además de modelo de dispositivo y fecha. Sin esta mitigación, la decisión de hacer pública la foto sería incompatible con RNF-5.6. |
| RNF-5.8 | Las fotos se almacenan en rutas basadas en UUID, en un bucket de lectura pública sin listado. | Enumeración del conjunto completo de fotos. |
| RNF-5.9 | Caducidad automática: una necesidad se oculta a los 14 días sin actividad; las atendidas, a las 48 horas. | Acota la ventana de exposición en el tiempo. |
| RNF-5.10 | Retiro autónomo por la propia persona, sin cuenta (RF-4). | Sin esto no habría forma de revertir la exposición, lo que sería indefendible. |
| RNF-5.11 | El Moderador puede retirar una foto sin ocultar la necesidad (RF-6.4). | Contenido inapropiado en un canal público sin verificación previa. |
| RNF-5.12 | Aviso antifraude permanente en el tablero y advertencia destacada antes del campo de teléfono. | Estafas por suplantación de ayuda, que son el abuso más previsible de este modelo. |
| RNF-5.13 | Los datos de contacto de los aportantes no se publican. | Limita la exposición a quien la autorizó expresamente. |
| RNF-5.14 | RLS habilitado en todas las tablas. La clave `service_role` nunca llega al cliente. | Base del modelo de acceso. |
| RNF-5.15 | Privilegios a nivel de columna, además de las políticas RLS, en las escrituras anónimas. | Un `WITH CHECK` rechaza una fila, pero solo un privilegio por columna impide que el rol anónimo suministre prioridad o estado de moderación. |
| RNF-5.16 | Validación con Zod en el servidor en toda escritura. La validación de cliente es solo experiencia de usuario. | Escrituras malformadas o maliciosas. |
| RNF-5.17 | Topes de longitud en todo campo de texto libre. | Cargas de varios megabytes en un formulario público sin autenticación. |
| RNF-5.18 | Sin CAPTCHA. Es fricción directa contra RP-1 y RP-3. Se acepta el riesgo y se mitiga con RNF-5.4 más moderación reactiva. Reevaluable ante abuso real. | Decisión consciente, no omisión. |
| RNF-5.19 | Sin analítica de terceros ni píxeles de seguimiento en ninguna ruta que muestre o capture datos personales. | Fuga a terceros. |

### 8.3 Lo que no queda mitigado

Enunciado explícitamente para que la aceptación del modelo sea informada.

1. **Cualquier persona puede leer los teléfonos y ver las fotos.** Es el requisito, no un defecto. Ninguna mitigación lo cambia.
2. **La extracción masiva sigue siendo posible**, solo más costosa. Un raspador paciente con direcciones IP rotativas obtiene el conjunto completo.
3. **La exposición no es reversible en la práctica.** El retiro la quita de la plataforma, no de las copias que un tercero ya haya hecho.
4. **No hay verificación de identidad al publicar.** Cualquiera puede publicar el teléfono de otra persona como si fuera el suyo, y la moderación es reactiva, así que el daño precede a la corrección. Es el riesgo más grave del modelo y no tiene solución dentro de las restricciones elegidas.
5. **Una foto puede revelar más de lo que su autor pretendía**: rostros de terceros, el interior de una vivienda, la fachada que permite ubicarla. La limpieza de metadatos elimina la geolocalización incrustada, y la advertencia del formulario reduce el error, pero el contenido visible de la imagen es responsabilidad de quien la sube y solo se corrige de forma reactiva.
6. **Las estafas dirigidas son previsibles.** Un listado público de personas vulnerables con teléfono y necesidad declarada es un objetivo de valor. El aviso antifraude advierte; no protege.

### 8.4 Tratamiento de datos personales

| ID | Requisito |
| --- | --- |
| RNF-6.1 | Dos consentimientos separados y granulares, sin marcar por defecto. La Ley 1581 de 2012 exige autorización informada para una finalidad determinada, y la divulgación pública de los datos de contacto y de la imagen es una finalidad distinta del tratamiento interno; agruparlas en una sola casilla haría la autorización jurídicamente frágil. |
| RNF-6.2 | Se almacena el momento de cada consentimiento, no un valor booleano. Un booleano no prueba cuándo se autorizó. |
| RNF-6.3 | Aviso de privacidad accesible que declare finalidad, responsable del tratamiento, el carácter público del nombre, el teléfono y la foto, con quién se comparte, tiempo de conservación, canal para ejercer derechos y canal alternativo de retiro. |
| RNF-6.4 | El responsable del tratamiento debe ser una entidad jurídica identificada. |
| RNF-6.5 | Los datos de contacto de aportantes no se muestran públicamente. |
| RNF-6.6 | Conservación de 12 meses. Después, anonimización de nombre, teléfono, correo y coordenadas, y eliminación de la foto, conservando los campos agregables —categoría, comuna, fecha— con fines estadísticos. |
| RNF-6.7 | Derecho de supresión atendible sin cuenta y por canal manual. |

### 8.5 Matriz de acceso

| Objeto | Rol `anon` | Rol autenticado del equipo |
| --- | --- | --- |
| `comunas`, `neighborhoods` | `SELECT` de los registros activos. El formulario alimenta su autocompletado desde `neighborhoods`, y los filtros de zona desde `comunas`. | Todo |
| `help_requests` (tabla) | Sin acceso de lectura ni de modificación. `INSERT` restringido a una lista explícita de columnas. | `SELECT`, `UPDATE` |
| `public_help_requests` (vista) | `SELECT`. Columnas acotadas, coordenadas redondeadas, filtrada a estados públicos y no caducados. | `SELECT` |
| `help_offers` | `INSERT` en columnas explícitas. Sin `SELECT`. | `SELECT`, `UPDATE` |
| `info_resources` | `SELECT` donde esté publicado | Todo |
| `info_resource_photos` | `SELECT` de recursos publicados | Todo |
| `staff_members` | Sin acceso | `SELECT` |
| `moderation_log` | Sin acceso | `SELECT`, `INSERT`. Sin `UPDATE` ni `DELETE`. |

La gestión de la propia publicación no se resuelve con RLS: se ejecuta en una Server Action que valida código y token y luego escribe con `service_role`. El token nunca se convierte en una credencial de base de datos.

Las políticas del equipo verifican pertenencia a `staff_members`. Estar autenticado no basta.

---

## 9. Modelo de datos

PostgreSQL. Nombres en inglés, `snake_case`. El DDL completo está en [`docs/data-model.sql`](./data-model.sql), que es la fuente de verdad de tipos, restricciones, índices y políticas. Esta sección explica las decisiones; las columnas no se duplican aquí porque dos copias del mismo esquema divergen.

### 9.1 Entidades

| Tabla | Propósito | Lectura anónima |
| --- | --- | --- |
| `comunas` | Catálogo de comunas y corregimientos de Manizales. Eje de filtrado por zona | Sí, los activos. |
| `neighborhoods` | Catálogo de barrios, cada uno con su comuna. Alimenta el autocompletado | Sí, los activos. |
| `help_requests` | Necesidades publicadas por ciudadanos | No. Solo a través de la vista. |
| `public_help_requests` (vista) | Proyección pública acotada de las necesidades | Sí. Única superficie pública. |
| `help_offers` | Aportes registrados | No. Nunca. |
| `info_resources` | Directorio de recursos | Sí, donde esté publicado. |
| `info_resource_photos` | Fotos de referencia del directorio | Sí, de recursos publicados. |
| `staff_members` | Pertenencia al rol Moderador | No. |
| `moderation_log` | Auditoría de acciones | No. |

### 9.2 Claves

Clave primaria `BIGINT GENERATED ALWAYS AS IDENTITY` en todas las tablas, salvo `staff_members`, cuya clave es un `uuid` porque es una clave foránea hacia `auth.users` y ese tipo no lo elegimos nosotros.

La opacidad que el sistema necesita no es la de la clave primaria, sino la de dos valores distintos, que son columnas propias:

| Columna | Naturaleza | Para qué |
| --- | --- | --- |
| `reference_code` | `text`, 8 caracteres, base32 de Crockford sin I, L, O ni U | Legible y dictable por teléfono. Se le entrega al ciudadano y es el identificador de la URL pública. |
| `manage_token` | `uuid` versión 4 | Inadivinable. Autoriza la gestión de la propia publicación sin cuenta. Nunca aparece en ninguna vista pública. |

Las claves primarias no se exponen nunca, así que una clave secuencial no filtra nada y da mejor localidad de índice que un UUID aleatorio.

El alfabeto del código excluye I, L y O por ambigüedad visual al dictarlas, y U para evitar que el generador produzca palabras ofensivas por accidente. La unicidad la garantiza la restricción `UNIQUE`, que es lo que hace correcto el reintento por conflicto en la aplicación.

### 9.3 Vocabularios controlados y estados

`help_requests` tiene dos columnas de estado, no una:

| Columna | Valores | Quién la cambia |
| --- | --- | --- |
| `moderation_status` | `sin_verificar` · `verificado` · `duplicado` · `oculta` · `retirada` | Moderador, o la propia persona al retirar |
| `fulfillment_status` | `abierta` · `atendida` | La propia persona o el Moderador |

Colapsarlas en un solo enumerado produce estados imposibles de representar: una necesidad puede estar verificada y atendida al mismo tiempo, y con un único campo habría que elegir cuál de los dos hechos se pierde.

Todos los conjuntos de valores se modelan como `text` con `CHECK`, no como tipo `ENUM` nativo. Las categorías de una emergencia son de negocio y cambiarán entre eventos: un `CHECK` se reemplaza en una migración, mientras que de un `ENUM` nunca se puede eliminar un valor.

**La geografía es la excepción: son tablas de catálogo con clave foránea, no `CHECK`.** La interfaz alimenta su autocompletado directamente desde `neighborhoods`, y un Moderador tiene que poder añadir un barrio que no estaba registrado sin necesidad de una migración.

Que la zona no sea texto libre no es una preferencia de estilo. Es la clave con la que se empareja un aporte con una necesidad y con la que se filtran el tablero y el directorio. Con texto libre, «La Enea», «la enea» y «Enea» serían tres grupos distintos y el emparejamiento devolvería cero coincidencias sin ningún error que lo explicara. La clave foránea convierte ese fallo silencioso en un rechazo inmediato.

### 9.3b Tres columnas para la geografía, y por qué

Cada necesidad localizada lleva tres columnas, y la división existe para resolver una tensión concreta: **el filtro fiable y el registro honesto de lo que la persona dijo no son lo mismo.**

| Columna | Contenido | Obligatoria |
| --- | --- | --- |
| `sector` | El barrio tal como lo escribió la persona, literal | Sí |
| `neighborhood_code` | Se llena solo si ese texto coincidió con el catálogo | No |
| `comuna_code` | Se deriva de la coincidencia, o la asigna un Moderador | No |

Alguien en un asentamiento informal, en una vereda o en una urbanización recién construida escribirá un nombre que no está en ningún catálogo. Rechazarlo no es una opción, así que **el texto se conserva y la zona queda sin asignar hasta que un humano la resuelva**.

De ahí se deriva una decisión que parece un detalle y no lo es: la vista pública une la geografía con `LEFT JOIN` y no con un `JOIN` interno. Con un `JOIN` interno, toda necesidad sin zona resuelta desaparecería del tablero, y eso ocultaría precisamente a las personas cuyo barrio no figura en ningún mapa. Sería un fallo de equidad, no de rendimiento.

La coherencia entre barrio y comuna se garantiza con una **clave foránea compuesta**, sin ningún disparador. Una clave compuesta usa `MATCH SIMPLE` por defecto, que no se comprueba cuando alguna de sus columnas es nula, y eso da exactamente el comportamiento que se busca:

| Par | Significado | Resultado |
| --- | --- | --- |
| `('la-enea', 'tesorito')` | Par válido del catálogo | Aceptado |
| `('la-enea', 'san-jose')` | Barrio atribuido a otra comuna | Rechazado |
| `(NULL, 'tesorito')` | Zona asignada por un Moderador, sin barrio | Aceptado |
| `(NULL, NULL)` | Sin resolver, pendiente de moderación | Aceptado |
| `('la-enea', NULL)` | Barrio sin su comuna | Rechazado por un `CHECK` |

La clave primaria de ambos catálogos es un identificador legible en minúsculas: es estable, sirve en una URL y no depende de una fuente externa para ser correcto.

### 9.4 Restricciones de coherencia

El esquema impide estados incoherentes que la interfaz podría producir por error:

| Restricción | Impide |
| --- | --- |
| `help_requests_verified_complete` | Marcar verificado sin fuente ni fecha. El distintivo público muestra la fuente: procedencia a medias es peor que ninguna. |
| `help_requests_resolved_has_timestamp` | Marcar atendida sin fecha de resolución, que es lo que mide la ventana de 48 horas. |
| `help_requests_withdrawn_consistent` | Que el estado retirada y su marca de tiempo se contradigan. |
| `help_requests_duplicate_not_self` | Que una necesidad sea duplicada de sí misma. |
| `info_resources_verified_has_timestamp` | Un recurso verificado sin fecha de verificación, que es justo el dato que el listado hace visible. |

Los campos de texto libre llevan tope de longitud mediante `CHECK (length(col) <= n)` en lugar de `varchar(n)`. En un formulario público sin autenticación, ese tope es además una defensa barata contra cargas de varios megabytes.

El teléfono se valida solo por longitud y clase de caracteres, a propósito. Un patrón estricto que rechace un número válido escrito por alguien en una emergencia hace más daño que almacenar uno malformado. Por la misma razón no se usa un tipo `DOMAIN`.

### 9.5 Búsqueda de texto

Columna generada `search_vector` de tipo `tsvector`, `STORED`, con índice GIN, en `help_requests` y en `info_resources`.

Dos detalles son determinantes:

1. **Siempre se pasa el idioma:** `to_tsvector('spanish', …)`. La forma de un solo argumento es `STABLE`, no `IMMUTABLE`, y PostgreSQL la rechaza en una columna generada. La forma de dos argumentos es inmutable y por eso funciona.
2. **`'spanish'`, no `'english'`.** La derivación de raíces y las palabras vacías tienen que corresponder al idioma en que la gente escribe. Con configuración inglesa, buscar «albergues» no encontraría «albergue».

En `info_resources` el vector está ponderado con `setweight`: una coincidencia en el nombre pesa más que una en la descripción, que es lo que espera quien escribe «hospital».

Se añade un índice trigrama sobre el nombre del recurso. La búsqueda de texto completo indexa palabras enteras, así que «hospi» no encontraría nada; el trigrama hace que la escritura parcial funcione, lo cual importa en un teclado de celular.

### 9.6 Índices

El criterio es indexar los caminos de acceso que realmente se consultan, y ninguno más. Cada índice extra encarece una inserción en un formulario público.

- **PostgreSQL no indexa las claves foráneas automáticamente.** Hay que declararlas a mano: `duplicate_of`, `verified_by`, `updated_by`, `resource_id` y el par polimórfico `(entity_type, entity_id)` del registro de auditoría.
- **El índice del tablero es parcial**, restringido a las filas visibles. Su predicado usa solo expresiones inmutables: la comparación con `now()` queda deliberadamente fuera, porque `now()` no es inmutable y haría ilegal el índice. El filtro por caducidad lo aplica la vista, no el índice.
- El `payload` del registro de auditoría es `jsonb` con `CHECK (jsonb_typeof(payload) = 'object')` y sin índice GIN: se escribe para auditar y se lee por entidad, nunca por su contenido.
- Los teléfonos del directorio son `text[]` y no una tabla aparte, porque son valores con orden y nada se une por ellos. Tampoco llevan índice GIN: nunca se consulta por teléfono, solo se muestran.

### 9.7 La vista pública

`public_help_requests` se declara con `security_invoker = false` y `security_barrier = true`, y ambas cosas son explícitas.

**`security_invoker = false`** hace que la vista se ejecute con los privilegios de su propietario. Por eso el rol `anon` puede leer a través de ella aunque no tenga ningún privilegio sobre la tabla `help_requests`. Ese salto de RLS es el diseño buscado: es lo que permite exponer una proyección estrecha y filtrada mientras el token de gestión, la prioridad y las coordenadas exactas siguen siendo inalcanzables.

Ponerlo en `true` haría que la vista evaluara RLS con los permisos de quien llama, y quien llama no tiene ninguno: el tablero dejaría de funcionar. Es un detalle de una línea con capacidad de romper el módulo entero, y por eso está fijado y documentado.

**`security_barrier = true`** impide que el planificador empuje una función suministrada por el usuario por debajo del `WHERE` de la vista, lo que podría filtrar filas que el filtro debía excluir.

La vista expone las coordenadas redondeadas a tres decimales y no expone la clave primaria, el token de gestión, la prioridad, las coordenadas exactas, quién verificó, de qué es duplicado, la fecha de caducidad ni ninguna marca de consentimiento.

### 9.8 Almacenamiento de archivos

| Bucket | Acceso | Contenido |
| --- | --- | --- |
| Fotos de necesidades | Lectura pública, sin listado, rutas basadas en UUID | Una foto por necesidad, sin metadatos, comprimida |
| Fotos del directorio | Lectura pública | Fotos de referencia de los recursos |

La escritura en ambos ocurre solo desde el servidor. Ninguna carga va directa del navegador al almacenamiento: la limpieza de metadatos de RNF-5.7 exige que el archivo pase por el servidor.

---

## 10. Decisiones de la organización

Estas decisiones no son técnicas y no bloquean la implementación. Bloquean la publicación.

| # | Decisión | Por qué importa |
| --- | --- | --- |
| D-1 | **Responsable del tratamiento de datos personales.** Qué entidad jurídica figura en el aviso de privacidad. | Con publicación abierta de teléfonos y fotos de personas vulnerables, alguien asume la responsabilidad legal de esa divulgación ante la Superintendencia de Industria y Comercio. |
| D-2 | **Quién modera, con qué frecuencia y con qué compromiso de respuesta.** | La moderación es reactiva por diseño. Sin nadie revisando, un teléfono publicado por un tercero malintencionado permanece indefinidamente, y una foto inapropiada también. No es un rol opcional. |
| D-3 | **Confirmación de la tabla de emparejamiento de la sección 6**, en particular que Sangre y Personas desaparecidas no participen en el emparejamiento. | Es la lógica que decide qué ve un aportante. Si está mal, el emparejamiento es inútil aunque funcione técnicamente. |

---

## 11. Criterios de aceptación

**Publicación y tablero**

- [ ] Un ciudadano publica una necesidad desde un celular, sin cuenta, en menos de 90 segundos, y recibe código de radicado y enlace de gestión.
- [ ] La necesidad aparece en el tablero público en menos de 60 segundos, con distintivo «Sin verificar».
- [ ] El formulario advierte de forma destacada, antes del campo de teléfono, que el nombre, el teléfono y la foto serán públicos.
- [ ] No se puede enviar sin marcar ambas casillas de consentimiento.
- [ ] Cualquier persona, sin autenticarse, filtra el tablero por categoría y comuna y llama con un toque.
- [ ] El barrio se escribe con autocompletado y, al coincidir, la comuna queda registrada sola.
- [ ] Un barrio ausente del catálogo **no impide publicar**: se guarda el texto y la zona queda sin asignar.
- [ ] Una necesidad con zona sin asignar aparece en el tablero. Verificado con prueba automatizada sobre la vista.
- [ ] Un barrio atribuido a una comuna que no le corresponde se rechaza en la base de datos. Verificado con prueba automatizada.
- [ ] El tablero ofrece el filtro «zona sin asignar».
- [ ] Un Moderador asigna la comuna a una necesidad sin resolver y puede añadir ese barrio al catálogo.
- [ ] El tablero responde `noindex` y `robots.txt` lo excluye. Verificado con prueba automatizada.

**Fotos**

- [ ] Una foto con coordenadas GPS en su EXIF se almacena sin ningún metadato. Verificado con prueba automatizada que inspecciona el archivo almacenado.
- [ ] La foto es visible en el detalle público de la necesidad.
- [ ] Un Moderador retira una foto y la necesidad sigue publicada.
- [ ] Las rutas del bucket no son enumerables y el listado está deshabilitado.

**Emparejamiento**

- [ ] Al seleccionar tipo de aporte y, opcionalmente, comuna, el contador y la lista de necesidades coincidentes se actualizan sin enviar el formulario.
- [ ] Sin comuna seleccionada, el emparejamiento incluye las necesidades con zona sin asignar.
- [ ] La correspondencia respeta la tabla de la sección 6. Verificado con una prueba unitaria por cada fila de la tabla.
- [ ] Con JavaScript deshabilitado, el formulario se envía y la confirmación muestra las coincidencias.
- [ ] Un aporte de tipo Dinero nunca solicita datos financieros, no muestra emparejamiento y redirige a entidades verificadas.
- [ ] Sin coincidencias, se explica y se ofrece el tablero completo.

**Gestión y ciclo de vida**

- [ ] Con su enlace de gestión y sin cuenta, una persona marca su necesidad como resuelta y la retira.
- [ ] Una necesidad retirada desaparece de inmediato del tablero, del detalle y de la API de filtrado.
- [ ] Una necesidad atendida se ve marcada 48 horas y luego se oculta.
- [ ] Una necesidad sin actividad se oculta a los 14 días.

**Seguridad**

- [ ] Ninguna variable de entorno de Supabase se expone al navegador. Verificado inspeccionando el bundle de cliente en CI.
- [ ] Un cliente anónimo no puede leer las tablas de necesidades ni de aportes, solo la vista pública. Verificado con prueba automatizada.
- [ ] La vista pública no expone token de gestión, prioridad ni coordenadas exactas. Verificado con prueba automatizada.
- [ ] El rol anónimo no puede suministrar prioridad ni estado de moderación al insertar. Verificado con prueba automatizada.
- [ ] La API de filtrado nunca devuelve más de 20 filas, con cualquier combinación de parámetros.
- [ ] El límite de tasa responde 429 en escrituras, filtrado y gestión de publicación.
- [ ] Un usuario ajeno al equipo no accede a la ruta de moderación.
- [ ] Toda acción de moderación queda registrada con autor y fecha, y el registro no admite modificación ni borrado.

**Directorio**

- [ ] El directorio se consulta, filtra y busca, con fecha de verificación visible en cada tarjeta.
- [ ] La búsqueda parcial encuentra resultados: «hospi» encuentra «Hospital».
- [ ] Un recurso muestra punto de encuentro y fotos de referencia con descripción.
- [ ] Un Moderador crea y actualiza un recurso y su estado de verificación.

**Transversales**

- [ ] Se cumplen los presupuestos de peso de §7.2.
- [ ] Auditoría de accesibilidad AA sin incidencias graves. Formularios operables con lector de pantalla. El contador en vivo se anuncia.
- [ ] Las líneas de emergencia oficiales son accesibles desde la pantalla principal en un toque.
- [ ] Aviso de privacidad publicado, con el responsable de D-1 identificado y el carácter público de los datos declarado de forma expresa.

---

## 12. Plan de implementación

Cada fase es desplegable. Ninguna deja la aplicación en estado intermedio.

| Fase | Contenido | Depende de |
| --- | --- | --- |
| 0 | Andamiaje: Next.js, TypeScript, Tailwind, clientes de Supabase solo de servidor, variables de entorno, presupuesto de peso y verificación del bundle en CI | — |
| 1 | Migraciones SQL, vista pública, RLS y políticas, privilegios por columna, buckets, semilla del directorio | Fase 0 |
| 2 | Pantalla principal, incluidas las líneas de emergencia | Fase 0 |
| 3 | Busco Información | Fases 1 y 2 |
| 4 | Necesito Ayuda, Tablero público y Gestión de la propia publicación, con limpieza de metadatos de imagen | Fases 1 y 2 |
| 5 | Motor de emparejamiento con pruebas unitarias | Fase 4, D-3 |
| 6 | Quiero Ayudar con emparejamiento en vivo y su degradación sin JavaScript | Fase 5 |
| 7 | Moderación, incluida la gestión del directorio, y aviso de privacidad | Fases 4 y 6, D-1 |
| 8 | PWA, service worker, caducidades automáticas, auditorías de rendimiento y accesibilidad | Todas |

La fase 4 es indivisible por seguridad, no por comodidad: desplegar la publicación de teléfonos y fotos sin el mecanismo de retiro dejaría a las personas sin forma de revertir su exposición, y sin la limpieza de metadatos publicaría la ubicación exacta de sus viviendas.

El directorio va antes del tablero deliberadamente: es el único módulo que entrega valor sin requerir masa crítica de usuarios ni un operador humano.

---

## 13. Trazabilidad con el documento fuente

| Documento fuente | Estado |
| --- | --- |
| §2.A Necesito ayuda | Implementado y ampliado a publicación pública — RF-1, RF-2, RF-4 |
| §2.B Quiero ayudar | Implementado y ampliado con emparejamiento — RF-3, §6 |
| §2.C Manos Amigas | Fuera del alcance. RF-3.10 solo registra el interés. |
| §2.D Centro de información | Implementado y ampliado con punto de encuentro y fotos de referencia — RF-5 |
| §2.E Asistente IA | Fuera del alcance |
| §2.F Centro de comando | Fuera del alcance. RF-6 cubre moderación, no coordinación. |
| §3 Pantalla principal | Implementado con tres accesos en vez de cuatro, más líneas de emergencia y accesos secundarios |
| §4 Campos de la necesidad | Implementado — RF-1.2, RF-1.3 |
| §4 Generación automática por IA al guardar | Fuera del alcance |
| §5 Prioridad | Estructura conservada, cálculo automático eliminado — RF-1.12 |
| §6 Tipos de aporte | Implementado — RF-3.2 |
| §6 No custodiar dinero | Implementado — RF-3.9 |
| §7 Voluntariado | Fuera del alcance |
| §8 Recursos del directorio | Implementado y ampliado — RF-5.3, RF-5.7 |
| No previsto en el documento fuente | Tablero de necesidades (RF-2), gestión de la propia publicación (RF-4), tabla de emparejamiento (§6), líneas de emergencia en portada (RF-0.4), limpieza de metadatos de imagen (RNF-5.7) |
